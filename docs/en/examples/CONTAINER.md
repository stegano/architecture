# Container Layer

The container is a layer that can compose screens using components and handle data states. It can fetch necessary data at the desired time and make decisions based on the data processing status.

## Conceptual Examples

### User Container

The User Container can fetch data using a hook that can query data from the states layer and update the UI according to the data status.

```tsx
// Container
// File Path: _pages/user/_containers/user/user.tsx
...
import { Profile } from "./_components/profile/profile.tsx";
import { useUserFetch } from "./_states/user/user.ts";

export const User: React.FC = ({ onSignInClick }) => {
  // When this container is rendered, it fetches data using a hook created with ReactQuery's useQuery.
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
    : <button onClick={onSignInClick}>Login</button>;
}
```