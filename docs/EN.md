# Architecture

## Overview

Fractal Layered Architecture (FLA) is a methodology for designing frontend application structures. The primary objective of this methodology is to ensure stable project scalability and maintainability in response to constantly evolving business requirements.

## Goals

FLA defines a unidirectional layer structure and specific roles for each layer to delimit the scope of responsibility. This approach minimizes the impact scope when issues arise and enables rapid response by identifying the problematic layer. Additionally, the nested layer structure provides flexibility for moving or expanding modules.

## Layers

Layers possess the following directionality (from left to right). Lower layers cannot reference upper layers, whereas upper layers can access all underlying layers.

```mermaid
graph LR
    A(Pages) --> B[Containers]
    B --> C[States]
    C --> D[Components]
    D --> E[APIs]
    E --> F(Utils)
    style A fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style F fill:#f5f5f5,stroke:#616161,stroke-width:2px
```

### Nested Layers

Layers can contain nested layer structures, including themselves. This nested structure fosters strong dependency and cohesion. Such a structure prevents orphaned files (unused files) from lingering when a layer is moved to another project or deleted.

```bash
└── _pages # (global)
  └── profile
    └── profile.tsx # profile page implementation
    └── _containers # (nested, profile)
      └── user
        └── _components # (nested, profile > user)
          ├── avatar  # dependent on user container
          └── info    # dependent on user container
        ├── _states
        └── _apis
└── _containers # (global)
...
```

### Layer Roles

1. Pages: The layer containing features that interact with the browser. It may include references to browser host objects or page navigation functions.
   > It may include implementations or functions of lower layers (Containers, Components). It is recommended to complete all business logic implementation within the Pages layer first, and then progressively separate it into lower layers.
2. Containers: A layer that composes screens using components and handles data states.
3. States: A layer constituting hooks or modules that manage state, such as ReactQuery or Zustand.
4. Components: A pure component layer that does not internally reference external state values. It relies solely on injected props or internal state information.
5. APIs: The layer responsible for communicating with external systems.
6. Utils: May contain other undefined items.

## File and Directory Naming Conventions

1. File and directory names should be written in Kebab-case using lowercase English letters and dashes (-).
   - This is to prevent issues with case insensitivity in some systems and to ensure consistency.
2. Layer directories should be written using an underscore (\_) prefix.
   - Prefixes are used to distinguish them from general modules.
3. Separating code within files by function, such as `*.stories.ts`, `*.schema.ts`, `*.type.ts`, clarifies the role of the module and reduces complexity.

## Code Writing Principles

1. Hasty abstraction is worse than code repetition. Only separate code into a lower layer as common code if it is repeated multiple times. Otherwise, you may end up with modules possessing "universal interfaces" or an increasing number of unmanaged common modules with similar functions.
2. Do not unnecessarily split layers too finely. It is better to separate them into lower layers progressively based on the necessity of management, such as module independence and code complexity.
3. If a module nested in a specific layer is used by two or more upper-layer modules, consider moving it to the top-level (global) layer.
