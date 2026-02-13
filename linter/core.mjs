import fs from "node:fs";
import path from "node:path";
import { DEFAULT_LAYER_RANKS, hasLayerSegment, toPosixPath } from "./path-resolver.mjs";
import { FILE_RULES, REPO_RULES } from "./rules/index.mjs";
import { PARSEABLE_SOURCE_EXTENSIONS } from "./rules/shared.mjs";

export const DEFAULT_CONFIG = {
  layerDirs: ["_pages", "_containers", "_states", "_components", "_apis", "_utils"],
  ignoreDirs: [".git", "node_modules", "docs", "linter"],
  allowedExtensions: [".ts", ".tsx"],
  defaultTsSuffixes: ["type", "schema", "stories", "test"],
  extraTsSuffixes: [],
  interfaceAllowedGlobs: ["**/*.type.ts"],
  pathAliases: {},
  nestedLayer: {
    enabled: true,
  },
  singleUseGlobal: {
    enabled: true,
    layers: ["_states", "_components"],
    minUpperModuleReferences: 2,
  },
  namingConvention: {
    enabled: true,
  },
  layerDirectoryNaming: {
    enabled: true,
  },
  moduleGrouping: {
    enabled: true,
  },
};

const ensureArray = (value, fallback) => (Array.isArray(value) ? value : fallback);
const ensureObject = (value, fallback) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : fallback;

export const loadConfig = ({ rootDir, configPath }) => {
  const resolvedPath = configPath
    ? path.resolve(rootDir, configPath)
    : path.resolve(rootDir, "linter/fla-lint.config.json");

  const baseConfig = structuredClone(DEFAULT_CONFIG);

  if (!fs.existsSync(resolvedPath)) {
    return {
      config: baseConfig,
      resolvedPath,
      loaded: false,
    };
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);

  const nestedLayer = {
    ...baseConfig.nestedLayer,
    ...ensureObject(parsed.nestedLayer, {}),
  };

  const singleUseGlobal = {
    ...baseConfig.singleUseGlobal,
    ...ensureObject(parsed.singleUseGlobal, {}),
    layers: ensureArray(
      parsed.singleUseGlobal?.layers,
      baseConfig.singleUseGlobal.layers,
    ),
  };

  const namingConvention = {
    ...baseConfig.namingConvention,
    ...ensureObject(parsed.namingConvention, {}),
  };

  const layerDirectoryNaming = {
    ...baseConfig.layerDirectoryNaming,
    ...ensureObject(parsed.layerDirectoryNaming, {}),
  };

  const moduleGrouping = {
    ...baseConfig.moduleGrouping,
    ...ensureObject(parsed.moduleGrouping, {}),
  };

  const config = {
    ...baseConfig,
    ...parsed,
    nestedLayer,
    singleUseGlobal,
    namingConvention,
    layerDirectoryNaming,
    moduleGrouping,
    layerDirs: ensureArray(parsed.layerDirs, baseConfig.layerDirs),
    ignoreDirs: ensureArray(parsed.ignoreDirs, baseConfig.ignoreDirs),
    allowedExtensions: ensureArray(parsed.allowedExtensions, baseConfig.allowedExtensions),
    defaultTsSuffixes: ensureArray(parsed.defaultTsSuffixes, baseConfig.defaultTsSuffixes),
    extraTsSuffixes: ensureArray(parsed.extraTsSuffixes, baseConfig.extraTsSuffixes),
    interfaceAllowedGlobs: ensureArray(
      parsed.interfaceAllowedGlobs,
      baseConfig.interfaceAllowedGlobs,
    ),
    pathAliases:
      parsed.pathAliases && typeof parsed.pathAliases === "object"
        ? parsed.pathAliases
        : baseConfig.pathAliases,
  };

  return {
    config,
    resolvedPath,
    loaded: true,
  };
};

const walkEntries = ({ rootDir, ignoreDirs }) => {
  const files = [];
  const dirs = [];
  const ignoreSet = new Set(ignoreDirs);

  const visit = (dirAbs) => {
    dirs.push(dirAbs);

    const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === ".DS_Store") {
        continue;
      }

      const entryAbs = path.join(dirAbs, entry.name);
      if (entry.isDirectory()) {
        if (ignoreSet.has(entry.name)) {
          continue;
        }
        visit(entryAbs);
        continue;
      }

      if (entry.isFile()) {
        files.push(entryAbs);
      }
    }
  };

  visit(rootDir);
  return { files, dirs };
};

const formatText = ({ violations, rootDir }) => {
  const lines = violations.map((item) => {
    const rel = toPosixPath(path.relative(rootDir, path.resolve(rootDir, item.filePath)));
    return `${rel}:${item.line}:${item.column} [${item.ruleId}] ${item.message}`;
  });

  return lines.join("\n");
};

export const runLinter = ({
  rootDir = process.cwd(),
  configPath,
  format = "text",
}) => {
  const { config, loaded, resolvedPath } = loadConfig({ rootDir, configPath });
  const layerRanks = {
    ...DEFAULT_LAYER_RANKS,
  };

  const { files, dirs } = walkEntries({ rootDir, ignoreDirs: config.ignoreDirs });

  const candidateFiles = files.filter((fileAbs) =>
    hasLayerSegment(path.relative(rootDir, fileAbs), config.layerDirs),
  );

  const layerDirectories = dirs.filter((dirAbs) =>
    config.layerDirs.includes(path.basename(dirAbs)),
  );

  const fileContents = new Map();
  for (const fileAbs of candidateFiles) {
    const ext = path.extname(fileAbs);
    const content = PARSEABLE_SOURCE_EXTENSIONS.has(ext)
      ? fs.readFileSync(fileAbs, "utf8")
      : "";
    fileContents.set(fileAbs, content);
  }

  const context = {
    rootDir,
    config,
    layerRanks,
    files,
    dirs,
    candidateFiles,
    layerDirectories,
    fileContents,
  };

  const violations = [];

  for (const fileAbs of candidateFiles) {
    const content = fileContents.get(fileAbs) || "";
    for (const rule of FILE_RULES) {
      const result = rule.run({ fileAbs, content, context }) || [];
      violations.push(...result);
    }
  }

  for (const rule of REPO_RULES) {
    const result = rule.run({ context }) || [];
    violations.push(...result);
  }

  violations.sort((a, b) => {
    if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
    if (a.line !== b.line) return a.line - b.line;
    if (a.column !== b.column) return a.column - b.column;
    return a.ruleId.localeCompare(b.ruleId);
  });

  const ruleCounts = violations.reduce((acc, item) => {
    acc[item.ruleId] = (acc[item.ruleId] || 0) + 1;
    return acc;
  }, {});

  const summary = {
    scannedFiles: candidateFiles.length,
    errorCount: violations.length,
    ruleCounts,
    configPath: toPosixPath(path.relative(rootDir, resolvedPath)),
    configLoaded: loaded,
  };

  if (format === "json") {
    return {
      exitCode: violations.length > 0 ? 1 : 0,
      output: JSON.stringify({ summary, violations }, null, 2),
      summary,
      violations,
    };
  }

  const body = violations.length > 0 ? `${formatText({ violations, rootDir })}\n` : "";
  const trailer = `Scanned ${summary.scannedFiles} files. Found ${summary.errorCount} errors.`;

  return {
    exitCode: violations.length > 0 ? 1 : 0,
    output: `${body}${trailer}`,
    summary,
    violations,
  };
};
