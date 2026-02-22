---
name: fla-architecture
description: Use for every task first; then route to path- or keyword-matched skills (fla-file-directory-convention, fla-layer-resolver, and one layer skill).
---

<Purpose>
Provide the complete base architecture contract for this repository so agents can work without external docs.
</Purpose>

<Use_When>
- Always, for every implementation/refactor task.
- Before activating any other repository skill.
- When task scope is unclear and a base architecture decision is needed.
</Use_When>

<Architecture_Overview>
Fractal Layered Architecture (FLA) is a frontend architecture approach designed for stable growth under changing business requirements.

Its core idea is responsibility isolation through one-way layer direction. This limits blast radius when failures happen and makes root-cause localization faster.
</Architecture_Overview>

<Layer_Direction>
Allowed direction (left to right):
`_pages -> _containers -> _states -> _components -> _apis -> _utils`

Rules:
- Lower layers must not reference upper layers.
- Upper layers may access lower layers.
</Layer_Direction>

<Nested_Layers>
Layers may contain nested sub-layers for strong cohesion and easier feature moves/deletions.

Example:
```bash
└── _pages
    └── profile
        ├── profile.tsx
        └── _containers
            └── user
                ├── _components
                │   ├── avatar
                │   └── info
                ├── _states
                └── _apis
```
</Nested_Layers>

<Layer_Roles>
1. Pages: browser-facing behavior (routing, host objects), high-level feature orchestration.
2. Containers: compose UI blocks and decide rendering by data status.
3. States: state/query/mutation modules and business rules.
4. Components: pure/presentational UI using props and local UI state.
5. APIs: external communication boundary (HTTP/storage/cookies/etc.).
6. Utils: lowest independent helpers and undefined misc utilities.
</Layer_Roles>

<Naming_Conventions>
1. Use kebab-case for file and directory names.
2. Prefix layer directories with underscore (`_`).
3. Use suffix file splits when needed (`.stories`, `.schema`, `.type`, `.test`).
</Naming_Conventions>

<Code_Writing_Principles>
1. Prefer small local duplication over premature abstraction.
2. Split into lower layers gradually as complexity/reuse increases.
3. If a nested module is used by two or more upper modules, consider moving it upward.
</Code_Writing_Principles>


<Skill_Routing_Links>
Open additional skills only when needed:

- `skills/fla-file-directory-convention/SKILL.md`
  - Read when creating/moving/renaming files or changing module layout.
- `skills/fla-layer-resolver/SKILL.md`
  - Read when path includes layers or nested layers and one effective layer must be selected.
- `skills/fla-page/SKILL.md`
  - Read for `/_pages/` paths or router/navigation/page orchestration tasks.
- `skills/fla-container/SKILL.md`
  - Read for `/_containers/` paths or UI status-branch composition tasks.
- `skills/fla-state/SKILL.md`
  - Read for `/_states/` paths or query/mutation/state-business tasks.
- `skills/fla-component/SKILL.md`
  - Read for `/_components/` paths or presentational prop-driven UI tasks.
- `skills/fla-api/SKILL.md`
  - Read for `/_apis/` paths or HTTP/fetch/axios/storage/cookie tasks.
- `skills/fla-util/SKILL.md`
  - Read for `/_utils/` paths or pure utility/helper tasks.
</Skill_Routing_Links>

<Execution_Policy>
- Apply this skill first.
- Then apply `fla-file-directory-convention` for path/structure changes.
- Then apply one resolved layer skill via `fla-layer-resolver`.
- If rules conflict, this global skill wins unless a deeper explicit layer rule overrides behavior within its own layer scope.
</Execution_Policy>
