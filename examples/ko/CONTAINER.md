# 컨테이너 레이어

컨테이너는 컴포넌트를 이용하여 화면을 구성하고 데이터 상태를 핸들링 할 수 있는 레이어 입니다. 필요한 데이터를 원하는 시점에 불러오고 데이터 처리 상태에 따른 결정을 할 수 있습니다.

## 개념적 예시

### 유저 컨테이너

유저 컨테이너에서는 states 레이어에서 데이터를 조회할 수 있는 훅을 사용하여 데이터를 불러오고 데이터 상태에 따라 UI를 업데이트 할 수 있습니다.

```tsx
// 컨테이너
// 파일 경로: _pages/user/_containers/user/user.tsx
...
import { Profile } from "./_components/profile/profile.tsx";
import { useUserFetch } from "./_states/user/user.ts";

export const User: React.FC = ({ onSignInClick }) => {
  // 이 컨테이너가 랜더링 되면 ReactQuery의 useQuery로 생성된 훅을 이용하여 데이터를 불러옵니다.
  const { data, isFetching, isError, refetch } = useUserFetch();
  if(isFetching) {
    return (
      <div>데이터를 불러오는 중입니다...</div>
    );
  }
  if(isError) {
    return (
      <div>데이터 처리중 에러가 발생하였습니다.</div>
    );
  }
  return !!data
    ? <Profile data={data} />
    : <button onClick={onSignInClick}>로그인</button>;
}
```
