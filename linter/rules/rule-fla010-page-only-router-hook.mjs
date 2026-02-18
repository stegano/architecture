import path from "node:path";
import {
  createViolation,
  findLineColumn,
  getModuleInfo,
  PARSEABLE_SOURCE_EXTENSIONS,
  maskComments,
} from "./shared.mjs";

const ROUTER_MODULE_PATTERNS = [
  /^next\/(app\/)?navigation$/,
  /^next\/router$/,
  /^next\/compat\/router$/,
  /^react-router$/,
  /^react-router-dom(\/.*)?$/,
  /^@remix-run\/router$/,
];

const ROUTER_HOOK_IMPORT_RE = /\bimport\s+([\s\S]*?)\s+from\s*(['"])([^'"]+)\2/g;
const DIRECT_HOOK_CALL_RE = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\??\s*\(/g;
const NAMESPACE_HOOK_CALL_RE = /\b([A-Za-z_$][A-Za-z0-9_$]*)\s*\.\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\??\s*\(/g;

const isIdentifier = (value) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
const isRouterModule = (specifier) =>
  ROUTER_MODULE_PATTERNS.some((pattern) => pattern.test(specifier));
const isRouterHook = (value) => /^use[A-Z0-9_$][A-Za-z0-9_$]*$/.test(value);

const collectImportNames = (content) => {
  const masked = maskComments(content);
  const imports = new Set();
  const namespaceAliases = new Set();
  let match;

  while ((match = ROUTER_HOOK_IMPORT_RE.exec(masked))) {
    const importClause = match[1].trim();
    const moduleSpecifier = match[3].trim();
    if (!isRouterModule(moduleSpecifier)) {
      continue;
    }

    const namespaceMatch = importClause.match(/\*\s*as\s*([A-Za-z_$][A-Za-z0-9_$]*)/g);
    if (namespaceMatch) {
      for (const item of namespaceMatch) {
        const alias = item.match(/\b([A-Za-z_$][A-Za-z0-9_$]*)$/)?.[1];
        if (alias) {
          namespaceAliases.add(alias);
        }
      }
    }

    const namedBlockMatch = importClause.match(/\{([\s\S]*?)\}/);
    if (namedBlockMatch) {
      const entries = namedBlockMatch[1]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      for (const entry of entries) {
        if (entry.startsWith("...")) {
          continue;
        }

        const matchResult = entry.match(
          /^(?:type\s+)?([A-Za-z_$][A-Za-z0-9_$]*)(?:\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*))?$/,
        );
        if (!matchResult) {
          continue;
        }

        const localName = matchResult[2] || matchResult[1];
        if (isRouterHook(localName)) {
          imports.add(localName);
        }
      }
    }

    let defaultAndOthers = importClause.replace(/\{[\s\S]*?\}/g, " ");
    defaultAndOthers = defaultAndOthers.replace(/\*\s*as\s*[A-Za-z_$][A-Za-z0-9_$]*/g, " ");
    defaultAndOthers = defaultAndOthers.replace(/^\s*type\s+/i, "").trim();

    if (!defaultAndOthers) {
      continue;
    }

    const defaults = defaultAndOthers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const item of defaults) {
      if (!isIdentifier(item) || item === "type" || item === "from") {
        continue;
      }

      if (isRouterHook(item)) {
        imports.add(item);
      }
    }
  }

  return { imports, namespaceAliases };
};

export const RULE_FLA010 = {
  id: "FLA010",
  kind: "file",
  run: ({ fileAbs, content, context }) => {
    const { config, rootDir, layerRanks } = context;
    const ext = path.extname(fileAbs);
    if (!PARSEABLE_SOURCE_EXTENSIONS.has(ext)) {
      return [];
    }

    const sourceInfo = getModuleInfo({
      fileAbs,
      rootDir,
      config,
      layerRanks,
    });
    if (!sourceInfo || sourceInfo.layer === "_pages") {
      return [];
    }

  const { imports, namespaceAliases } = collectImportNames(content);
    if (imports.size === 0 && namespaceAliases.size === 0) {
      return [];
    }

    const violations = [];
    const masked = maskComments(content);
    const reported = new Set();

    if (imports.size > 0) {
      let hookCall;
      while ((hookCall = DIRECT_HOOK_CALL_RE.exec(masked))) {
        const hook = hookCall[1];
        if (!imports.has(hook)) {
          continue;
        }

        const prev = hookCall.index > 0 ? masked[hookCall.index - 1] : "";
        if (prev === ".") {
          continue;
        }

        const pos = hookCall.index;
        const key = `direct:${hook}:${pos}`;
        if (reported.has(key)) {
          continue;
        }
        reported.add(key);

        const { line, column } = findLineColumn(content, pos);
        violations.push(
          createViolation({
            ruleId: "FLA010",
            fileAbs,
            rootDir,
            line,
            column,
            message: `Router hook '${hook}' is only allowed in _pages layers.`,
          }),
        );
      }
    }

    let namespaceCall;
    while ((namespaceCall = NAMESPACE_HOOK_CALL_RE.exec(masked))) {
      const namespace = namespaceCall[1];
      const hook = namespaceCall[2];
      if (!namespaceAliases.has(namespace) || !isRouterHook(hook)) {
        continue;
      }

      const pos = namespaceCall.index + namespaceCall[0].indexOf(hook);
      const key = `namespace:${namespace}.${hook}:${pos}`;
      if (reported.has(key)) {
        continue;
      }
      reported.add(key);

      const { line, column } = findLineColumn(content, pos);
      violations.push(
        createViolation({
          ruleId: "FLA010",
          fileAbs,
          rootDir,
          line,
          column,
          message: `Router hook '${hook}' is only allowed in _pages layers.`,
        }),
      );
    }

    return violations;
  },
};
