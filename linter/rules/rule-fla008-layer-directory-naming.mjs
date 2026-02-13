import path from "node:path";
import { splitSegments } from "../path-resolver.mjs";
import { createViolation } from "./shared.mjs";

export const RULE_FLA008 = {
  id: "FLA008",
  kind: "repo",
  run: ({ context }) => {
    const { config, rootDir, dirs } = context;
    if (!config.layerDirectoryNaming?.enabled) {
      return [];
    }

    const violations = [];
    const layerSet = new Set(config.layerDirs);
    const bareLayerNames = new Set(config.layerDirs.map((name) => name.replace(/^_/, "")));

    for (const dirAbs of dirs) {
      const rel = path.relative(rootDir, dirAbs);
      if (!rel || rel === ".") {
        continue;
      }

      const name = path.basename(dirAbs);
      const segments = splitSegments(rel);
      const inLayerScope = segments.some((segment) => layerSet.has(segment));

      if (bareLayerNames.has(name)) {
        violations.push(
          createViolation({
            ruleId: "FLA008",
            fileAbs: dirAbs,
            rootDir,
            message: `Layer directory '${name}' must use underscore-prefixed form (e.g. '_${name}').`,
          }),
        );
      }

      if (inLayerScope && name.startsWith("_") && !layerSet.has(name)) {
        violations.push(
          createViolation({
            ruleId: "FLA008",
            fileAbs: dirAbs,
            rootDir,
            message: `Unknown underscore-prefixed directory '${name}' found in layer scope. Use one of: ${config.layerDirs.join(", ")}.`,
          }),
        );
      }
    }

    return violations;
  },
};
