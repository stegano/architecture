# 유틸 레이어

유틸 레이어는 미리 정의된 레이어 항목 외에 나머지 항목들을 포함할 수 있는 공간입니다. 날짜 포맷팅, 정규식 검사 등 특정 도메인에 종속되지 않는 순수 함수들이 주로 위치합니다.

너무 세분화된 레이어는 아키텍처의 러닝커브와 모호함을 증가시킬 수 있습니다. 하지만 필요하다면 단방향 레이어 원칙(상위 레이어가 하위 레이어를 참조)을 엄격히 준수하는 조건 하에, 팀과 협의하여 새로운 레이어를 정의하여 사용할 수 있습니다.

## 개념적 예시

### 날짜 포맷팅 유틸

유틸 레이어는 최하단에 위치한 레이어로 어떠한 상위 레이어(Pages, Components, States, APIs)도 참조하지 않는 독립적인 모듈이어야 합니다.

```ts
// 유틸
// 파일 경로: _utils/date/formatter.ts

import { format } from "date-fns"; // 외부 라이브러리 참조는 가능

// 날짜를 YYYY-MM-DD 형태로 변환
export const toYMD = (date: Date | number): string => {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
};
```
