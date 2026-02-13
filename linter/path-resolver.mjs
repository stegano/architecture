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

const applyAlias = (specifier, rootDir, aliases) => {
  const keys = Object.keys(aliases || {}).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (specifier === key || specifier.startsWith(key)) {
      const targetBase = aliases[key];
      if (typeof targetBase !== "string" || targetBase.length === 0) {
        return null;
      }
      const suffix = specifier.slice(key.length);
      const base = path.isAbsolute(targetBase)
        ? targetBase
        : path.resolve(rootDir, targetBase);
      return path.resolve(base, suffix);
    }
  }
  return null;
};

export const isExternalSpecifier = (specifier, aliases = {}) => {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    return false;
  }

  return !Object.keys(aliases).some(
    (key) => specifier === key || specifier.startsWith(key),
  );
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
