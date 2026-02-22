---
name: fla-container
description: Guidance for container-layer responsibilities: composing UI modules and handling state-driven rendering decisions.
---

<Purpose>
Define `_containers` as composition units that bridge state outputs to component rendering.
</Purpose>

<Use_When>
- Effective layer resolved to `_containers`.
- Task focuses on screen composition or loading/error/empty/success branching.
</Use_When>

<Layer_Intent>
Containers compose screens using components, fetch needed data via state hooks, and decide what to render by processing status.
</Layer_Intent>

<Rules>
1. Handle loading/error/success/empty branches in container scope.
2. Use state hooks from `_states` for data lifecycle.
3. Pass browser actions in from pages via callbacks.
4. Keep transport details out of container implementations.
</Rules>

<Conceptual_Example>
```tsx
// File: _pages/user/_containers/user/user.tsx
import { Profile } from "./_components/profile/profile.tsx";
import { useUserFetch } from "./_states/user/user.ts";

export const User: React.FC = ({ onSignInClick }) => {
  const { data, isFetching, isError } = useUserFetch();

  if (isFetching) return <div>Fetching data...</div>;
  if (isError) return <div>An error occurred while processing data.</div>;

  return !!data ? <Profile data={data} /> : <button onClick={onSignInClick}>Login</button>;
};
```
</Conceptual_Example>
