# Architecture

## Overview

Fractal Layered Architecture (FLA) is a methodology for designing front-end application structures. The main purpose of this methodology is to stably expand and maintain projects in response to constantly changing business requirements.

## Goals

FLA defines a unidirectional layer structure and the role of each layer to limit the scope of responsibility. This approach limits the scope of impact when problems occur and allows for quick response by finding the layer where the problem occurred. In addition, the layered structure that allows nesting provides a flexible structure that allows modules to be moved or extended.

## Layers

Layers have the following directionality (from left to right). Lower layers cannot refer to upper layers, and upper layers can access all lower layers.

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

Layers can have a nested layer structure, including themselves. Nested layer structures have strong dependencies and cohesion. This structure can prevent unused files from remaining when a layer is moved to another project or deleted.

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

1.  **Pages**: This layer includes features that interact with the browser. It may include references to browser host objects or page navigation functions.
    > It can include the implementation or functions of lower layers such as Containers and Components. It is recommended to complete all business implementation in the Pages layer and gradually separate it into lower layers.
2.  **Containers**: The container layer can compose screens using components and handle data states.
3.  **States**: This layer configures hooks or modules that manage states like ReactQuery, Zustand, etc., and contains business logic.
4.  **Components**: This is a pure component layer that does not refer to external state values internally. It only uses injected properties or internal state information.
5.  **APIs**: This layer is responsible for communication with external systems.
6.  **Utils**: This may include other undefined items.

## File and Directory Naming Conventions

1.  File and directory names should be written in Kebab-case using English lowercase letters and hyphens (-).
    - This is to prevent issues where some systems are not case-sensitive and to ensure consistency.
2.  Layer directories should be written using an underscore (\_) prefix.
    - A prefix is used to distinguish it from general modules.
3.  Separating code within a file by function, such as \*.stories.ts, \*.schema.ts, \*.type.ts, can clarify the role of the module and reduce complexity.

## Code Writing Principles

1.  It is better to repeat code several times than to prematurely abstract it. Only when code is repeated several times should it be moved down to a lower layer and separated as common code. Otherwise, a module with an all-purpose interface will be created, or an increasing number of unmanaged common modules with similar functions will emerge.
2.  Do not unnecessarily break layers into too small pieces. It is better to gradually separate them into lower layers according to the need for management, such as module independence and code complexity.
3.  If a nested module in a specific layer is used in two or more upper layer modules, consider moving it to the top-level (global) layer module.