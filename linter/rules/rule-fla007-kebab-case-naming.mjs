import path from "node:path";
import { hasLayerSegment, splitSegments, toPosixPath } from "../path-resolver.mjs";
import { createViolation } from "./shared.mjs";

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isKebabCase = (value) => KEBAB_CASE.test(value);

const hasLayerScope = (relativePath, layerDirs) => hasLayerSegment(relativePath, layerDirs);

export const RULE_FLA007 = {
  id: "FLA007",
  kind: "repo",
  run: ({ context }) => {
    const { config, rootDir, files, dirs } = context;
    if (!config.namingConvention?.enabled) {
      return [];
    }

    const violations = [];
    const layerSet = new Set(config.layerDirs);

    for (const dirAbs of dirs) {
      const rel = path.relative(rootDir, dirAbs);
      if (!rel || rel === ".") {
        continue;
      }

      if (!hasLayerScope(rel, config.layerDirs)) {
        continue;
      }

      const name = path.basename(dirAbs);
      if (layerSet.has(name)) {
        continue;
      }

      if (name.startsWith("_")) {
        continue;
      }

      if (!isKebabCase(name)) {
        violations.push(
          createViolation({
            ruleId: "FLA007",
            fileAbs: dirAbs,
            rootDir,
            message: `Directory name '${name}' must be kebab-case.`,
          }),
        );
      }
    }

    for (const fileAbs of files) {
      const rel = path.relative(rootDir, fileAbs);
      const relPosix = toPosixPath(rel);
      if (!hasLayerScope(rel, config.layerDirs)) {
        continue;
      }

      const fileName = path.basename(fileAbs);
      const ext = path.extname(fileName);
      const stem = fileName.slice(0, -ext.length);
      const parts = stem.split(".");
      const moduleName = parts[0] || "";

      if (!isKebabCase(moduleName)) {
        violations.push(
          createViolation({
            ruleId: "FLA007",
            fileAbs,
            rootDir,
            message: `File module name '${moduleName}' must be kebab-case.`,
          }),
        );
        continue;
      }

      const suffixTokens = parts.slice(1);
      for (const token of suffixTokens) {
        if (!isKebabCase(token)) {
          violations.push(
            createViolation({
              ruleId: "FLA007",
              fileAbs,
              rootDir,
              message: `File suffix token '${token}' must be kebab-case.`,
            }),
          );
        }
      }

      const pathSegments = splitSegments(rel);
      const hasUpperCaseSegment = pathSegments.some((segment) => /[A-Z]/.test(segment));
      if (
        hasUpperCaseSegment &&
        !violations.some((item) => item.filePath === relPosix && item.ruleId === "FLA007")
      ) {
        violations.push(
          createViolation({
            ruleId: "FLA007",
            fileAbs,
            rootDir,
            message: "Path segments under layer directories must use lowercase kebab-case.",
          }),
        );
      }
    }

    return violations;
  },
};
