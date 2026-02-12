# Page Layer

The Page layer includes features that interact with the browser. It may include references to browser host objects or page navigation functions.
It is recommended to complete the implementation of business logic in the Page layer and gradually separate modules into lower layers as needed.

## Conceptual Example

### User Page

A User Page can be structured as follows, and the example below includes the implementation of the Container layer within the Page layer. For initial rapid development, it is recommended to complete all implementations in the Page layer and gradually separate them into lower layers.

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
    : <button onClick={handleSignInClick}>로그인</button>;
}
```

Below is the result of refactoring the Page layer and separating it into the Container layer. The Page implements browser routing and passes it to the Container, and the Container fetches data and passes it to the Profile component to display on the screen. Instead of handling routing directly when the login button is pressed inside the Container, an `onSignInClick` property was created to delegate it to the Page.

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
    : <button onClick={handleSignInClick}>로그인</button>;
}
```