import {
  collectLayerImportEdges,
  createViolation,
  getModuleInfo,
} from "./shared.mjs";
import { splitSegments } from "../path-resolver.mjs";

const toModuleName = (segment) => {
  if (!segment) {
    return null;
  }

  if (!segment.includes(".")) {
    return segment;
  }

  return segment.split(".")[0] || null;
};

const getScopedModuleKey = ({ info, layerDirs }) => {
  if (!info?.relativePath || !info?.layer) {
    return null;
  }

  const segments = splitSegments(info.relativePath);
  let layerIndex = -1;

  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (segments[i] === info.layer) {
      layerIndex = i;
      break;
    }
  }

  if (layerIndex < 0 || !layerDirs.includes(segments[layerIndex])) {
    return null;
  }

  const moduleName = toModuleName(segments[layerIndex + 1]);
  if (!moduleName) {
    return null;
  }

  return `${segments.slice(0, layerIndex + 1).join("/")}/${moduleName}`;
};

const getNearestScopeByLayer = ({ relativePath, layerName }) => {
  if (!relativePath) {
    return null;
  }

  const segments = splitSegments(relativePath);

  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (segments[i] !== layerName) {
      continue;
    }

    const moduleName = toModuleName(segments[i + 1]);
    if (!moduleName) {
      continue;
    }

    return `${segments.slice(0, i + 1).join("/")}/${moduleName}`;
  }

  return null;
};

const getConsumerScopeKey = ({ source, layerDirs }) => {
  const containerScope = getNearestScopeByLayer({
    relativePath: source?.relativePath,
    layerName: "_containers",
  });

  if (containerScope) {
    return containerScope;
  }

  const pageScope = getNearestScopeByLayer({
    relativePath: source?.relativePath,
    layerName: "_pages",
  });

  if (pageScope) {
    return pageScope;
  }

  return getScopedModuleKey({ info: source, layerDirs });
};

const hasScopedLayer = ({ scopeKey, layer }) =>
  Boolean(
    scopeKey &&
      (scopeKey.startsWith(`${layer}/`) || scopeKey.includes(`/${layer}/`)),
  );

const isNestedInScope = ({ moduleKey, scopeKey }) =>
  Boolean(
    moduleKey &&
      scopeKey &&
      (moduleKey === scopeKey || moduleKey.startsWith(`${scopeKey}/`)),
  );

export const RULE_FLA006 = {
  id: "FLA006",
  kind: "repo",
  run: ({ context }) => {
    const { config, rootDir, layerRanks, candidateFiles, fileContents } = context;
    const rule = config.singleUseLayerModule;
    if (!rule?.enabled) {
      return [];
    }

    const applicableLayers = new Set(rule.layers || []);
    const minRefs = Number.isInteger(rule.minUpperModuleReferences)
      ? rule.minUpperModuleReferences
      : 2;

    const trackedModules = new Map();
    const incomingByTarget = new Map();

    for (const fileAbs of candidateFiles) {
      const sourceContent = fileContents.get(fileAbs) || "";
      const sourceInfo = getModuleInfo({ fileAbs, rootDir, config, layerRanks });
      const sourceScopedKey = getScopedModuleKey({
        info: sourceInfo,
        layerDirs: config.layerDirs,
      });

      if (sourceScopedKey && sourceInfo?.layer && applicableLayers.has(sourceInfo.layer)) {
        if (!trackedModules.has(sourceScopedKey)) {
          trackedModules.set(sourceScopedKey, sourceInfo);
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
        const targetScopedKey = getScopedModuleKey({
          info: edge.target,
          layerDirs: config.layerDirs,
        });

        if (!targetScopedKey) {
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

        const sourceScopeKey = getConsumerScopeKey({
          source: edge.source,
          layerDirs: config.layerDirs,
        });

        if (!sourceScopeKey) {
          continue;
        }

        const set = incomingByTarget.get(targetScopedKey) || new Set();
        set.add(sourceScopeKey);
        incomingByTarget.set(targetScopedKey, set);
      }
    }

    const violations = [];

    for (const [scopedModuleKey, info] of trackedModules.entries()) {
      const usageCount = incomingByTarget.get(scopedModuleKey)?.size || 0;
      if (usageCount === 0) {
        continue;
      }

      if (usageCount >= minRefs) {
        continue;
      }

      const upperScopes = [...(incomingByTarget.get(scopedModuleKey) || new Set())].sort();
      if (
        upperScopes.length === 1 &&
        isNestedInScope({ moduleKey: scopedModuleKey, scopeKey: upperScopes[0] })
      ) {
        continue;
      }

      const upperSummary = upperScopes.map((item) => `"${item}"`).join(", ");
      let placementHint = "Consider nesting it closer to its usage scope.";

      if (upperScopes.length === 1) {
        const onlyScope = upperScopes[0];

        if (
          hasScopedLayer({ scopeKey: onlyScope, layer: "_containers" }) &&
          info.layer !== "_containers" &&
          info.layer !== "_pages"
        ) {
          placementHint = `Consider placing it under that container module (for example: .../_containers/<module>/${info.layer}/... ).`;
        } else if (hasScopedLayer({ scopeKey: onlyScope, layer: "_pages" })) {
          placementHint = "Consider placing it under that page module.";
        }
      }

      violations.push(
        createViolation({
          ruleId: "FLA006",
          fileAbs: info.fileAbs,
          rootDir,
          line: 1,
          column: 1,
          message: `Layer module '${scopedModuleKey}' is referenced by only ${usageCount} upper scope(s): ${upperSummary}. ${placementHint}`,
        }),
      );
    }

    return violations;
  },
};
