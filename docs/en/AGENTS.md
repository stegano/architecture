# Agent Guidelines

## Overview

Use repository skills as the primary source of architecture rules.
The `skills/` directory is self-contained and does not require `docs/` at runtime.

## Skill-Based Activation

- `skills/fla-architecture/SKILL.md` (always)
- `skills/fla-file-directory-convention/SKILL.md` (path or module structure changes)
- `skills/fla-layer-resolver/SKILL.md` (select effective layer by deepest path segment)

Layer skills:
- `/_pages/` -> `skills/fla-page/SKILL.md`
- `/_containers/` -> `skills/fla-container/SKILL.md`
- `/_states/` -> `skills/fla-state/SKILL.md`
- `/_components/` -> `skills/fla-component/SKILL.md`
- `/_apis/` -> `skills/fla-api/SKILL.md`
- `/_utils/` -> `skills/fla-util/SKILL.md`

## Work Policy

First, understand existing style/flow in target files and minimize change scope.
For edits outside layer directories, apply global and file-directory rules only.
