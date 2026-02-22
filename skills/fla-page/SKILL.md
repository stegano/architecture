---
name: fla-page
description: Guidance for page-layer responsibilities including browser interaction, routing ownership, and top-level orchestration.
---

<Purpose>
Define how `_pages` should host browser interaction and orchestrate lower layers.
</Purpose>

<Use_When>
- Effective layer resolved to `_pages`.
- Task requires page-level orchestration or browser/routing ownership decisions.
</Use_When>

<Layer_Intent>
The page layer includes browser-interactive features (host objects, navigation functions).

Recommended approach:
- Implement business behavior in pages first when building quickly.
- Split into lower layers incrementally as complexity and reuse increase.
</Layer_Intent>

<Rules>
1. Browser routing/navigation remains page-owned.
2. Pages compose containers/components/state hooks as orchestration entry points.
3. Do not force early decomposition if the feature is still small.
4. When decomposition starts, keep routing callbacks in page and pass callbacks downward.
</Rules>

<Conceptual_Example>
Initial page-first implementation:
```tsx
// File: _pages/user/user.tsx
import { Profile } from "./_components/profile/profile.tsx";

export const User: React.FC = () => {
  const router = useRouter();
  const { data } = useUserFetch();
  const handleSignInClick = () => router.replace("/sign-in");
  return !!data ? <Profile data={data} /> : <button onClick={handleSignInClick}>Login</button>;
};
```

After refactoring to container:
```tsx
// File: _pages/user/user.tsx
import { User as UserContainer } from "./_containers/profile/profile.tsx";

export const User: React.FC = () => {
  const router = useRouter();
  const handleSignInClick = () => router.replace("/sign-in");
  return <UserContainer onSignInClick={handleSignInClick} />;
};
```
</Conceptual_Example>
