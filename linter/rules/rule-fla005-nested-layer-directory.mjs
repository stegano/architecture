import fs from "node:fs";
import path from "node:path";
import { createViolation } from "./shared.mjs";

export const RULE_FLA005 = {
  id: "FLA005",
  kind: "repo",
  run: ({ context }) => {
    const { config, rootDir, layerDirectories } = context;
    if (!config.nestedLayer?.enabled) {
      return [];
    }

    const violations = [];
    const layerSet = new Set(config.layerDirs);

    for (const dirAbs of layerDirectories) {
      const baseName = path.basename(dirAbs);
      if (!layerSet.has(baseName)) {
        continue;
      }

      let children = [];
      try {
        children = fs.readdirSync(dirAbs, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const child of children) {
        if (!child.isDirectory()) {
          continue;
        }

        if (!layerSet.has(child.name)) {
          continue;
        }

        const childAbs = path.join(dirAbs, child.name);
        violations.push(
          createViolation({
            ruleId: "FLA005",
            fileAbs: childAbs,
            rootDir,
            line: 1,
            column: 1,
            message: `Nested layer directory '${child.name}' cannot be a direct child of '${baseName}'. Place nested layers inside a module directory first.`,
          }),
        );
      }
    }

    return violations;
  },
};
