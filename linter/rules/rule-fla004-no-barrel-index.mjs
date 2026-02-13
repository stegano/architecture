import path from "node:path";
import { createViolation } from "./shared.mjs";

export const RULE_FLA004 = {
  id: "FLA004",
  kind: "file",
  run: ({ fileAbs, context }) => {
    const { rootDir } = context;
    const fileName = path.basename(fileAbs).toLowerCase();
    if (!fileName.startsWith("index.")) {
      return [];
    }

    return [
      createViolation({
        ruleId: "FLA004",
        fileAbs,
        rootDir,
        message: "Barrel files are forbidden in layer directories (index.*).",
      }),
    ];
  },
};
