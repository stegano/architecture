# API Layer

The API layer is responsible for external communication. It includes all external interfaces such as communication with the server or browser's local storage and cookies.

## Conceptual Examples

### User API

The User API retrieves data from the server through the apis layer and returns the response.

```ts
// API
// File Path: _pages/user/_apis/user/user.tsx
...
// Fetch User Information
export const fetchUser = async (...) => {
  try {
    // Fetch data from external server via axios
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

This is an example of storing and using user state in the browser's local storage.

```ts
// API
// File Path: _pages/user/_apis/user/user.ts
...
// Fetch User Settings
export const fetchUserSetting = async (...) => {
  try {
    // Fetch data from browser local storage
    const settings = window.localStorage.getItem("settings") || {};
    return settings ? JSON.parse(settings) : { theme: "light" };
  } catch(error) {
    return {
      theme: "light"
    }
  }
}
```