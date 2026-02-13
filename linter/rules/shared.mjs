import path from "node:path";
import { createRequire } from "node:module";
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

let tsModule;
let tsLoadAttempted = false;

const getTypeScriptModule = () => {
  if (tsLoadAttempted) {
    return tsModule;
  }

  tsLoadAttempted = true;
  try {
    const require = createRequire(import.meta.url);
    tsModule = require("typescript");
  } catch {
    tsModule = null;
  }

  return tsModule;
};

const getScriptKind = ({ filename, ts }) => {
  const ext = path.extname(filename);
  return ext === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
};

const parseImportSpecifiersFallback = (content) => {
  const imports = [];
  const isIdentifierChar = (value) => /[A-Za-z0-9_$]/.test(value);

  const isWordStart = (index, keyword) => {
    if (index > 0 && isIdentifierChar(content[index - 1])) {
      return false;
    }
    const end = index + keyword.length;
    if (end < content.length && isIdentifierChar(content[end])) {
      return false;
    }
    return true;
  };

  const isEscaped = (index) => {
    let slashes = 0;
    for (let cursor = index - 1; cursor >= 0 && content[cursor] === "\\"; cursor -= 1) {
      slashes += 1;
    }
    return slashes % 2 === 1;
  };

  const skipString = (start) => {
    const quote = content[start];
    let i = start + 1;
    if (quote === "`") {
      while (i < content.length) {
        const ch = content[i];
        if (ch === "`" && !isEscaped(i)) {
          return i + 1;
        }
        if (ch === "\\" && i + 1 < content.length) {
          i += 2;
          continue;
        }
        i += 1;
      }
      return i;
    }

    while (i < content.length) {
      const ch = content[i];
      if (ch === quote && !isEscaped(i)) {
        return i + 1;
      }
      if (ch === "\\" && i + 1 < content.length) {
        i += 2;
        continue;
      }
      i += 1;
    }
    return i;
  };

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];

    if (ch === "/" && content[i + 1] === "/") {
      i += 2;
      while (i < content.length && content[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    if (ch === "/" && content[i + 1] === "*") {
      i += 2;
      while (i < content.length - 1) {
        if (content[i] === "*" && content[i + 1] === "/") {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      i = skipString(i) - 1;
      continue;
    }

    if (ch === "i" && isWordStart(i, "import")) {
      const rem = content.slice(i);
      let match = rem.match(/^import(?:\s+type)?[\s\S]*?\sfrom\s*(['"])([^'"\n]+)\1/);
      if (match) {
        imports.push({ specifier: match[2], index: i + match.index + 1 });
        i += match[0].length - 1;
        continue;
      }

      match = rem.match(/^import\s*\(\s*(['"])([^'"\n]+)\1\s*\)/);
      if (match) {
        imports.push({ specifier: match[2], index: i + match.index + 1 });
        i += match[0].length - 1;
        continue;
      }
      continue;
    }

    if (ch === "e" && isWordStart(i, "export")) {
      const rem = content.slice(i);
      const match = rem.match(/^export[\s\S]*?\sfrom\s*(['"])([^'"\n]+)\1/);
      if (match) {
        imports.push({ specifier: match[2], index: i + match.index + 1 });
        i += match[0].length - 1;
      }
      continue;
    }

    if (ch === "r" && isWordStart(i, "require")) {
      const rem = content.slice(i);
      const match = rem.match(/^require\s*\(\s*(['"])([^'"\n]+)\1\s*\)/);
      if (match) {
        imports.push({ specifier: match[2], index: i + match.index + 1 });
        i += match[0].length - 1;
      }
    }
  }

  return imports;
};

const collectImportNodes = ({ node, ts, sourceFile }) => {
  const imports = [];

  const scan = (current) => {
    if (!current) {
      return;
    }

    if (current.kind === ts.SyntaxKind.ImportDeclaration) {
      const moduleSpecifier = current.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        imports.push({
          specifier: moduleSpecifier.text,
          index: moduleSpecifier.getStart(sourceFile, true),
        });
      }
    } else if (current.kind === ts.SyntaxKind.ExportDeclaration) {
      const moduleSpecifier = current.moduleSpecifier;
      if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        imports.push({
          specifier: moduleSpecifier.text,
          index: moduleSpecifier.getStart(sourceFile, true),
        });
      }
    } else if (current.kind === ts.SyntaxKind.ImportExpression) {
      const moduleSpecifier = current.argument;
      if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        imports.push({
          specifier: moduleSpecifier.text,
          index: moduleSpecifier.getStart(sourceFile, true),
        });
      }
    } else if (
      current.kind === ts.SyntaxKind.CallExpression &&
      current.expression &&
      current.expression.kind === ts.SyntaxKind.Identifier &&
      current.expression.text === "require" &&
      current.arguments.length > 0 &&
      current.arguments[0] &&
      ts.isStringLiteral(current.arguments[0])
    ) {
      imports.push({
        specifier: current.arguments[0].text,
        index: current.arguments[0].getStart(sourceFile, true),
      });
    }

    ts.forEachChild(current, scan);
  };

  scan(node);
  return imports;
};

export const parseImportSpecifiers = ({ content, filename }) => {
  const ts = getTypeScriptModule();
  if (!ts) {
    return parseImportSpecifiersFallback(content);
  }

  const sourceFile = ts.createSourceFile(
    filename || "tmp.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind({ filename: filename || "tmp.ts", ts }),
  );

  return collectImportNodes({ node: sourceFile, ts, sourceFile });
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
  for (const dependency of parseImportSpecifiers({ content, filename: fileAbs })) {
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
