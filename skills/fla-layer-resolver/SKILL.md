---
name: fla-layer-resolver
description: Use when target path contains one or more FLA layer segments; pick the deepest segment and activate exactly one layer skill.
---

<Purpose>
Prevent ambiguous multi-layer guidance by selecting one effective layer skill per target path.
</Purpose>

<Use_When>
- A path includes one or more of `_pages`, `_containers`, `_states`, `_components`, `_apis`, `_utils`.
- Nested feature paths contain multiple layer segments.
- Task asks which layer skill should be applied.
</Use_When>

<Algorithm>
1. Parse path segments.
2. Extract all recognized layer segments.
3. Choose the deepest (last) matching segment.
4. Activate exactly one layer skill:
   - `_pages` -> `fla-page`
   - `_containers` -> `fla-container`
   - `_states` -> `fla-state`
   - `_components` -> `fla-component`
   - `_apis` -> `fla-api`
   - `_utils` -> `fla-util`
5. Always combine with:
   - `fla-architecture` (required)
   - `fla-file-directory-convention` (when path/structure changes occur)
</Algorithm>

<Examples>
- `src/_pages/user/_containers/user/_components/avatar/avatar.tsx` -> `fla-component`
- `src/_pages/user/_containers/user/user.tsx` -> `fla-container`
- `src/_pages/user/user.tsx` -> `fla-page`
- `src/_utils/date/formatter.ts` -> `fla-util`
- no layer segment -> no layer skill (global + file-directory only)
</Examples>
