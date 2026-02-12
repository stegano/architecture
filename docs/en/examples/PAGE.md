# Page Layer

The page layer is a layer that includes functions that interact with the browser. It can include referencing browser host objects or page navigation functions.
It is recommended to complete the implementation of business logic in the page layer and gradually separate modules into lower layers as needed.

## Conceptual Examples

### User Page

A user page can be structured as follows, and the example below includes the container layer implementation within the page layer. For initial rapid development, it is recommended to complete all implementations in the page layer and gradually separate them into lower layers.

```tsx
// Page
// File Path: _pages/user/user.tsx
...
import { Profile } from "./_components/profile/profile.tsx";

export const User: React.FC = () => {
  const router = useRouter();
  const { data } = useUserFetch();
  const handleSignInClick = () => router.replace("/sign-in");
  return !!data
    ? <Profile data={data} />
    : <button onClick={handleSignInClick}>Login</button>;
}
```

Below is the result of refactoring the page layer and separating it into a container layer. The page implements browser routing and passes it to the container, and the container fetches data and passes it to the profile component to display on the screen. Inside the container, an `onSignInClick` property was created to delegate routing handling to the page when the login button is pressed, instead of handling it directly.

```tsx
// Page
// File Path: _pages/user/user.tsx
...
import { User as UserContainer } from "./_containers/profile/profile.tsx";

export const User: React.FC = () => {
  const router = useRouter();
  const handleSignInClick = () => router.replace("/sign-in");
  return (
    <UserContainer onSignInClick={handleSignInClick} />
  );
}
```

```tsx
// Container
// File Path: _pages/user/_container/user/user.tsx
...
import { Profile } from "./_components/profile/profile.tsx";

export const User: React.FC = ({ onSignInClick }) => {
  const { data } = useUserFetch();
  return !!data
    ? <Profile data={data} />
    : <button onClick={onSignInClick}>Login</button>;
}
```