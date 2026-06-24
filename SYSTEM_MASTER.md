# 한자팝(HanjaPop) — 시스템 마스터 가이드

> **이 문서가 기준입니다.**  
> 모든 수치는 실제 코드 기준으로 작성.  
> 최종 업데이트: 2026-06-25 (사자성어·급수 학습관 추가 / 스트릭 XP 배율 제거 / RevenueCat 연동 / 파일 경로 hanja-explorer 이전)

---

## 목차

1. [전체 화면 흐름](#1-전체-화면-흐름)
2. [커리큘럼 구조](#2-커리큘럼-구조)
3. [문제 출제 방식 — 컨텐트 풀 & SRS](#3-문제-출제-방식--컨텐트-풀--srs)
4. [레벨 시스템 (20레벨)](#4-레벨-시스템-20레벨)
5. [XP 획득 시스템](#5-xp-획득-시스템)
6. [뱃지 시스템 (활동 뱃지 6종)](#6-뱃지-시스템-활동-뱃지-6종)
7. [급수 인증 시험 & 급수 뱃지](#7-급수-인증-시험--급수-뱃지)
8. [오답 알림 시스템](#8-오답-알림-시스템)
9. [프리미엄 전환 체계](#9-프리미엄-전환-체계)
10. [일일 미션 시스템](#10-일일-미션-시스템)
11. [스트릭 시스템](#11-스트릭-시스템)
12. [캐릭터 & 랭크 시스템](#12-캐릭터--랭크-시스템)
13. [사자성어 시스템](#13-사자성어-시스템)
14. [급수별 학습관](#14-급수별-학습관)
15. [localStorage 키 목록](#15-localstorage-키-목록)

---

## 1. 전체 화면 흐름

> 기준 파일: `frontend/src/App.jsx`

### 앱 진입 시 렌더 우선순위 (조건 순서)

```
1. onboardingDone === false
   → OnboardingScreen (첫 레벨 테스트 + 급수 선택)

2. selectedCharacter === null
   → CharacterSelectionScreen (캐릭터 & 닉네임 설정)

3. !sessionDoneToday && canAccessStage(unlockedPack, currentDay)
   → DailySessionScreen (오늘의 일일 학습 세션)

4. 나머지 → renderScreen() (currentScreen 기반 라우팅)
```

### DailySessionScreen 진입 조건
- 오늘 아직 세션을 완료하지 않았고(`!sessionDoneToday`)
- 현재 커리큘럼 단계에 접근 가능할 때(`canAccessStage(pack, currentDay)`)
- **프리미엄 미구매(Day 18+)**: `canAccessStage`가 false → DailySessionScreen 건너뜀 → 메인화면

### DailySessionScreen 완료 흐름
```
DailySessionScreen 완료
  → advanceDay()         : completedDay + 1 (커리큘럼 진행)
  → incrementTodaySessionCount()
  → addBonusXp(200)      : +200 XP 학습 지도 완주 보너스
  → sessionDoneToday = true
  → 로그인 유저 / skipLoginModal   → setCurrentScreen('main')
  → 비로그인 유저               → setShowSaveModal(true) (로그인 유도 모달)
  → [useEffect] completedDay 변경 감지 → gradeTestAlert 체크 → GradeTestAlertModal 팝업
```

### 주요 화면 목록 (currentScreen 값)

| 화면 | currentScreen | 진입 경로 |
|------|--------------|---------|
| 메인 메뉴 | `'main'` | 기본 / 세션 완료 후 |
| 한자 학습지(자유) | `'flashcard'` | 메인에서 |
| 획순 테스트 | `'writing'` | 메인 or 플래시카드에서 |
| 메모리 게임 | `'matchGame'` | 메인에서 |
| 몬스터 슈팅 | `'shootGame'` | 메인에서 |
| 문장 퀴즈 | `'sentenceQuiz'` | 메인에서 |
| 단어 퀴즈 | `'wordQuiz'` | 메인에서 |
| **사자성어 퀴즈** | `'idiomQuiz'` | 메인에서 (신규) |
| 오답 복습 | `'review'` | 메인 / 퀴즈 완료 후 |
| 마이페이지 | `'mypage'` | 메인에서 |
| 달력/기록 | `'calendar'` | 마이페이지에서 |
| 단어장 | `'vocabulary'` | 마이페이지에서 |
| **오답 단어장** | `'wrongVocabulary'` | 메인에서 (신규) |
| **급수 시험 선택** | `'gradeExamSelect'` | 메인에서 (신규) |
| **급수별 학습관** | `'gradeStudyDashboard'` | gradeExamSelect에서 (신규) |
| 8급 인증 시험 | `'gradeTest'` | 마이페이지 / GradeTestAlertModal |
| 7급Ⅱ 인증 시험 | `'gradeTest72'` | 마이페이지 / GradeTestAlertModal |
| 7급 인증 시험 | `'gradeTest7'` | 마이페이지 / GradeTestAlertModal |
| 6급Ⅱ 인증 시험 | `'gradeTest62'` | 마이페이지 / GradeTestAlertModal |
| 6급 인증 시험 | `'gradeTest6'` | 마이페이지 / GradeTestAlertModal |
| 레벨 테스트 | `'levelTest'` | 메인에서 |
| 설정 | `'settings'` | 메인에서 |

---

## 2. 커리큘럼 구조

> 기준 파일: `frontend/src/data/dailyCurriculum.js`
> 총 **124일**, 커리큘럼 한자 **369자**
> Day 1~123은 하루 3자 중심, Day 124는 신규 한자 없이 최종 피날레/복습 보스 구성

```
Day  1 ~ 17   │ FREE  (무료)   │ 17일  ·  51자  · 8급 전용
Day 18 ~ 51   │ PACK1 (기초 팩) │ 34일  · 100자  · 7급Ⅱ / 7급
Day 52 ~ 124  │ PACK2 (심화 팩) │ 73일  · 219자  · 6급Ⅱ / 6급 / NON
```

> 급수 순서로 완전히 정렬됨: 8급 → 7급Ⅱ → 7급 → 6급Ⅱ → 6급 → NON  
> 한 Day 안에 서로 다른 급수가 섞이지 않음.

### 커리큘럼 이정표 (milestones)

| Day | 이벤트 | 설명 |
|-----|-------|------|
| 5 | 리뷰 게이트 | 1~4일차 복습 체크 |
| 10 | 리뷰 게이트 | |
| 15 | 리뷰 게이트 | |
| **17** | **8급 급수 시험 알림** + 보스 배틀 | free 구간 마지막 · 프리미엄 게이트 발동 |
| 27 | 리뷰 게이트 | |
| 32 | 리뷰 게이트 | |
| **34** | **7급Ⅱ 급수 시험 알림** | 7급Ⅱ 구간 마지막 |
| 39 | 리뷰 게이트 | |
| 44 | 리뷰 게이트 | |
| 47 | 리뷰 게이트 | |
| 50 | 리뷰 게이트 | |
| **51** | **7급 급수 시험 알림** + 보스 배틀 | pack1 마지막 |
| 56 | 리뷰 게이트 | |
| 61 | 리뷰 게이트 | |
| 66 | 리뷰 게이트 | |
| **76** | **6급Ⅱ 급수 시험 알림** | 6급Ⅱ 구간 마지막 |
| 79 | 리뷰 게이트 | |
| ~86 | 보스 배틀 | pack2 중반 |
| ~93 | 리뷰 게이트 | |
| ~96 / ~97 | 리뷰 게이트 (연속) | |
| **101** | **6급 급수 시험 알림** | 6급 구간 마지막 |
| ~103 | 리뷰 게이트 | |
| ~105 | 보스 배틀 | pack2 후반 |
| ~107 | 리뷰 게이트 | |
| ~121 | 리뷰 게이트 | |
| **~122** | **최종 보스 배틀** | |
| **124** | **전체 커리큘럼 완료** + **최종 보스 배틀** | 신규 한자 없음 · 직전 학습 한자로 복습 피날레 |

> 리뷰 게이트: 해당 일차의 한자가 리뷰 중심으로 구성됨 (신규 한자 없음)  
> 보스 배틀: 해당 일차의 `boss: true` 플래그 — DailySessionScreen 내 특별 연출  
> 급수 시험 알림: `gradeTestAlert` 필드 — 완료 시 GradeTestAlertModal 자동 팝업  
> Day 124는 `hanja: []`이므로 DailySessionScreen에서 직전 학습 한자 3개를 복습 카드/게임 풀로 대체해 빈 데이터 진입을 방지함.  
> Day 124 결과 화면에서는 다음 단계 버튼을 숨기고 메인 이동만 표시함.

---

## 3. 문제 출제 방식 — 컨텐트 풀 & SRS

> 기준 파일: `frontend/src/utils/learningPool.js`, `frontend/src/hooks/useSRS.js`, `frontend/src/App.jsx`

### 컨텐트 풀(Content Pool) 개념

게임 5종(플래시카드·메모리·슈팅·문장퀴즈·단어퀴즈)은 **하나의 공유 풀**에서 문제를 뽑습니다.

```
effectivePool = buildUnifiedPool(
    todayHanjaIds,   // 오늘 커리큘럼 한자 (main, 약 70%)
    hanjaData,
    srsData,
    masteryData,
    pastHanjaIds,    // 이전에 학습한 한자 전체 (review, 약 30%)
    targetReviewRatio = 0.3,
    wordData
)
```

반환 구조:
```js
{
  main:   { hanjaIds: [...], wordIds: [...] },  // 오늘 신규
  review: { hanjaIds: [...], wordIds: [...] },  // SRS 복습
  ratio:  0.7,                                  // 실제 main 비율
}
```

### 세션 큐 (Session Queue)

풀이 바뀔 때 **한 번 셔플** → 세션 큐에 저장 → 각 게임이 **순서대로** 소비:

```js
sessionQueueRef = {
  hanjaIds: [...shuffled],  // main + review 합산 후 셔플
  wordIds:  [...shuffled],
  hanjaIdx: 0,
  wordIdx:  0,
}
```

- 소진 시 자동 재셔플
- 과거 스테이지 선택 모드(`selectedPastStage`) / 급수 선택 모드(`selectedGrade`) 시 해당 풀로 전환

### 과거 스테이지 / 급수 선택 모드

| 모드 | 풀 구성 |
|------|--------|
| 기본 (오늘 학습) | `buildUnifiedPool` (오늘 70% + 복습 30%) |
| 과거 스테이지 선택 | 선택한 Day의 한자만, ratio=1.0 |
| 급수 선택 | 해당 급수 중 `clearedHanjaIds`에 포함된 것만, ratio=1.0 |

### SRS (간격 반복 학습)

> SM-2 알고리즘. `useSRS.js` 기준.

복습 스케줄:
```
처음 학습 후   → 1일 후 복습
1회 정답       → 3일 후
2회 연속 정답  → 7일 후
이후           → interval × EF 일 후 (EF 기본값 2.5)
오답 시        → interval 1일 리셋, EF 하락
```

SRS 상태별 가중치:

| 상태 | 가중치 | 설명 |
|------|-------|------|
| `overdue` | 5 | 복습 기한 초과 |
| `due` | 4 | 복습 기한 도래 |
| `wrongCount ≥ 2` | 4 | 여러 번 틀림 |
| `wrongCount ≥ 1` | 3 | 한 번 틀림 |
| `new` | 3 | 처음 보는 한자 |
| `mastered` | 1 | 충분히 학습됨 |

**가중치 샘플링**: A-Res 알고리즘 (`Math.pow(Math.random(), 1/weight)` 기반)으로 중복 없이 확률적 추출.

**급수 보너스**: 유저 레벨에 맞는 급수(`getPrimaryGrades`)의 한자는 가중치 ×3.5 추가.

### 게임별 풀 사용 방식

| 게임 | 풀 사용 방식 |
|------|-----------|
| **플래시카드** | `effectivePool` → 카드 순서대로 |
| **메모리 게임** | `getNextHanjaIds(n)` → 세션 큐에서 순차 소비 |
| **몬스터 슈팅** | `buildHanjaStage(pool, 15)` → 15개씩 스테이지 구성, 안 본 한자 우선 |
| **문장 퀴즈** | `getNextWordIds(n)` → 세션 큐에서 단어 순차 소비 |
| **단어 퀴즈** | `getNextWordIds(n)` → 세션 큐에서 단어 순차 소비 |
| **오답 복습** | `buildOopsPool(wrongHanjaIds, wrongWordIds)` → SRS 없이 오답만 |

### DailySessionScreen 내 학습지 (플래시카드)

일일 세션 전용 카드. 기본적으로 `currentDayData.hanja` (오늘의 3자)를 순서대로 표시:
- 앞면: 한자 이미지 + 한자 글자
- 뒤집으면: 뜻 + 음 + 관련단어 버튼
- 카드음 재생: `/assets/audio/card_{id}.mp3` → 실패 시 TTS fallback
- 마지막 카드 완료 → 퀴즈 선택 화면으로 진행
- Day 124처럼 신규 한자가 없을 때는 직전 학습 한자 3개를 복습 카드로 표시

---

## 4. 레벨 시스템 (20레벨)

> 기준 파일: `frontend/src/utils/rankUtils.js`

```
총 20레벨 · 0 ~ 800,000 XP 누적 기준
```

| 레벨 | 필요 누적 XP | 랭크 칭호 | 캐릭터 이미지 단계 |
|-----|------------|---------|-----------------|
| Lv.1 | 0 | 새싹 | rank_1 |
| Lv.2 | 500 | 새싹 | rank_1 |
| Lv.3 | 1,500 | 성장 | rank_1 |
| Lv.4 | 3,500 | 성장 | rank_1 |
| Lv.5 | 7,000 | 중급 | rank_2 |
| Lv.6 | 12,000 | 중급 | rank_2 |
| Lv.7 | 19,000 | 고급 | rank_2 |
| Lv.8 | 28,000 | 고급 | rank_2 |
| Lv.9 | 40,000 | 마스터 | rank_3 |
| Lv.10 | 55,000 | 마스터 | rank_3 |
| Lv.11 | 75,000 | 영웅 | rank_3 |
| Lv.12 | 100,000 | 영웅 | rank_3 |
| Lv.13 | 130,000 | 전설 | rank_4 |
| Lv.14 | 170,000 | 전설 | rank_4 |
| Lv.15 | 220,000 | 신화 | rank_4 |
| Lv.16 | 280,000 | 신화 | rank_4 |
| Lv.17 | 360,000 | 천상 | rank_5 |
| Lv.18 | 460,000 | 천상 | rank_5 |
| Lv.19 | 600,000 | 불멸 | rank_5 |
| Lv.20 | 800,000 | 불멸 | rank_5 (MAX) |

**캐릭터 이미지 단계:**

| 이미지 단계 | 해당 레벨 범위 |
|-----------|-------------|
| rank_1 | Lv.1 ~ Lv.4 |
| rank_2 | Lv.5 ~ Lv.8 |
| rank_3 | Lv.9 ~ Lv.12 |
| rank_4 | Lv.13 ~ Lv.16 |
| rank_5 | Lv.17 ~ Lv.20 |

**진화(랭크업) 감지**: XP 변화 시 이전 imageRank와 현재 imageRank 비교 → rank 상승 시 RankUpModal 팝업.  
진화 임박 구간(Lv.3·4·7·8·11·12·15·16): 메인 화면 진입 시 `rank_soon` 캐릭터 토스트 표시.

---

## 5. XP 획득 시스템

> 기준 파일: `frontend/src/App.jsx`

### 활동별 기본 XP

| 활동 | XP |
|------|-----|
| 플래시카드 — 퀴즈 정답 | 정답당 +5 XP |
| 플래시카드 — 세트 완료 | **+50 XP** |
| 한자 쓰기 — 1자 완료 | **+10 XP** |
| 한자 쓰기 — 세트 완료 | **+30 XP** |
| 메모리 게임 — 1판 완료 | +20 XP |
| 몬스터 슈팅 — 웨이브 정답 | 정답당 XP (게임 내 처리) |
| 문장 퀴즈 — 정답 | 정답당 +10 XP |
| 문장 퀴즈 — 세트 완료 | **+20 XP** |
| 단어 퀴즈 — 정답 | 정답당 +5 XP |
| 단어 퀴즈 — 세트 완료 | **+20 XP** |
| 사자성어 퀴즈 — 세트 완료 | **+25 XP** (신규) |
| 레벨 테스트 — 정답 | 정답당 +10 XP |
| 레벨 테스트 — 완료 보너스 | 응시 +20 XP / 통과 추가 +50 XP / 만점 추가 +100 XP |
| **학습 지도 완주 보너스** | **+200 XP** |

> **스트릭 XP 배율 없음**: 기본 XP가 그대로 적용됨 (XP 버프 배율만 존재).

### 급수 시험 통과 보상 XP

| 시험 | 통과 보상 XP |
|------|------------|
| 8급 인증 시험 | +200 XP |
| 7급Ⅱ 인증 시험 | +300 XP |
| 7급 인증 시험 | +400 XP |
| 6급Ⅱ 인증 시험 | +500 XP |
| 6급 인증 시험 | +600 XP |

### 온보딩(첫 레벨 테스트) XP

| 진단 결과 레벨 | 기본 XP |
|-------------|--------|
| Lv.1 / 8급 출발 | +60 XP |
| Lv.2 / 8급 빠른 출발 | +90 XP |
| Lv.3 / 7급Ⅱ 감각 | +120 XP |
| Lv.4 / 7급 감각 | +150 XP |
| Lv.5 / 6급Ⅱ 감각 | +180 XP |

온보딩 기억 미니게임 결과에 따라 추가 보너스가 더해질 수 있음.

### 일일 미션 보너스 XP

각 퀘스트 완료 시 개별 XP + 전체 완료 시 **+200 XP 올클리어 보너스** (§10 참고)

### XP 버프 (일시적)

- `xp_buff_expires` (만료 timestamp) 기준
- 버프 활성 시 **×2.0**

```
최종 XP = 기본 XP × 버프배율
예) 30 XP × 2.0(버프) = 60 XP
```

---

## 6. 뱃지 시스템 (활동 뱃지 6종)

> 기준 파일: `frontend/src/components/MyPageScreen.jsx`

각 뱃지는 **5단계(Lv.1~5)**, 누적 활동 횟수 기반으로 자동 상승.

| 뱃지 | 추적 데이터 | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|-----|-----------|------|------|------|------|---------|
| 스트릭 가디언 | 연속 출석 일수 | 시작 | 7일 | 30일 | 100일 | 365일 |
| 메모리 히어로 | 메모리 게임 완료 판 수 | 시작 | 30판 | 100판 | 350판 | 1,000판 |
| 한자 챌린저 | 플래시카드 세션 완료 횟수 | 시작 | 30회 | 120회 | 300회 | 500회 |
| 퀴즈 스나이퍼 | 단어+문장 퀴즈 세트 합산 | 시작 | 30세트 | 100세트 | 400세트 | 1,200세트 |
| 몬스터 버스터 | 몬스터 슈팅 웨이브 완료 수 | 시작 | 30웨이브 | 100웨이브 | 350웨이브 | 1,000웨이브 |
| 스트로크 아티스트 | 한자 쓰기 완료 글자 수 | 시작 | 50자 | 200자 | 600자 | 2,000자 |

### 뱃지 이미지 경로
```
/assets/images/badges/badge_3d_{id}_{stage}.webp
예: badge_3d_game_3.webp (몬스터 버스터 Lv.3)
```

---

## 7. 급수 인증 시험 & 급수 뱃지

> 기준 파일: `frontend/src/components/MyPageScreen.jsx`, `frontend/src/components/GradeTestAlertModal.jsx`

### 급수 시험 체계

총 **5단계** 급수 인증 시험. 이전 급수 통과 후 다음 시험 잠금 해제.  
**마이페이지에서 언제든 도전 가능** (커리큘럼 진도 무관).

| 순서 | 시험 | 커리큘럼 이정표 | 통과 기준 | 통과 보상 |
|-----|------|--------------|---------|---------|
| 1 | **8급 인증 시험** | Day 17 완료 후 알림 | 70% 이상 | +200 XP |
| 2 | **7급Ⅱ 인증 시험** | Day 34 완료 후 알림 | 70% 이상 | +300 XP |
| 3 | **7급 인증 시험** | Day 51 완료 후 알림 | 70% 이상 | +400 XP |
| 4 | **6급Ⅱ 인증 시험** | Day 76 완료 후 알림 | 70% 이상 | +500 XP |
| 5 | **6급 인증 시험** | Day 101 완료 후 알림 | 70% 이상 | +600 XP |

### GradeTestAlertModal (급수 시험 알림 모달)

해당 Day 완료 시(`completedDay` 변경 감지 → `dailyCurriculum.js`의 `gradeTestAlert` 필드 체크) **자동 팝업**.

```
Day 17 완료 → "8급 학습 완료!" 모달 → "8급 시험 보러 가기" → gradeTest 화면
Day 34 완료 → "7급Ⅱ 학습 완료!" 모달 → gradeTest72 화면
Day 51 완료 → "7급 학습 완료!" 모달 → gradeTest7 화면
Day 76 완료 → "6급Ⅱ 학습 완료!" 모달 → gradeTest62 화면
Day 101 완료 → "6급 학습 완료!" 모달 → gradeTest6 화면
```

- "나중에 하기" → 모달 닫기 (언제든 마이페이지에서 다시 도전 가능)
- 구현: `App.jsx`의 `gradeTestAlert` state + `useEffect` on `completedDay`

### 마이페이지 시험 버튼 표시 흐름

| `unlocked_grade` 저장값 | 표시 버튼 |
|------------------------|---------|
| `null` (초기) | 8급 인증 시험 |
| `'8급'` | 7급Ⅱ 인증 시험 |
| `'7급II'` | 7급 인증 시험 |
| `'7급'` | 6급Ⅱ 인증 시험 |
| `'6급II'` | 6급 인증 시험 |
| `'6급완료'` | 완료 메시지 |

### 급수 뱃지 (5종)

| 뱃지 | 획득 조건 | 이미지 경로 |
|-----|---------|-----------|
| 8급 뱃지 | 8급 시험 통과 | `/assets/images/badges/badge_grade_8.webp` |
| 7급Ⅱ 뱃지 | 7급Ⅱ 시험 통과 | `/assets/images/badges/badge_grade_7_2.webp` |
| 7급 뱃지 | 7급 시험 통과 | `/assets/images/badges/badge_grade_7.webp` |
| 6급Ⅱ 뱃지 | 6급Ⅱ 시험 통과 | `/assets/images/badges/badge_grade_6_2.webp` |
| 6급 뱃지 | 6급 시험 통과 | `/assets/images/badges/badge_grade_6.webp` |

획득한 가장 높은 급수 뱃지가 프로필 카드 닉네임 옆에 표시됨.

---

## 8. 오답 알림 시스템

> 기준 파일: `frontend/src/App.jsx` (CharacterToast 렌더링 로직)

### 오답 복습 토스트 (`review_reminder`)

메인 화면 진입 시마다 아래 조건을 체크:

```
오답 한자 수 + 오답 단어 수 합산 ≥ 5
AND 현재 오답 수 > 마지막 알림 시점의 오답 수
```

조건 충족 시 **캐릭터 토스트 팝업** 표시 (800ms 딜레이).  
토스트 액션 버튼 → `review` 화면 (오답 복습 세션)으로 이동.

추적 키: `localStorage['last_notified_wrong_count']`  
- 오답이 줄어들면 자동 하향 동기화 (다음 번 오답 증가 시 다시 알림)
- 같은 오답 수에서는 반복 알림 안 함

### 오답 복습 세션 (`review`)

```
buildOopsPool(wrongHanjaIds, wrongWordIds)
→ WrongReviewSession (몬스터 슈팅 변형)
```

- 오답 한자/단어만 구성 (SRS 가중치 없음, ratio=1.0)
- 오답 0개 시 "오답 없음" 화면 표시
- 퀴즈 완료 후 `onGoToReview` → 직접 오답 풀 전달 가능

### 오답 단어장 (`wrongVocabulary`)

- 메인 메뉴에서 직접 진입 가능 (신규)
- 한 번이라도 틀린 단어: 오답 탭
- 모두 맞힌 단어: 정답 탭
- 탭 분리로 복습 대상 명확히 구분

### 미션 완료 토스트 (`mission_complete`)

하루 미션 전체 완료 시 팡파레 토스트 1회 표시.

---

## 9. 프리미엄 전환 체계

> 기준 파일: `frontend/src/utils/premiumAccess.js`, `frontend/src/utils/paymentUtils.js`, `frontend/src/utils/rcConfig.js`

### 팩 구성 및 가격

| 팩 ID | 이름 | 해제 단계 | 일수 | 한자 수 | 가격 |
|------|------|---------|-----|--------|-----|
| `free` | 무료 | Day 1~17 | 17일 | 51자 | 무료 |
| `pack1` | 기초 팩 | Day 18~51 | 34일 | 100자 | **₩9,900** |
| `pack2` | 심화 팩 | Day 52~124 | 73일 | 219자 | **₩13,900** |
| `fullpack` | 전체 팩 (BEST) | Day 18~124 | 107일 | 319자 | **₩19,900** |

> 개별 구매 합산: ₩23,800 → 전체 팩: ₩19,900 (약 16% 할인)

### 결제 채널 이원화

| 채널 | 사용 환경 | 비고 |
|------|---------|------|
| **Lemon Squeezy** | 웹 브라우저 | `paymentUtils.js` |
| **RevenueCat** | iOS / Android 앱 | `rcConfig.js` |

#### Lemon Squeezy 변형 ID (웹)

| 팩 | 변형 ID |
|----|---------|
| pack1 | `1763592` |
| pack2 | `1763593` |
| fullpack | `1763594` |

#### RevenueCat 설정 (앱)

| 항목 | 값 |
|------|---|
| iOS API Key | `appl_pNzDkEyCUTMxnvWJuQzrpYocFeN` |
| Android API Key | `goog_WZvGTzxNuyrupdLpaCxoIUZyqgF` |
| pack1 상품 ID | `com.soujinne.hanjaexplorer.pack1` |
| pack2 상품 ID | `com.soujinne.hanjaexplorer.pack2` |
| fullpack 상품 ID | `com.soujinne.hanjaexplorer.fullpack` |

### 접근 가능 단계 판별 함수

```js
// utils/premiumAccess.js
export const canAccessStage = (pack, stage) => {
    if (stage <= 17) return true;           // 무료 구간
    if (stage <= 51) return pack === 1 || pack === 3;  // pack1 or fullpack
    return pack === 2 || pack === 3;        // pack2 or fullpack
};
```

### 프리미엄 게이트 발동 시점

```
Day 17 커리큘럼 완료 후 Day 18 접근 시
→ canAccessStage(unlockedPack, 18) = false
→ DailySessionScreen 진입 차단
→ renderScreen() 호출 → 메인화면
→ 메인에서 "오늘의 학습 시작" 버튼 클릭 시 PremiumModal 팝업
```

### localStorage & Supabase 저장

| 키 | 값 | 의미 |
|----|---|------|
| `unlocked_pack` | `0` | 무료 유저 |
| `unlocked_pack` | `1` | pack1 구매 |
| `unlocked_pack` | `2` | pack2 구매 |
| `unlocked_pack` | `3` | fullpack 구매 |

로그인 시 Supabase에서 팩 정보 동기화.

---

## 10. 일일 미션 시스템

> 기준 파일: `frontend/src/hooks/useDailyMission.js`

매일 **7개 퀘스트** 자동 배정.  
**커리큘럼 단계(`completedDay`)별로 독립 저장** — 같은 단계에서는 날짜가 바뀌어도 유지됨.  
미션 저장 키: `stage_missions_{stage}` (동적 키).

| 미션 ID | 활동 | 목표 | 보너스 XP |
|--------|------|-----|---------|
| `flashcard_1` | 한자 학습지 1세션 완료 | 1회 | +50 XP |
| `wordquiz_1` | 단어 퀴즈 1세트 완료 | 1회 | +30 XP |
| `quiz_1` | 문장 퀴즈 1세트 완료 | 1회 | +30 XP |
| `idiom_1` | 한자성어 퀴즈 1세트 완료 | 1회 | **+25 XP** (신규) |
| `shootgame_1` | 몬스터 슈팅 1웨이브 완료 | 1회 | +20 XP |
| `match_1` | 메모리 게임 1판 완료 | 1회 | +20 XP |
| `writing_1` | 획순 테스트 1개 완료 | 1회 | +30 XP |

> 개별 미션 XP 합계: **205 XP**  
> 오늘의 퀘스트 올클리어 보너스: **+200 XP**  
> 하루 미션 최대 XP: **405 XP**

---

## 11. 스트릭 시스템

> 기준 파일: `frontend/src/hooks/useDailyMission.js`

스트릭은 **연속 출석 일수** 추적 — UI에 현재 스트릭 일수 표시.  
어제 날짜가 아닌 경우(하루 이상 건너뜀) → count 1로 리셋.

> **스트릭 XP 배율은 없음.** 과거에는 존재했으나 제거됨.  
> 스트릭은 표시 목적으로만 사용되며 XP에 영향을 주지 않음.

저장 키: `streak_data` → `{ lastDate, count }`

---

## 12. 캐릭터 & 랭크 시스템

### 선택 가능 캐릭터 (4종)

| ID | 이름 | 설명 |
|----|------|------|
| `garae` | 가래뭉치 | 용감하고 명랑 |
| `jeolmi` | 절미뭉치 | 다정하고 호기심 많음 |
| `chapssal` | 찹쌀뭉치 | 목표를 세우면 멈추지 않음 |
| `muzi` | 무지뭉치 | 다양한 매력 |

### 캐릭터 이미지 경로
```
/assets/images/characters/{charType}/rank_{n}.webp   (기본/진화)
/assets/images/characters/{charType}/success.webp    (정답)
/assets/images/characters/{charType}/failure.webp    (오답)
/assets/images/characters/{charType}/keep_going.webp (격려)
```

### 슈팅 게임 캐릭터

슈팅 게임(ShootGameScreen)에서는 캐릭터 rank를 `rank_5`로 고정 표시.

---

## 13. 사자성어 시스템

> 기준 파일: `frontend/src/components/IdiomScreen.jsx`

### 사자성어 퀴즈 (`idiomQuiz`)

목록 화면 없이 **바로 퀴즈로 진입**.  
퀴즈 3가지 유형 랜덤 출제:

| 유형 | 설명 |
|------|------|
| 괄호채우기 | 사자성어의 빈칸에 알맞은 한자 선택 |
| 독음읽기 | 사자성어의 음(독음)을 고르는 문제 |
| 뜻풀이 | 사자성어의 뜻에 해당하는 것 선택 |

- 오답 추적: `word_data`에 사자성어 오답 별도 저장
- 세트 완료 시 +25 XP + 미션 `idiom_1` 진행
- 문장 퀴즈와 달리 사자성어는 문장퀴즈 풀에서 제외됨 (`type !== 'idiom'`)

### 단어장 사자성어 탭

`vocabulary` 화면에 사자성어 탭 별도 추가.  
한 번이라도 틀린 사자성어 → 오답 탭.

### 사자성어 데이터 분류 기준

- `type: 'idiom'` — 사자성어
- `type: 'word'` — 일반 한자어
- 일부 항목이 사자성어↔단어 재분류됨 (약 301개 → 286개 사자성어)

---

## 14. 급수별 학습관

> 기준 파일: `frontend/src/components/GradeStudyDashboardScreen.jsx`, `frontend/src/components/GradeExamSelectScreen.jsx`

### 진입 경로

```
메인 메뉴 → gradeExamSelect (급수 시험 선택)
         → gradeStudyDashboard (급수별 학습관, 특정 급수 선택 후)
```

### 급수별 학습관 기능

급수를 선택하면 해당 급수 한자만으로 풀을 구성하여 학습:
- 플래시카드 (`flashcard`)
- 단어 퀴즈 (`wordQuiz`)
- 문장 퀴즈 (`sentenceQuiz`)
- 획순 테스트 (`writing`)
- 급수 모의시험 (각 급수에 해당하는 `gradeTest*` 화면)

접근 조건: 해당 급수 한자가 `clearedHanjaIds`에 포함되어 있어야 함 (커리큘럼 진행 필요).

---

## 15. localStorage 키 목록

> 기준 파일: `frontend/src/constants/storageKeys.js`

| 키 (SK 상수) | localStorage 키 | 내용 |
|------------|----------------|------|
| `SK.USER_XP` | `user_xp` | 누적 XP (number) |
| `SK.ONBOARDING_DONE` | `onboarding_done` | 온보딩 완료 여부 |
| `SK.SELECTED_CHARACTER` | `selected_character` | 캐릭터 ID |
| `SK.USER_NICKNAME` | `user_nickname` | 닉네임 |
| `SK.DARK_MODE` | `dark_mode` | 다크모드 여부 |
| `SK.XP_BUFF_EXPIRES` | `xp_buff_expires` | XP ×2 버프 만료 timestamp |
| `SK.UNLOCKED_GRADE` | `unlocked_grade` | 마지막 통과 급수 (`null`/`'8급'`/`'7급II'`/`'7급'`/`'6급II'`/`'6급완료'`) |
| `SK.DAILY_SESSION` | `daily_session` | `{ date, done }` 오늘 세션 완료 여부 |
| `SK.MISSION_HISTORY` | `mission_history` | completedDay 기준 완료 미션 이력 |
| — | `stage_missions_{stage}` | 단계별 미션 상태 (동적 키, SK 상수 없음) |
| `SK.STREAK_DATA` | `streak_data` | `{ lastDate, count }` 스트릭 정보 |
| `SK.HANJA_DATA` | `hanja_data` | 한자 mastery + SRS 통합 상태 |
| `SK.WORD_DATA` | `word_data` | 단어 오답 + 단어 SRS 통합 상태 |
| `SK.STUDY_LOG` | `study_log` | 학습 로그 + 활동 통계 통합 |
| `SK.TODAY_STATS` | `today_stats` | 오늘 활동 통계 |
| `SK.TOTAL_ACTIVITY_STATS` | `total_activity_stats` | 누적 활동 통계 (뱃지 계산 기준) |
| `SK.RECORDS` | `hanja_records` | 기록 (메모리 게임 최고 시간, 몬스터 킬 수 등) |
| `SK.PREMIUM` | `premium` | 프리미엄 상태 |
| `SK.PREMIUM_WIDGET_PAYLOAD` | `premium_widget_payload` | 위젯용 프리미엄 정보 |
| `SK.START_GRADE` | `start_grade` | 온보딩 시작 급수 |
| `SK.BGM_ON` | `hangul_bgm_on` | BGM 활성화 여부 |
| `SK.SFX_ON` | `hangul_sfx_on` | 효과음 활성화 여부 |
| `SK.BGM_VOLUME` | `hangul_bgm_volume` | BGM 볼륨 |
| `SK.SFX_VOLUME` | `hangul_sfx_volume` | 효과음 볼륨 |
| `SK.VIBRATION` | `hangul_vibration` | 진동 설정 |
| `SK.DEVICE_ID` | `device_id` | 기기 고유 ID |
| `SK.MAIN_SEEN_WORDS` | `main_seen_words` | 메인에서 본 단어 목록 |
| `SK.STUDY_SHEET_COMPLETED` | `study_sheet_completed` | 학습지 완료 여부 |
| — | `last_notified_wrong_count` | 오답 알림 기준 오답 수 (SK 상수 없음) |
| — | `curriculum_progress` | `{ completedDay, passedGateDays }` (SK 상수 없음) |

> 구버전 키 `srs_data`, `daily_missions`, `daily_missions_date`, `daily_missions_stage`는 제거됨.

---

## 부록: 커리큘럼 × 레벨 도달 시점 예상표

| 커리큘럼 | 누적 XP 추정 | 예상 레벨 |
|---------|------------|---------|
| Day 17 완료 (free 구간) | ~3,000~5,000 XP | **Lv.3~4** |
| Day 51 완료 (pack1 구간) | ~20,000~30,000 XP | **Lv.7~8** |
| Day 76 완료 (pack2 중반) | ~50,000~70,000 XP | **Lv.10~11** |
| Day 101 완료 (pack2 후반) | ~80,000~110,000 XP | **Lv.11~12** |
| Day 124 완료 (전체) | ~100,000~150,000 XP | **Lv.12~13** |
| 이후 반복 학습 | 계속 누적 | Lv.14 ~ 20 |

> Lv.13 이상은 커리큘럼 완료 후 반복 학습(리뷰·게임·퀴즈)으로 달성.  
> 뱃지 Lv.5(최고 단계)는 이 반복 구간에서 달성되도록 설계됨.
