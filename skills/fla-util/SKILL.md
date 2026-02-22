---
name: fla-util
description: Guidance for util-layer responsibilities including pure, reusable, domain-agnostic helper functions.
---

<Purpose>
Define `_utils` as independent helper space for pure, reusable, non-domain-specific functions.
</Purpose>

<Use_When>
- Effective layer resolved to `_utils`.
- Task focuses on low-level helpers such as formatting, parsing, validation, or reusable utility logic.
</Use_When>

<Layer_Intent>
Util layer is for functions not tied to specific domain behavior (date formatting, regex validation, etc.).

If additional layers are needed, they may be introduced by team agreement, while preserving one-way direction.
</Layer_Intent>

<Rules>
1. Keep utilities independent from upper layers (`_pages`, `_containers`, `_states`, `_components`, `_apis`).
2. Prefer pure input/output behavior.
3. Avoid over-fragmenting architecture unless clear value exists.
</Rules>

<Conceptual_Example>
```ts
// File: _utils/date/formatter.ts
import { format } from "date-fns";

export const toYMD = (date: Date | number): string => {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
};
```
</Conceptual_Example>
