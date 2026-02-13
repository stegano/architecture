import {
  collectLayerImportEdges,
  createViolation,
  getModuleInfo,
} from "./shared.mjs";

export const RULE_FLA006 = {
  id: "FLA006",
  kind: "repo",
  run: ({ context }) => {
    const { config, rootDir, layerRanks, candidateFiles, fileContents } = context;
    const rule = config.singleUseGlobal;
    if (!rule?.enabled) {
      return [];
    }

    const applicableLayers = new Set(rule.layers || []);
    const minRefs = Number.isInteger(rule.minUpperModuleReferences)
      ? rule.minUpperModuleReferences
      : 2;

    const globalModules = new Map();
    const incomingByTarget = new Map();

    for (const fileAbs of candidateFiles) {
      const sourceContent = fileContents.get(fileAbs) || "";
      const sourceInfo = getModuleInfo({ fileAbs, rootDir, config, layerRanks });

      if (sourceInfo?.isGlobal && sourceInfo.moduleKey && applicableLayers.has(sourceInfo.layer)) {
        if (!globalModules.has(sourceInfo.moduleKey)) {
          globalModules.set(sourceInfo.moduleKey, sourceInfo);
        }
      }

      const edges = collectLayerImportEdges({
        fileAbs,
        content: sourceContent,
        rootDir,
        config,
        layerRanks,
      });

      for (const edge of edges) {
        if (!edge.target.isGlobal || !edge.target.moduleKey) {
          continue;
        }

        if (!applicableLayers.has(edge.target.layer)) {
          continue;
        }

        if (edge.source.rank === null || edge.target.rank === null) {
          continue;
        }

        if (edge.source.rank <= edge.target.rank) {
          continue;
        }

        if (!edge.source.moduleKey) {
          continue;
        }

        const set = incomingByTarget.get(edge.target.moduleKey) || new Set();
        set.add(edge.source.moduleKey);
        incomingByTarget.set(edge.target.moduleKey, set);
      }
    }

    const violations = [];

    for (const [moduleKey, info] of globalModules.entries()) {
      const usageCount = incomingByTarget.get(moduleKey)?.size || 0;
      if (usageCount === 0) {
        continue;
      }

      if (usageCount >= minRefs) {
        continue;
      }

      violations.push(
        createViolation({
          ruleId: "FLA006",
          fileAbs: info.fileAbs,
          rootDir,
          line: 1,
          column: 1,
          message: `Global module '${moduleKey}' is referenced by only ${usageCount} upper-layer module(s). Consider nesting it closer to its usage scope.`,
        }),
      );
    }

    return violations;
  },
};
