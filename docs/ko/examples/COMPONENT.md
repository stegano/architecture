# 컴포넌트 레이어

컴포넌트 레이어는 내부적으로 외부 상태 값을 참조하지 않는 순수 컴포넌트 레이어 입니다. 주입된 속성이나 내부 상태정보만을 이용합니다.

## 개념적 예시

### 유저 프로필 컴포넌트

유저 프로필 컴포넌트는 부모 모듈로부터 속성을 주입받아 UI를 표시할 수 있으며, 내부적으로 상태를 갖을수도 있습니다.

```tsx
// 컴포넌트
// 파일 경로: _pages/user/_containers/user/_components/profile/user.tsx
...
export const Profile: React.FC = ({ id, name, age }) => {
  // 내부 상태를 사용하는것을 허용
  const [isDetailShow, setIsDetailShow] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setIsDetailShow((prev) => !prev)}>id: {id}</button>
      {isDetailShow && (<p>name: {name}</p><p>age: {age}</p>)}
    </div>
  )
}
```
