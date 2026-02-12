# API 레이어

API 레이어는 외부 통신을 담당합니다. 서버와의 통신 또는 브라우저의 로컬스토리지 쿠키등과 같은 외부 인터페이스를 모두 포함합니다.

## 개념적 예시

### 유저 API

유저 API에서는 apis 레이어에서 서버를 통해 데이터를 조회하고 응답 결과를 반환합니다.

```ts
// API
// 파일 경로: _pages/user/_apis/user/user.tsx
...
// 유저 정보 조회
export const fetchUser = async (...) => {
  try {
    // axios를 통해 외부 서버에서 데이터를 조회
    const result = await axios.get(...);
    return result;
  } catch(error) {
    if(isAxiosError(error)) {
      // 서버 HTTP 응답 코드에 대한 예외 처리
      if(error.response?.status === 404) {
        return undefined;
      }
    }
    throw error;
  }
}
```

### 유저 설정 정보 LocalStorage에서 조회

유저의 상태를 브라우저 로컬스토리지에 저장하고 사용하는 예시 입니다.

```ts
// API
// 파일 경로: _pages/user/_apis/user/user.ts
...
// 유저 설정 정보 조회
export const fetchUserSetting = async (...) => {
  try {
    // 브라우저 로컬 스토리지를 통해 데이터 조회
    const settings = window.localStorage.getItem("settings") || {};
    return settings ? JSON.parse(settings) : { theme: "light" };
  } catch(error) {
    return {
      theme: "light"
    }
  }
}
```
