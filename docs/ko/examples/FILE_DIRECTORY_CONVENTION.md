# 파일 디렉토리 컨벤션

1. 파일 및 디렉터리명은 Kebab-case를 사용하여 영문 소문자 및 대시(-)를 이용하여 작성합니다.
   - 일부 시스템에서 대소문자를 구분하지 않는 이슈를 사전에 방지하고 일관성 있게 하기 위함입니다.
2. 레이어 디렉터리는 언더바(\_) 접두사를 이용하여 작성합니다.
   - 일반 모듈과 구분을 위해 접두사를 이용합니다.
3. \*.stories.ts, \*.schema.ts, \*.type.ts, \*.test.ts 등과 같이 파일내 코드를 기능별로 분리하면 모듈의 역할을 명확하게 하고 복잡도를 낮출 수 있습니다. 필요시 팀과 협의하여 접미사를 추가하여 사용할 수 있습니다.

## 모듈 그룹화

각 모듈은 디렉터리 형태로 그룹화하거나 또는 디렉터리를 생략할 수 있습니다. 프로젝트 또는 레이어내에서 일관된 방법으로 사용하세요.

### 디렉터리로 모듈 구분

디렉터리로 각 모듈을 구분하여 사용하는 경우 디렉터리는 모듈명이되며 하위에 각 파일들이 위치합니다.

```bash
└── _pages
    └── main
        ├── main.tsx
        └── main.type.ts
    └── account
        ├── account.tsx
        └── account.type.ts
```

### 파일 단위로 구분

디렉터리를 생략하고 파일로 모듈을 구분할 수 있습니다. 모듈이 하위 레이어를 포함할 경우 디렉터리를 이용하여 모듈을 구분해야 합니다.

```bash
└── _pages
    ├── main.tsx
    ├── main.type.ts
    ├── account.tsx
    └── account.type.ts
```

## 접미사로 기능 분리하기

```ts
// 스키마
// 파일 경로: _apis/account/account.schema.ts
// zod 라이브러리를 이용하여 스키마 생성하기
...
export const AccountSchema = z.object({...});
```

```ts
// 타입
// 파일 경로: _apis/account/account.type.ts
// 스키마를 기반으로 타입 생성하기
import { AccountSchema } from "./account.schema.ts"
...
export type Account = z.infer<typeof AccountSchema>;
```
