---
name: fla-state
description: Guidance for state-layer responsibilities including query and mutation orchestration, state logic, and business validation around data flow.
---

<Purpose>
Define `_states` as the place for application state behavior and business logic around data operations.
</Purpose>

<Use_When>
- Effective layer resolved to `_states`.
- Task focuses on hooks, cache/state behavior, or request/response business rules.
</Use_When>

<Layer_Intent>
State layer composes modules with state-management tools (React Query, Zustand, etc.) and handles request/response business handling.
</Layer_Intent>

<Rules>
1. Implement fetch/update orchestration through hooks or state modules.
2. Perform validation/condition checks around API calls.
3. Expose stable outputs for upper layers.
4. Keep direct browser-routing ownership outside this layer.
</Rules>

<Conceptual_Examples>
Data query/update hooks:
```ts
// File: _pages/user/_states/user/user.ts
import { fetchUser, updateUser } from "./_apis/user/user.ts";

export const useUserFetch = () =>
  useQuery({
    queryFn: async () => {
      const result = await fetchUser();
      return result;
    },
  });

export const useUserUpdate = () =>
  useMutation({
    mutationFn: async (data) => {
      await updateUser(data);
    },
  });
```

State hook using lower component:
```tsx
// File: _states/dialog/dialog.tsx
import { Dialog } from "/_components/dialog/dialog.tsx";

export const useDialog = () => {
  const [content, setContent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  return {
    showDialog: (next) => {
      setContent(next);
      setIsOpen(true);
    },
    closeDialog: () => {
      setIsOpen(false);
      setContent(null);
    },
    dialogComponent: <Dialog open={isOpen}>{content}</Dialog>,
  };
};
```
</Conceptual_Examples>
