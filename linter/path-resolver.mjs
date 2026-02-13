import path from "node:path";

export const DEFAULT_LAYER_RANKS = {
  _pages: 5,
  _containers: 4,
  _states: 3,
  _components: 2,
  _apis: 1,
  _utils: 0,
};

export const toPosixPath = (value) => value.replaceAll("\\", "/");

export const splitSegments = (value) =>
  toPosixPath(value).split("/").filter(Boolean);

export const findInnermostLayer = (filePath, layerDirs) => {
  const layerSet = new Set(layerDirs);
  const segments = splitSegments(filePath);
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (layerSet.has(segments[i])) {
      return segments[i];
    }
  }
  return null;
};

export const hasLayerSegment = (filePath, layerDirs) => {
  const layerSet = new Set(layerDirs);
  return splitSegments(filePath).some((segment) => layerSet.has(segment));
};

export const getLayerRank = (filePath, layerDirs, layerRanks = DEFAULT_LAYER_RANKS) => {
  const layer = findInnermostLayer(filePath, layerDirs);
  if (!layer) {
    return null;
  }
  return Object.prototype.hasOwnProperty.call(layerRanks, layer)
    ? layerRanks[layer]
    : null;
};

const normalizeAliasTarget = (value, rootDir) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.endsWith("/*") ? value.slice(0, -2) : value;
  return path.isAbsolute(normalized) ? normalized : path.resolve(rootDir, normalized);
};

const getAliasPrefix = (aliasKey) =>
  aliasKey.endsWith("/*") ? aliasKey.slice(0, -2) : aliasKey;

const isAliasMatch = (specifier, aliasKey) => {
  const prefix = getAliasPrefix(aliasKey);
  if (aliasKey.endsWith("/*")) {
    return specifier === prefix || specifier.startsWith(`${prefix}/`);
  }
  return specifier === prefix || specifier.startsWith(prefix);
};

const applyAlias = (specifier, rootDir, aliases) => {
  const keys = Object.keys(aliases || {}).sort((a, b) => b.length - a.length);

  for (const aliasKey of keys) {
    const base = normalizeAliasTarget(aliases[aliasKey], rootDir);
    if (!base) {
      continue;
    }

    if (!isAliasMatch(specifier, aliasKey)) {
      continue;
    }

    const prefix = getAliasPrefix(aliasKey);

    if (aliasKey.endsWith("/*")) {
      const suffix = specifier.slice(prefix.length).replace(/^\//, "");
      return path.resolve(base, suffix);
    }

    const suffix = specifier === prefix ? "" : specifier.slice(aliasKey.length).replace(/^\//, "");
    return path.resolve(base, suffix);
  }

  return null;
};

export const isExternalSpecifier = (specifier, aliases = {}) => {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    return false;
  }

  return !Object.keys(aliases).some((key) => isAliasMatch(specifier, key));
};

export const resolveSpecifier = ({ specifier, sourceFileAbs, rootDir, aliases }) => {
  if (!specifier || typeof specifier !== "string") {
    return null;
  }

  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(sourceFileAbs), specifier);
  }

  if (specifier.startsWith("/")) {
    return path.resolve(rootDir, `.${specifier}`);
  }

  const aliased = applyAlias(specifier, rootDir, aliases);
  if (aliased) {
    return aliased;
  }

  return null;
};

export const globToRegExp = (glob) => {
  let out = "^";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];

    if (ch === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          out += "(?:.*/)?";
          i += 2;
        } else {
          out += ".*";
          i += 1;
        }
      } else {
        out += "[^/]*";
      }
      continue;
    }

    if (ch === "?") {
      out += "[^/]";
      continue;
    }

    if (".+^${}()|[]\\".includes(ch)) {
      out += `\\${ch}`;
      continue;
    }

    out += ch;
  }
  out += "$";
  return new RegExp(out);
};

export const matchesAnyGlob = (filePath, globs) => {
  const normalized = toPosixPath(filePath);
  return (globs || []).some((glob) => globToRegExp(glob).test(normalized));
};
