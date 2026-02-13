import path from "node:path";
import {
  getLayerRank,
  hasLayerSegment,
  isExternalSpecifier,
  resolveSpecifier,
  splitSegments,
  toPosixPath,
} from "../path-resolver.mjs";

export const PARSEABLE_SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

export const createViolation = ({
  ruleId,
  fileAbs,
  rootDir,
  message,
  line = 1,
  column = 1,
}) => ({
  ruleId,
  message,
  filePath: toPosixPath(path.relative(rootDir, fileAbs)),
  line,
  column,
});

const maskMatch = (value) => value.replace(/[^\n]/g, " ");

export const maskComments = (content) => {
  let out = content;
  out = out.replace(/\/\*[\s\S]*?\*\//g, maskMatch);
  out = out.replace(/\/\/[^\n]*/g, maskMatch);
  return out;
};

export const findLineColumn = (source, index) => {
  if (index < 0) {
    return { line: 1, column: 1 };
  }

  let line = 1;
  let column = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
};

export const getSuffixFromFileName = (fileName) => {
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, -ext.length);
  const parts = stem.split(".");
  if (parts.length <= 1) {
    return null;
  }
  return parts.at(-1);
};

const IMPORT_PATTERNS = [
  /\bimport\s+(?:type\s+)?[\s\S]*?\sfrom\s*(['"])([^'"\n]+)\1/gm,
  /\bexport\s+[\s\S]*?\sfrom\s*(['"])([^'"\n]+)\1/gm,
  /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/gm,
  /\brequire\s*\(\s*(['"])([^'"\n]+)\1\s*\)/gm,
];

export const parseImportSpecifiers = (content) => {
  const code = maskComments(content);
  const imports = [];

  for (const pattern of IMPORT_PATTERNS) {
    for (const match of code.matchAll(pattern)) {
      const full = match[0];
      const quote = match[1];
      const specifier = match[2];
      const quoted = `${quote}${specifier}${quote}`;
      const localIndex = full.indexOf(quoted);
      const index =
        typeof match.index === "number"
          ? match.index + Math.max(localIndex + 1, 0)
          : 0;

      imports.push({ specifier, index });
    }
  }

  return imports;
};

const getInnermostLayerIndex = (segments, layerDirs) => {
  const layerSet = new Set(layerDirs);
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (layerSet.has(segments[i])) {
      return i;
    }
  }
  return -1;
};

const toModuleName = (segment) => {
  if (!segment) {
    return null;
  }

  if (!segment.includes(".")) {
    return segment;
  }

  return segment.split(".")[0] || null;
};

export const getModuleInfo = ({ fileAbs, rootDir, config, layerRanks }) => {
  const rel = toPosixPath(path.relative(rootDir, fileAbs));
  const segments = splitSegments(rel);
  const layerIndex = getInnermostLayerIndex(segments, config.layerDirs);

  if (layerIndex < 0) {
    return null;
  }

  const layer = segments[layerIndex];
  const rank = getLayerRank(fileAbs, config.layerDirs, layerRanks);
  const hasAncestorLayer = segments
    .slice(0, layerIndex)
    .some((segment) => config.layerDirs.includes(segment));
  const isGlobal = !hasAncestorLayer;

  const moduleSegment = segments[layerIndex + 1] || null;
  const moduleName = toModuleName(moduleSegment);
  const moduleKey = moduleName ? `${layer}/${moduleName}` : null;

  return {
    fileAbs,
    relativePath: rel,
    layer,
    rank,
    isGlobal,
    moduleName,
    moduleKey,
  };
};

export const collectLayerImportEdges = ({
  fileAbs,
  content,
  rootDir,
  config,
  layerRanks,
}) => {
  const source = getModuleInfo({ fileAbs, rootDir, config, layerRanks });
  if (!source) {
    return [];
  }

  const edges = [];
  for (const dependency of parseImportSpecifiers(content)) {
    if (isExternalSpecifier(dependency.specifier, config.pathAliases)) {
      continue;
    }

    const targetAbs = resolveSpecifier({
      specifier: dependency.specifier,
      sourceFileAbs: fileAbs,
      rootDir,
      aliases: config.pathAliases,
    });

    if (!targetAbs || !hasLayerSegment(targetAbs, config.layerDirs)) {
      continue;
    }

    const target = getModuleInfo({
      fileAbs: targetAbs,
      rootDir,
      config,
      layerRanks,
    });

    if (!target) {
      continue;
    }

    const { line, column } = findLineColumn(content, dependency.index);
    edges.push({
      source,
      target,
      specifier: dependency.specifier,
      line,
      column,
    });
  }

  return edges;
};
