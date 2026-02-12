# 상태 레이어

상태 레이어는 ReactQuery, Zustand 등과 같은 앱에서 사용하는 전역 상태를 관리하는 라이브러리를 사용하여 모듈을 구성할 수 있습니다. 데이터 요청 및 응답에 대한 비지니스 로직을 포함할 수 있습니다.

## 개념적 예시

### 유저 상태

유저 상태에서는 apis 레이어에서 외부 데이터를 조회하거나 업데이트하고 결과를 반환합니다. 아래는 ReactHook을 이용하여 조회 및 업데이트 모듈을 구현한 예시입니다.

```ts
// 상태
// 파일 경로: _pages/user/_states/user/user.ts
...
import { fetchUser, updateUser } from "./_apis/user/user.ts";

// 유저 정보 조회
export const useUserFetch = () => {
  return useQuery({
    ...
    queryFn: async () => {
      // 이곳에서 타입이나 조건을 검증하는 비지니스 로직을 포함할 수도 있습니다.
      const result = await fetchUser();
      return result;
    }
  });
}
// 유저 정보 업데이트
export const useUserUpdate = () => {
  return useMutation({
    ...
    mutationFn: async (data) => {
      // 이곳에서 데이터를 검증하는 비지니스 로직을 포함할 수도 있습니다.
      await updateUser(data);
    }
  });
}
```

### 컴포넌트를 참조하는 상태 훅

다이얼로그 훅을 만들어 하위 컴포넌트 레이어에서 Dialog를 이용하여 다이얼로그 훅을 만든 예시 입니다.

```tsx
// 상태
// 파일 경로: _states/dialog/dialog.tsx
...
import { Dialog } from "/_components/dialog/dialog.tsx"

// 유저 정보 조회
export const useDialog = () => {
  const [content, setContent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  return {
    showDialog: (content) => {
      setContent(content);
      setIsOpen(true);
    },
    closeDialog: () => {
      setIsOpen(false);
      setContent(null);
    },
    dialogComponent: <Dialog open={isOpen}>{content}</Dialog>
  }
}
```
