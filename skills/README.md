# Repository Skills

This directory is self-contained and can be distributed without `docs/`.
All architecture guidance needed by agents is embedded inside `SKILL.md` files.

## Canonical Skill Format
- `skills/<skill-folder>/SKILL.md`

## Skill Registry
- `fla-architecture` (always-on baseline)
- `fla-file-directory-convention` (path/structure operations)
- `fla-layer-resolver` (deepest-layer selector)
- `fla-page`
- `fla-container`
- `fla-state`
- `fla-component`
- `fla-api`
- `fla-util`

## Activation Flow
1. Activate `fla-architecture`.
2. If path structure changes, also activate `fla-file-directory-convention`.
3. Use `fla-layer-resolver` to select exactly one layer skill.

## Distribution Note
These skills intentionally duplicate architecture rules so runtime agents do not require `docs/en/README.md` or `docs/en/examples/*`.


## Discovery Signals
To maximize matching reliability:
- `fla-layer-resolver` owns path-based triggers and deepest-layer selection
- each layer skill description focuses on responsibility/intent rather than raw path patterns
