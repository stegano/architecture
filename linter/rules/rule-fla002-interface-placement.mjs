import path from "node:path";
import { createRequire } from "node:module";
import { matchesAnyGlob, toPosixPath } from "../path-resolver.mjs";
import {
  createViolation,
  findLineColumn,
  maskComments,
  PARSEABLE_SOURCE_EXTENSIONS,
} from "./shared.mjs";

const TYPE_DEFINITION_PATTERN = /\b(interface|type|enum)\s+[A-Za-z_$][\w$]*/gm;
const TYPE_DECLARATION_MESSAGE =
  "'interface', 'type', and 'enum' declarations are only allowed in files matched by interfaceAllowedGlobs.";
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

const maskStringLiterals = (content) => {
  let out = "";
  let i = 0;

  const isEscaped = (index) => {
    let slashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && content[cursor] === "\\"; cursor -= 1) {
      slashCount += 1;
    }
    return slashCount % 2 === 1;
  };

  while (i < content.length) {
    const ch = content[i];
    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch;
      const start = i;
      let cursor = i + 1;
      while (cursor < content.length) {
        const value = content[cursor];
        if (value === "\\" && cursor + 1 < content.length) {
          cursor += 2;
          continue;
        }

        if (value === quote && !isEscaped(cursor)) {
          cursor += 1;
          out += " ".repeat(cursor - start);
          i = cursor;
          break;
        }

        if (quote === "`" && value === "$" && content[cursor + 1] === "{") {
          cursor += 2;
          continue;
        }

        cursor += 1;
      }

      if (out === "" && cursor >= content.length) {
        out = " ".repeat(content.length);
        break;
      }

      if (cursor >= content.length && i < content.length - 1) {
        out += " ".repeat(cursor - start);
        i = cursor;
      }
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
};

const scanWithRegex = ({ fileAbs, content, rootDir }) => {
  const masked = maskStringLiterals(maskComments(content));
  const violations = [];
  for (const match of masked.matchAll(TYPE_DEFINITION_PATTERN)) {
    const index = typeof match.index === "number" ? match.index : 0;
    const { line, column } = findLineColumn(content, index);

    violations.push(
      createViolation({
        ruleId: "FLA002",
        fileAbs,
        rootDir,
        line,
        column,
        message: TYPE_DECLARATION_MESSAGE,
      }),
    );
  }

  return violations;
};

const scanWithAst = ({ fileAbs, content, rootDir }) => {
  const ts = getTypeScriptModule();
  if (!ts) {
    return scanWithRegex({ fileAbs, content, rootDir });
  }

  try {
    const sourceFile = ts.createSourceFile(
      fileAbs,
      content,
      ts.ScriptTarget.Latest,
      true,
      getScriptKind({ filename: fileAbs, ts }),
    );

    const violations = [];

    const visit = (node) => {
      if (
        node.kind === ts.SyntaxKind.InterfaceDeclaration ||
        node.kind === ts.SyntaxKind.TypeAliasDeclaration ||
        node.kind === ts.SyntaxKind.EnumDeclaration
      ) {
        const start = node.getStart(sourceFile, true);
        const { line, column } = findLineColumn(content, start);
        violations.push(
          createViolation({
            ruleId: "FLA002",
            fileAbs,
            rootDir,
            line,
            column,
            message: TYPE_DECLARATION_MESSAGE,
          }),
        );
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return violations;
  } catch {
    return scanWithRegex({ fileAbs, content, rootDir });
  }
};

export const RULE_FLA002 = {
  id: "FLA002",
  kind: "file",
  run: ({ fileAbs, content, context }) => {
    const { config, rootDir } = context;
    const ext = path.extname(fileAbs);
    if (!PARSEABLE_SOURCE_EXTENSIONS.has(ext)) {
      return [];
    }

    const relative = toPosixPath(path.relative(rootDir, fileAbs));
    if (matchesAnyGlob(relative, config.interfaceAllowedGlobs)) {
      return [];
    }

    return scanWithAst({ fileAbs, content, rootDir });
  },
};
