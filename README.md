# Casual Game World

광고 수익형 캐주얼 WebGL/Canvas 게임 모음 사이트의 MVP 모노레포입니다. Vue 3 포털, iframe 게임 런타임, Express API, 공통 Game SDK 구조로 구성했습니다.

## Packages

- `apps/web`: Vue 3 + Vite + Pinia + Vue Router 프론트엔드
- `apps/api`: Express API, 인증/게임 카탈로그/세션/점수/랭킹/광고/관리자 엔드포인트
- `packages/shared`: 프론트/API 공통 계약 타입
- `packages/game-sdk`: iframe 게임과 포털 간 `postMessage` 브리지

## Run

```bash
npm install --cache /tmp/cgw-npm-cache
npm run dev
```

- web: `http://localhost:5173`
- web: `http://localhost:5174`
- api: `http://localhost:3001`

## Demo Accounts

- user: `player@casualgame.world` / `Player123!`
- admin: `admin@casualgame.world` / `Admin123!`

## Implemented MVP

- 메인/게임목록/상세/플레이/랭킹/로그인/회원가입/프로필/관리자/약관/개인정보 페이지
- iframe 기반 샘플 게임 3종
- 점수 세션 발급, 점수 제출, 게임별/글로벌 랭킹
- 비회원 플레이 + 로그인 기반 기록 저장
- 공통 광고 슬롯 컴포넌트와 보상형 광고 시뮬레이션
- 관리자 게임 등록/게시 상태 변경

## Notes

- 현재 API 저장소는 로컬 MVP 기준 인메모리 저장소를 사용합니다.
- 타입과 모듈 구조는 PostgreSQL/Redis 기반 실서비스로 옮기기 쉽게 분리했습니다.
