import path from "node:path";
import {
  collectLayerImportEdges,
  createViolation,
  PARSEABLE_SOURCE_EXTENSIONS,
} from "./shared.mjs";

export const RULE_FLA003 = {
  id: "FLA003",
  kind: "file",
  run: ({ fileAbs, content, context }) => {
    const { rootDir, config, layerRanks } = context;
    const ext = path.extname(fileAbs);
    if (!PARSEABLE_SOURCE_EXTENSIONS.has(ext)) {
      return [];
    }

    const edges = collectLayerImportEdges({
      fileAbs,
      content,
      rootDir,
      config,
      layerRanks,
    });

    const violations = [];

    for (const edge of edges) {
      if (edge.source.rank === null || edge.target.rank === null) {
        continue;
      }

      if (edge.source.rank < edge.target.rank) {
        violations.push(
          createViolation({
            ruleId: "FLA003",
            fileAbs,
            rootDir,
            line: edge.line,
            column: edge.column,
            message: `Invalid upward reference from ${edge.source.layer} to ${edge.target.layer} via '${edge.specifier}'.`,
          }),
        );
      }
    }

    return violations;
  },
};
