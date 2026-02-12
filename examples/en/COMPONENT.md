# Component Layer

The Component layer is a pure component layer that does not refer to external state values internally. It only uses injected properties or internal state information.

## Conceptual Example

### User Profile Component

The User Profile Component can display UI by receiving properties from the parent module, and may also have internal state.

```tsx
// Component
// File Path: _pages/user/_containers/user/_components/profile/user.tsx
...
export const Profile: React.FC = ({ id, name, age }) => {
  // Internal state is allowed
  const [isDetailShow, setIsDetailShow] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setIsDetailShow((prev) => !prev)}>id: {id}</button>
      {isDetailShow && (<p>name: {name}</p><p>age: {age}</p>)}
    </div>
  )
}
```