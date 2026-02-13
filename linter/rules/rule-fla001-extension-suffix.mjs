import path from "node:path";
import { createViolation, getSuffixFromFileName } from "./shared.mjs";

export const RULE_FLA001 = {
  id: "FLA001",
  kind: "file",
  run: ({ fileAbs, context }) => {
    const { config, rootDir } = context;
    const violations = [];
    const ext = path.extname(fileAbs);
    const fileName = path.basename(fileAbs);
    const allowedExts = new Set(config.allowedExtensions);

    if (!allowedExts.has(ext)) {
      violations.push(
        createViolation({
          ruleId: "FLA001",
          fileAbs,
          rootDir,
          message: `Extension '${ext || "(none)"}' is not allowed in layer files. Allowed: ${config.allowedExtensions.join(", ")}`,
        }),
      );
      return violations;
    }

    if (ext === ".ts" || ext === ".tsx") {
      const suffix = getSuffixFromFileName(fileName);
      if (suffix) {
        const allowedSuffixes = new Set([
          ...config.defaultTsSuffixes,
          ...config.extraTsSuffixes,
        ]);

        if (!allowedSuffixes.has(suffix)) {
          violations.push(
            createViolation({
              ruleId: "FLA001",
              fileAbs,
              rootDir,
              message: `Suffix '.${suffix}.${ext.slice(1)}' is not allowed. Allowed suffixes: ${[
                ...allowedSuffixes,
              ].join(", ")}`,
            }),
          );
        }
      }
    }

    return violations;
  },
};
