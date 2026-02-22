---
name: fla-component
description: Guidance for component-layer responsibilities: prop-driven presentational UI with minimal external coupling.
---

<Purpose>
Define `_components` as pure/presentational units with minimal external coupling.
</Purpose>

<Use_When>
- Effective layer resolved to `_components`.
- Task focuses on rendering behavior, props/callbacks, or local UI state boundaries.
</Use_When>

<Layer_Intent>
Component layer should not internally rely on external state values. It should use injected properties and optional local UI state.
</Layer_Intent>

<Rules>
1. Keep rendering deterministic from props/local state.
2. Keep business decisions and external data access out of component internals.
3. Pass events upward through callbacks.
</Rules>

<Conceptual_Example>
```tsx
// File: _pages/user/_containers/user/_components/profile/user.tsx
export const Profile: React.FC = ({ id, name, age }) => {
  const [isDetailShow, setIsDetailShow] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setIsDetailShow((prev) => !prev)}>
        id: {id}
      </button>
      {isDetailShow && (
        <>
          <p>name: {name}</p>
          <p>age: {age}</p>
        </>
      )}
    </div>
  );
};
```
</Conceptual_Example>
