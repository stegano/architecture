# State Layer

The State layer can configure modules using libraries that manage global states used in applications, such as ReactQuery, Zustand, etc. It can include business logic for data requests and responses.

## Conceptual Example

### User State

In the User State, it queries or updates external data from the `apis` layer and returns the result. Below is an example of implementing a query and update module using React Hooks.

```ts
// State
// File Path: _pages/user/_states/user/user.ts
...
import { fetchUser, updateUser } from "./_apis/user/user.ts";

// Fetch user information
export const useUserFetch = () => {
  return useQuery({
    ...
    queryFn: async () => {
      // Business logic that verifies types or conditions can also be included here.
      const result = await fetchUser();
      return result;
    }
  });
}
// Update user information
export const useUserUpdate = () => {
  return useMutation({
    ...
    mutationFn: async (data) => {
      // Business logic that validates data can also be included here.
      await updateUser(data);
    }
  });
}
```

### State Hook referencing a Component

This is an example of creating a dialog hook using a Dialog from a lower component layer.

```tsx
// State
// File Path: _states/dialog/dialog.tsx
...
import { Dialog } from "/_components/dialog/dialog.tsx"

// Fetch user information
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