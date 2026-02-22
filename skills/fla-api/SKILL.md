---
name: fla-api
description: Guidance for API-layer responsibilities: external communication boundaries and transport-level error handling.
---

<Purpose>
Define `_apis` as the sole boundary for external systems and transport-level concerns.
</Purpose>

<Use_When>
- Effective layer resolved to `_apis`.
- Task focuses on external I/O such as HTTP requests, storage, cookies, or transport mapping.
</Use_When>

<Layer_Intent>
API layer handles communication with external systems (server, localStorage, cookies, and related transport concerns).
</Layer_Intent>

<Rules>
1. Keep transport code and protocol/error handling in this layer.
2. Return predictable outputs to state/container callers.
3. Do not place UI rendering decisions in API modules.
</Rules>

<Conceptual_Examples>
Server request with status-based handling:
```ts
// File: _pages/user/_apis/user/user.tsx
export const fetchUser = async (...) => {
  try {
    const result = await axios.get(...);
    return result;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return undefined;
    }
    throw error;
  }
};
```

Browser localStorage access:
```ts
// File: _pages/user/_apis/user/user.ts
export const fetchUserSetting = async (...) => {
  try {
    const settings = window.localStorage.getItem("settings") || {};
    return settings ? JSON.parse(settings) : { theme: "light" };
  } catch {
    return { theme: "light" };
  }
};
```
</Conceptual_Examples>
