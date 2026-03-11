---
name: fla-file-directory-convention
description: Use when creating/moving/renaming files or folders, or when deciding naming, module grouping, and suffix split rules.
---

<Purpose>
Embed the complete file/directory policy so agents can create and reorganize modules consistently without external references.
</Purpose>

<Use_When>
- Creating, renaming, moving, or deleting files/directories.
- Changing module grouping style or introducing new module files.
- Task mentions naming, folder structure, kebab-case, suffixes, or file conventions.
</Use_When>

<Rules>
1. File and directory names use kebab-case (lowercase + hyphen).
2. Layer directories use underscore prefix:
   - `_pages`, `_containers`, `_states`, `_components`, `_apis`, `_utils`
3. Split concerns with suffix files where useful:
   - `.stories.ts`, `.schema.ts`, `.type.ts`, `.test.ts`
   - Additional suffixes are allowed by team agreement.
</Rules>

<Module_Grouping>
A layer directory must choose one style and stay consistent:

A) Directory-based module grouping
```bash
└── _pages
    └── main
        ├── main.tsx
        └── main.type.ts
    └── account
        ├── account.tsx
        └── account.type.ts
```

B) File-based module grouping
```bash
└── _pages
    ├── main.tsx
    ├── main.type.ts
    ├── account.tsx
    └── account.type.ts
```

Constraint:
- If a module has nested sub-layers, directory-based grouping is required for that module.
</Module_Grouping>

<Suffix_Separation_Examples>
```ts
// _apis/account/account.schema.ts
export const AccountSchema = z.object({...});
```

```ts
// _apis/account/account.type.ts
import { AccountSchema } from "./account.schema.ts";
export type Account = z.infer<typeof AccountSchema>;
```
</Suffix_Separation_Examples>

<Execution_Policy>
- Keep local layer consistency first.
- Do not mix grouping strategies in the same layer directory unless performing a full migration.
</Execution_Policy>
