# Roulette Config-Driven Design

**Date:** 2026-03-22

**Scope:** `roulette-wheel` 1차 리빌드

## Goal

현재 [src/routes/roulette-wheel.js](/Users/cminseo/Documents/scripts/HTML-Sites/simpletool-app/src/routes/roulette-wheel.js)에 섞여 있는 UI, 규칙, preset, 운영 surface를 분리해 `config-driven 운영형 contract` 위에 현대적 UI와 경쟁형 mode pack을 올린다.

## Decisions

- 구현 우선순위는 `룰렛 먼저`로 고정한다.
- 첫 패스의 핵심 가치는 `운영 유연성`이다.
- 설정 소스는 외부 파일이나 API가 아니라 `코드 내 JS config`를 사용한다.
- config 범위는 `게임 + UI + 운영`까지 포함한다.
- 1차 mode pack은 `standard`, `weighted`, `elimination`, `bestOfSeries`, `bracket`다.

## Recommended Approach

세 가지 접근 중 `현재 route 파일 확장`, `config/runtime/render 분리`, `엔진 계층 분리`를 비교했을 때, 이번 패스에는 `config/runtime/render 분리`가 맞다.

- route 파일 확장은 빠르지만 하드코딩이 계속 누적된다.
- 별도 엔진 계층은 장기적으로 강하지만 현재 범위에는 과하다.
- config/runtime/render 분리는 현재 Worker 구조를 유지하면서도 유연성, i18n, 운영 surface를 안정적으로 수용한다.

## Architecture

### 1. Contract

룰렛은 하나의 거대 object가 아니라 합성 가능한 projection들로 관리한다.

- `rouletteCatalog`
  - 게임 식별자, feature flags, ad-safe 정책, 기본 layout 참조
- `rouletteThemes`
  - 색상 토큰, stage finish, badge style, result card style, motion intensity
- `roulettePresets`
  - 세그먼트, 기본 weight, 추천 mode, featured 여부, 운영 태그
- `rouletteModes`
  - `standard`, `weighted`, `elimination`, `bestOfSeries`, `bracket`의 규칙 정의와 UI schema

모든 사용자 노출 문자열은 raw text가 아니라 translation key 기반으로 둔다.

### 2. Runtime

상태는 다음 단계로 분리한다.

- `editing`
- `ready`
- `spinning`
- `roundResult`
- `seriesProgress`
- `bracketProgress`
- `completed`

핵심 원칙은 `게임 규칙 상태`와 `UI 표시 상태`를 분리하는 것이다. mode engine이 snapshot을 만들고 UI는 그 snapshot을 렌더한다.

### 3. Rendering

route는 page shell과 mount만 담당하고, 실제 렌더링은 stage와 panel projection으로 분리한다.

- hero / stage / mode panel / preset panel / stats panel / series panel / bracket panel
- section order는 config에서 제어한다.
- featured preset, sponsor-safe labels, ad-safe placement도 config에서 제어한다.

## File Plan

- Modify: [src/routes/roulette-wheel.js](/Users/cminseo/Documents/scripts/HTML-Sites/simpletool-app/src/routes/roulette-wheel.js)
  - page shell만 남기고 runtime/render 호출로 축소
- Create: `src/games/roulette/config.js`
- Create: `src/games/roulette/runtime.js`
- Create: `src/games/roulette/render.js`
- Create: `src/games/roulette/storage.js`
- Modify: [src/utils/i18n.js](/Users/cminseo/Documents/scripts/HTML-Sites/simpletool-app/src/utils/i18n.js)
- Create: `src/games/roulette/roulette-config.test.js`
- Create: `src/games/roulette/roulette-runtime.test.js`
- Create: `tests/e2e/roulette-competitive-modes.spec.js`

## MVP

첫 MVP에서 반드시 포함할 항목:

- preset/theme/badge/section order config화
- `standard`, `weighted`, `elimination`, `bestOfSeries`, `bracket`
- stage 중심 UI 재구성
- i18n key 기반 label contract
- ad-safe placement contract

## Risks

- 현재 route 파일이 너무 많은 책임을 가진다.
- `bestOfSeries`와 `bracket`은 progression state를 잘못 설계하면 replay와 stats가 깨진다.
- config label을 raw string으로 두면 전역 i18n 계약이 다시 깨진다.
- AdSense를 game stage 내부에 넣으면 UX와 정책 리스크가 커진다.

## Non-Goals

- 외부 CMS/API preset 관리
- marble-roulette 수준의 물리 엔진 도입
- legal/blog/faq 본문 전체 번역 migration

## Verification Target

- config contract unit test
- mode progression unit test
- request-visible locale metadata regression
- competitive mode Playwright flow
- ad-safe placement render assertions
