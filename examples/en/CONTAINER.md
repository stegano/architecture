# Container Layer

The container layer can compose screens using components and handle data states. It can fetch necessary data at the desired time and make decisions based on the data processing status.

## Conceptual Example

### User Container

The User Container can fetch data using hooks that can query data from the `states` layer and update the UI based on the data status.

```tsx
// Container
// File Path: _pages/user/_containers/user/user.tsx
...
import { Profile } from "./_components/profile/profile.tsx";
import { useUserFetch } from "./_states/user/user.ts";

export const User: React.FC = ({ onSignInClick }) => {
  // When this container is rendered, data is fetched using a hook created by ReactQuery's useQuery.
  const { data, isFetching, isError, refetch } = useUserFetch();
  if(isFetching) {
    return (
      <div>Fetching data...</div>
    );
  }
  if(isError) {
    return (
      <div>An error occurred while processing data.</div>
    );
  }
  return !!data
    ? <Profile data={data} />
    : <button onClick={onSignInClick}>Sign In</button>;
}
```