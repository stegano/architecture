# API Layer

The API layer is responsible for external communication. It includes all external interfaces such as communication with servers or browser local storage, cookies, etc.

## Conceptual Example

### User API

In the User API, the `apis` layer queries data through the server and returns the response.

```ts
// API
// File Path: _pages/user/_apis/user/user.tsx
...
// Fetch user information
export const fetchUser = async (...) => {
  try {
    // Query data from external server via axios
    const result = await axios.get(...);
    return result;
  } catch(error) {
    if(isAxiosError(error)) {
      // Exception handling for server HTTP response codes
      if(error.response?.status === 404) {
        return undefined;
      }
    }
    throw error;
  }
}
```

### Fetch User Settings from LocalStorage

This is an example of storing and using user's state in browser local storage.

```ts
// API
// File Path: _pages/user/_apis/user/user.ts
...
// Fetch user settings
export const fetchUserSetting = async (...) => {
  try {
    // Query data via browser local storage
    const settings = window.localStorage.getItem("settings") || {};
    return settings ? JSON.parse(settings) : { theme: "light" };
  } catch(error) {
    return {
      theme: "light"
    }
  }
}
```