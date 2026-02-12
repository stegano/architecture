# File and Directory Convention

1.  File and directory names should be written in kebab-case using English lowercase letters and hyphens (-).
    -   This is to prevent case-insensitivity issues in some systems and to maintain consistency.
2.  Layer directories should use an underscore (\_) prefix.
    -   A prefix is used to distinguish them from general modules.
3.  Separating code within files by function, such as \*.stories.ts, \*.schema.ts, \*.type.ts, \*.test.ts, can clarify the role of the module and reduce complexity. If necessary, suffixes can be added in consultation with the team.

## Module Grouping

Each module can be grouped as a directory or the directory can be omitted. Use a consistent method within the project or layer.

### Separating Modules by Directory

When separating each module by directory, the directory becomes the module name, and each file is located thereunder.

```bash
└── _pages
    └── main
        ├── main.tsx
        └── main.type.ts
    └── account
        ├── account.tsx
        └── account.type.ts
```

### Separating by File Unit

Modules can be separated by file, omitting directories. If a module includes sub-layers, it must be separated by directory.

```bash
└── _pages
    ├── main.tsx
    ├── main.type.ts
    ├── account.tsx
    └── account.type.ts
```

## Separating Functions with Suffixes

```ts
// Schema
// File Path: _apis/account/account.schema.ts
// Create schema using zod library
...
export const AccountSchema = z.object({...});
```

```ts
// Type
// File Path: _apis/account/account.type.ts
// Create type based on schema
import { AccountSchema } from "./account.schema.ts"
...
export type Account = z.infer<typeof AccountSchema>;
```