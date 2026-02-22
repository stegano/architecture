# Agents 지침

## 개요

아키텍처 규칙의 1차 기준은 리포지토리 `skills/` 디렉터리입니다.
`skills/`는 `docs/` 없이도 동작하도록 자체 포함(self-contained)된 규칙 집합입니다.

## 스킬 기반 활성화

- `skills/fla-architecture/SKILL.md` (항상 적용)
- `skills/fla-file-directory-convention/SKILL.md` (파일/디렉터리 생성·이동·리네임, 모듈 구조 변경 시)
- `skills/fla-layer-resolver/SKILL.md` (경로의 가장 깊은 레이어 기준으로 유효 레이어 스킬 선택)

레이어 스킬:
- `/_pages/` -> `skills/fla-page/SKILL.md`
- `/_containers/` -> `skills/fla-container/SKILL.md`
- `/_states/` -> `skills/fla-state/SKILL.md`
- `/_components/` -> `skills/fla-component/SKILL.md`
- `/_apis/` -> `skills/fla-api/SKILL.md`
- `/_utils/` -> `skills/fla-util/SKILL.md`

## 작업 방침

수정 대상 파일의 기존 스타일/흐름을 먼저 파악하고 변경 범위를 최소화합니다.
레이어 디렉터리 밖을 수정할 때는 글로벌 규칙과 파일/디렉터리 규칙만 우선 적용합니다.
