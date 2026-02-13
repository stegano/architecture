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
  singleUseLayerModule: {
    enabled: true,
    layers: ["_pages", "_containers", "_states", "_components", "_apis", "_utils"],
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

const readJsonFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isDirectory = (value) => {
  try {
    return fs.statSync(value).isDirectory();
  } catch {
    return false;
  }
};

const resolveProjectRoot = ({ startDir, markerFiles }) => {
  const markers = markerFiles || [];
  if (!startDir || typeof startDir !== "string") {
    return {
      rootDir: process.cwd(),
      markerPath: null,
      markerFile: null,
    };
  }

  let currentDir = path.resolve(startDir);
  let previousDir = null;

  while (currentDir !== previousDir) {
    for (const marker of markers) {
      const markerPath = path.resolve(currentDir, marker);
      if (readJsonFile(markerPath)) {
        return {
          rootDir: currentDir,
          markerPath,
          markerFile: marker,
        };
      }
    }

    previousDir = currentDir;
    const parentDir = path.dirname(currentDir);
    if (!isDirectory(parentDir) || parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return {
    rootDir: path.resolve(startDir),
    markerPath: null,
    markerFile: null,
  };
};

const resolveTsConfigExtendsPath = ({ extendsValue, fromFile }) => {
  if (typeof extendsValue !== "string" || extendsValue.length === 0) {
    return null;
  }

  const trimmed = extendsValue.trim();
  if (
    !trimmed.startsWith(".") &&
    !trimmed.startsWith("/") &&
    !trimmed.startsWith("..")
  ) {
    return null;
  }

  const baseDir = path.dirname(fromFile);
  const candidates = [path.resolve(baseDir, trimmed)];
  if (!candidates[0].endsWith(".json")) {
    candidates.push(`${candidates[0]}.json`);
  }

  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const extractPathAliasesFromParsedConfig = (parsed, tsConfigPath) => {
  if (!parsed || typeof parsed !== "object" || !parsed.compilerOptions) {
    return {};
  }

  const compilerOptions = parsed.compilerOptions;
  if (!compilerOptions.paths || typeof compilerOptions.paths !== "object") {
    return {};
  }

  const baseDir = path.dirname(tsConfigPath);
  const baseUrl = compilerOptions.baseUrl
    ? path.resolve(baseDir, compilerOptions.baseUrl)
    : baseDir;

  const aliases = {};
  for (const [aliasKey, aliasTargets] of Object.entries(compilerOptions.paths)) {
    if (!Array.isArray(aliasTargets) || aliasTargets.length < 1) {
      continue;
    }

    const rawTarget = aliasTargets[0];
    if (typeof rawTarget !== "string" || rawTarget.length === 0) {
      continue;
    }

    const trimmedTarget = rawTarget.endsWith("/*")
      ? rawTarget.slice(0, -2)
      : rawTarget;

    aliases[aliasKey] = path.isAbsolute(trimmedTarget)
      ? trimmedTarget
      : path.resolve(baseUrl, trimmedTarget);
  }

  return aliases;
};

const collectPathAliasesFromTsConfig = (tsConfigPath, visited = new Set()) => {
  const absPath = path.resolve(tsConfigPath);
  if (visited.has(absPath)) {
    return {};
  }
  visited.add(absPath);

  const parsed = readJsonFile(absPath);
  if (!parsed) {
    return {};
  }

  let aliases = {};
  const extendsValue = parsed.extends;
  if (typeof extendsValue === "string" && extendsValue.length > 0) {
    const parentConfig = resolveTsConfigExtendsPath({
      extendsValue,
      fromFile: absPath,
    });
    if (parentConfig) {
      aliases = collectPathAliasesFromTsConfig(parentConfig, visited);
    }
  }

  return {
    ...aliases,
    ...extractPathAliasesFromParsedConfig(parsed, absPath),
  };
};

const extractPathAliasesFromTsConfigFile = (tsConfigPath) =>
  collectPathAliasesFromTsConfig(tsConfigPath);

const loadPathAliasesFromProjectConfig = (rootDir) => {
  const { rootDir: projectRoot } = resolveProjectRoot({
    startDir: rootDir,
    markerFiles: ["tsconfig.json", "jsconfig.json"],
  });

  const candidatePaths = [
    path.resolve(projectRoot, "tsconfig.json"),
    path.resolve(projectRoot, "jsconfig.json"),
  ];

  const aliases = {};
  for (const candidate of candidatePaths) {
    const found = extractPathAliasesFromTsConfigFile(candidate);
    Object.assign(aliases, found);
  }

  return aliases;
};

export const loadConfig = ({ rootDir, configPath }) => {
  const { rootDir: resolvedRootDir } = resolveProjectRoot({
    startDir: rootDir,
    markerFiles: ["linter/fla-lint.config.json", "tsconfig.json", "jsconfig.json"],
  });

  const resolvedPath = configPath
    ? path.resolve(rootDir, configPath)
    : path.resolve(resolvedRootDir, "linter/fla-lint.config.json");
  const discoveredAliases = loadPathAliasesFromProjectConfig(resolvedRootDir);

  if (!fs.existsSync(resolvedPath)) {
    const config = {
      ...DEFAULT_CONFIG,
      pathAliases: {
        ...discoveredAliases,
        ...DEFAULT_CONFIG.pathAliases,
      },
    };

    return {
      config,
      resolvedPath,
      loaded: false,
    };
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);

  const nestedLayer = {
    ...DEFAULT_CONFIG.nestedLayer,
    ...ensureObject(parsed.nestedLayer, {}),
  };

  const singleUseLayerModule = {
    ...DEFAULT_CONFIG.singleUseLayerModule,
    ...ensureObject(parsed.singleUseLayerModule, {}),
    layers: ensureArray(
      parsed.singleUseLayerModule?.layers,
      DEFAULT_CONFIG.singleUseLayerModule.layers,
    ),
  };

  const namingConvention = {
    ...DEFAULT_CONFIG.namingConvention,
    ...ensureObject(parsed.namingConvention, {}),
  };

  const layerDirectoryNaming = {
    ...DEFAULT_CONFIG.layerDirectoryNaming,
    ...ensureObject(parsed.layerDirectoryNaming, {}),
  };

  const moduleGrouping = {
    ...DEFAULT_CONFIG.moduleGrouping,
    ...ensureObject(parsed.moduleGrouping, {}),
  };

  const config = {
    ...DEFAULT_CONFIG,
    ...parsed,
    nestedLayer,
    singleUseLayerModule,
    namingConvention,
    layerDirectoryNaming,
    moduleGrouping,
    layerDirs: ensureArray(parsed.layerDirs, DEFAULT_CONFIG.layerDirs),
    ignoreDirs: ensureArray(parsed.ignoreDirs, DEFAULT_CONFIG.ignoreDirs),
    allowedExtensions: ensureArray(parsed.allowedExtensions, DEFAULT_CONFIG.allowedExtensions),
    defaultTsSuffixes: ensureArray(parsed.defaultTsSuffixes, DEFAULT_CONFIG.defaultTsSuffixes),
    extraTsSuffixes: ensureArray(parsed.extraTsSuffixes, DEFAULT_CONFIG.extraTsSuffixes),
    interfaceAllowedGlobs: ensureArray(
      parsed.interfaceAllowedGlobs,
      DEFAULT_CONFIG.interfaceAllowedGlobs,
    ),
    pathAliases: {
      ...discoveredAliases,
      ...ensureObject(parsed.pathAliases, DEFAULT_CONFIG.pathAliases),
    },
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
  const ruleCounts = violations.reduce((acc, item) => {
    acc[item.ruleId] = (acc[item.ruleId] || 0) + 1;
    return acc;
  }, {});

  const fileMap = new Map();
  for (const item of violations) {
    const rel = toPosixPath(path.relative(rootDir, path.resolve(rootDir, item.filePath)));
    const list = fileMap.get(rel) || [];
    list.push(item);
    fileMap.set(rel, list);
  }

  const lines = [`Found ${violations.length} lint error(s).`];

  const filePaths = [...fileMap.keys()].sort();
  for (const file of filePaths) {
    lines.push(`\n${file}`);
    const entries = (fileMap.get(file) || []).sort((a, b) => {
      if (a.line !== b.line) return a.line - b.line;
      if (a.column !== b.column) return a.column - b.column;
      return a.ruleId.localeCompare(b.ruleId);
    });

    for (const item of entries) {
      lines.push(
        `  line ${item.line}:${item.column} [${item.ruleId}] ${item.message}`,
      );
    }
  }

  const summaryLines = Object.keys(ruleCounts)
    .sort()
    .map((ruleId) => `${ruleId}: ${ruleCounts[ruleId]}`);

  lines.push("\nRule summary:");
  lines.push(...summaryLines.map((line) => `  ${line}`));

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
  const scannedFileNamesTop10 = candidateFiles
    .slice(0, 10)
    .map((fileAbs) => toPosixPath(path.relative(rootDir, fileAbs)));

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
    scannedFileNamesTop10,
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
  const scannedPreview = summary.scannedFileNamesTop10.length
    ? `\nTop 10 scanned files:\n${summary.scannedFileNamesTop10
        .map((filePath) => `  - ${filePath}`)
        .join("\n")}`
    : "";

  return {
    exitCode: violations.length > 0 ? 1 : 0,
    output: `${body}${trailer}${scannedPreview}`,
    summary,
    violations,
  };
};
