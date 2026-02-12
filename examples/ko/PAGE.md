# 페이지 레이어

페이지 레이어는 브라우저와 상호작용하는 기능을 포함하는 레이어입니다. 브라우저 호스트 객체를 참조하거나 페이지 네비게이션 기능등이 포함될 수 있습니다.
페이지 레이어에서 비지니스 로직에 대한 구현을 완료하고, 필요에 따라 점진적으로 하위 레이어로 모듈을 분리하는것을 권장합니다.

## 개념적 예시

### 유저 페이지

유저 페이지는 다음과 같이 구성될 수 있으며 아래 예시에서는 페이지 레이어에서 컨테이너 레이어 구현을 포함하고 있습니다. 초기 빠른 개발을 위해 페이지 레이어에서 모든 구현을 완료하고 점진적으로 하위 레이어로 분리하는 것을 권고합니다.

```tsx
// 페이지
// 파일 경로: _pages/user/user.tsx
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

아래는 페이지 레이어를 리팩토링하여 컨테이너 레이어로 분리한 결과 입니다. 페이지에서는 브라우저 라우팅 처리를 구현하여 컨테이너에게 전달하고 컨테이너에서는 데이터를 불러와 프로필 컴포넌트에 전달하여 화면에 표시합니다. 컨테이너 내부에서 로그인 버튼이 눌러졌을때 라우팅 처리를 직접하는 대신 페이지에 위임할 수 있도록 onSignInClick 속성을 만들어 사용 하였습니다.

```tsx
// 페이지
// 파일 경로: _pages/user/user.tsx
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
// 컨테이너
// 파일 경로: _pages/user/_container/user/user.tsx
...
import { Profile } from "./_components/profile/profile.tsx";

export const User: React.FC = ({ onSignInClick }) => {
  const { data } = useUserFetch();
  return !!data
    ? <Profile data={data} />
    : <button onClick={handleSignInClick}>로그인</button>;
}
```
