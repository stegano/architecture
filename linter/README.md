# FLA Linter

Custom linter for Fractal Layered Architecture (FLA) rules.

## Run

```bash
node linter/cli.mjs
node linter/cli.mjs target/src
node linter/cli.mjs <project-root>
```

```bash
node linter/cli.mjs --root .              # 루트 기준 실행
node linter/cli.mjs src                   # 서브 디렉터리에서 실행해도 자동으로 프로젝트 루트 탐색
```

## Options

- `<project-root>`: optional positional root path for linted project (defaults to current working directory).
- `--config <path>`: Use a custom config file.
- `--format text|json`: Output format (default: `json`).
- `--fail-on-warn`: Reserved flag for CI compatibility (same behavior as error-only mode).

## Documentation principles covered

- Unidirectional layer dependency (`_pages -> _containers -> _states -> _components -> _apis -> _utils`).
- Layer directory naming with underscore prefix.
- Kebab-case naming for files/directories.
- Suffix-based file split (`.type`, `.schema`, `.stories`, `.test` + custom suffixes).
- Avoid barrel files (`index.*`) in layer scope.
- Nested layer placement under module directory.
- Module grouping consistency per layer (directory-based or file-based).
- Detect layer modules that are referenced by fewer upper modules than the configured threshold.

## Rules

- `FLA001 invalid-extension-or-suffix`
  - Layer files only allow configured extensions (default: `.ts`, `.tsx`).
  - Optional file suffixes must be in `defaultTsSuffixes + extraTsSuffixes`.

- `FLA002 interface-outside-type-file`
  - `interface` declarations are only allowed in files matched by `interfaceAllowedGlobs`.
  - Default allowed glob: `**/*.type.ts`.

- `FLA003 invalid-layer-reference`
  - Enforces one-way dependency direction.
  - Lower layers cannot reference higher layers.

- `FLA004 barrel-index-forbidden`
  - Forbids `index.*` files inside any layer path.

- `FLA005 invalid-nested-layer-directory`
  - Forbids direct layer-to-layer nesting (`.../_pages/_components/...`).
  - Nested layer directories must be under a module directory first.

- `FLA006 single-use-layer-module`
  - Detects nested layer modules that are referenced by fewer upper scopes than the configured threshold.
  - Upper-layer consumers can be any higher layer modules (`_pages`, `_containers`, `_states`, `_components`, `_apis`), and they are grouped by scope.
  - Reference count is measured by distinct consumer scopes (container scope first, page scope fallback), not by raw import count.
  - Multiple imports from modules inside the same container are treated as one scope.
  - If a module is already nested under its only consumer scope, it is not reported.
  - If a layer module is used by fewer than `minUpperModuleReferences`, it suggests keeping it closer to its only upper scope (deeper nesting).
  - If a layer module is used by `minUpperModuleReferences` or more upper scopes, it is treated as sufficiently reused and is not reported.
  - Applies recursively through nested `_pages` feature trees (e.g. `_pages/<feature>/_states/...` and `_pages/<feature>/_components/...`).

- `FLA007 kebab-case-naming`
  - Enforces kebab-case naming for files and directories in layer scope.

- `FLA008 layer-directory-naming`
  - Enforces underscore-prefixed layer names (e.g. `_pages`, not `pages`).
  - Flags unknown underscore-prefixed directory names in layer scope.

- `FLA009 layer-module-grouping-consistency`
  - A layer directory cannot mix module-directory style and module-file style.
  - A module cannot exist as both file and directory in the same layer directory.

- `FLA010 page-only-router-hook`
  - Router hooks imported from `react-router`/`next/navigation`-family modules (e.g. `useParams`) are restricted to `_pages` files.
  - Non-page layers (`_containers`, `_states`, `_components`, `_apis`, `_utils`) should not call these hooks directly.

## Config

Default file: `linter/fla-lint.config.json`

```json
{
  "layerDirs": ["_pages", "_containers", "_states", "_components", "_apis", "_utils"],
  "ignoreDirs": [".git", "node_modules", "docs", "linter"],
  "allowedExtensions": [".ts", ".tsx"],
  "defaultTsSuffixes": ["type", "schema", "stories", "test"],
  "extraTsSuffixes": [],
  "interfaceAllowedGlobs": ["**/*.type.ts"],
  "pathAliases": {},
  "nestedLayer": { "enabled": true },
  "singleUseLayerModule": {
    "enabled": true,
    "layers": ["_pages", "_containers", "_states", "_components", "_apis", "_utils"],
    "minUpperModuleReferences": 2
  },
  "namingConvention": { "enabled": true },
  "layerDirectoryNaming": { "enabled": true },
  "moduleGrouping": { "enabled": true }
}
```

Use `extraTsSuffixes` to add project-specific suffixes (for example `hook`, `query`).

## Alias resolution (important)

`pathAliases` is resolved from:

- `tsconfig.json` or `jsconfig.json` (`compilerOptions.paths`) in `extends` chain
- then merged with the same setting from `linter/fla-lint.config.json`

This allows `@/...` aliases to work in lint, even when running from a sub path such as `src`.

`extends` merge rules (high priority to low):

1. `linter/fla-lint.config.json` `pathAliases` (highest priority)
2. current `tsconfig` (`compilerOptions.paths`) 
3. ancestor `tsconfig` files via `extends` chain (lowest priority)

Examples:

Example:

`tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Or define it directly:

`linter/fla-lint.config.json`

```json
{
  "pathAliases": {
    "@/*": "src/*"
  }
}
```
