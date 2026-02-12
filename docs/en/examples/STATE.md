# State Layer

The state layer can compose modules using global state management libraries like ReactQuery, Zustand, etc., used in the app. It can include business logic for data requests and responses.

## Conceptual Examples

### User State

In the user state, external data is queried or updated from the APIs layer, and the results are returned. Below is an example of implementing inquiry and update modules using React Hooks.

```ts
// State
// File Path: _pages/user/_states/user/user.ts
...
import { fetchUser, updateUser } from "./_apis/user/user.ts";

// Fetch User Information
export const useUserFetch = () => {
  return useQuery({
    ...
    queryFn: async () => {
      // Business logic for type or condition validation can also be included here.
      const result = await fetchUser();
      return result;
    }
  });
}
// Update User Information
export const useUserUpdate = () => {
  return useMutation({
    ...
    mutationFn: async (data) => {
      // Business logic for data validation can also be included here.
      await updateUser(data);
    }
  });
}
```

### State Hook Referencing Components

This is an example of creating a dialog hook by utilizing a Dialog from a lower component layer.

```tsx
// State
// File Path: _states/dialog/dialog.tsx
...
import { Dialog } from "/_components/dialog/dialog.tsx"

// Use Dialog Hook
export const useDialog = () => {
  const [content, setContent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  return {
    showDialog: (content) => {
      setContent(content);
      setIsOpen(true);
    },
    closeDialog: () => {
      setIsOpen(false);
      setContent(null);
    },
    dialogComponent: <Dialog open={isOpen}>{content}</Dialog>
  }
}
```