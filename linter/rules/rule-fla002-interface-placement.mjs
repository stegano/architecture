import path from "node:path";
import { matchesAnyGlob, toPosixPath } from "../path-resolver.mjs";
import {
  createViolation,
  findLineColumn,
  maskComments,
  PARSEABLE_SOURCE_EXTENSIONS,
} from "./shared.mjs";

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

    const masked = maskComments(content);
    const pattern = /\binterface\s+[A-Za-z_$][\w$]*/gm;
    const violations = [];

    for (const match of masked.matchAll(pattern)) {
      const index = typeof match.index === "number" ? match.index : 0;
      const { line, column } = findLineColumn(content, index);
      violations.push(
        createViolation({
          ruleId: "FLA002",
          fileAbs,
          rootDir,
          line,
          column,
          message:
            "'interface' declarations are only allowed in files matched by interfaceAllowedGlobs (default: **/*.type.ts).",
        }),
      );
    }

    return violations;
  },
};
