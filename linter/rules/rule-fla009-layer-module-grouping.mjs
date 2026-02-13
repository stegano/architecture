import fs from "node:fs";
import path from "node:path";
import { createViolation } from "./shared.mjs";

const toModuleName = (fileName) => {
  const ext = path.extname(fileName);
  const stem = fileName.slice(0, -ext.length);
  return stem.split(".")[0] || null;
};

export const RULE_FLA009 = {
  id: "FLA009",
  kind: "repo",
  run: ({ context }) => {
    const { config, rootDir, layerDirectories } = context;
    if (!config.moduleGrouping?.enabled) {
      return [];
    }

    const layerSet = new Set(config.layerDirs);
    const violations = [];

    for (const layerDirAbs of layerDirectories) {
      const layerName = path.basename(layerDirAbs);
      if (!layerSet.has(layerName)) {
        continue;
      }

      let children = [];
      try {
        children = fs.readdirSync(layerDirAbs, { withFileTypes: true });
      } catch {
        continue;
      }

      const moduleDirs = new Set();
      const moduleFiles = new Set();

      for (const child of children) {
        if (child.name.startsWith(".")) {
          continue;
        }

        if (child.isDirectory()) {
          if (layerSet.has(child.name)) {
            continue;
          }
          if (child.name.startsWith("_")) {
            continue;
          }
          moduleDirs.add(child.name);
          continue;
        }

        if (child.isFile()) {
          if (child.name.startsWith("index.")) {
            continue;
          }
          const moduleName = toModuleName(child.name);
          if (moduleName) {
            moduleFiles.add(moduleName);
          }
        }
      }

      if (moduleDirs.size > 0 && moduleFiles.size > 0) {
        violations.push(
          createViolation({
            ruleId: "FLA009",
            fileAbs: layerDirAbs,
            rootDir,
            message: `Layer directory '${layerName}' mixes directory-based modules and file-based modules. Use one grouping style per layer directory.`,
          }),
        );
      }

      for (const moduleName of moduleDirs) {
        if (!moduleFiles.has(moduleName)) {
          continue;
        }

        violations.push(
          createViolation({
            ruleId: "FLA009",
            fileAbs: layerDirAbs,
            rootDir,
            message: `Module '${moduleName}' exists as both file and directory under '${layerName}'. If a module has nested layers, keep it directory-based only.`,
          }),
        );
      }
    }

    return violations;
  },
};
