# 한자팝 메인 홈 UI 리뉴얼 가이드

## 📋 개요

이 문서는 한자팝 메인 홈 UI의 완전한 리뉴얼 구현에 대한 상세 가이드입니다.

**리뉴얼 컨셉:**
> "상단은 내 성적표(뱃지/레벨), 중앙은 오늘 깰 게임 지도(7단계), 지도를 누르면 내가 얼마나 했는지 7개의 바가 슥 올라오는 구조"

---

## 🎨 주요 변경 사항

### 1. 상단: 통합 프로필 & 뱃지 대시보드 (`ProfileDashboard.jsx`)

**구조:**
- **좌측**: 뭉뚝한 3D 캐릭터 + 닉네임 + 레벨/XP 게이지
  - XP 게이지 클릭 시 상세 팝업 표시 (총 XP, 현재 레벨, 다음 레벨까지 필요 XP)
- **중앙**: 획득 뱃지 보드 (2×3 배열, 총 6개 슬롯)
  - 획득한 뱃지: 유색 글래스 + 이모지 표시
  - 미획득 뱃지: 무색 실루엣 + 🔒 표시
- **우측**: 캘린더 아이콘
  - 클릭 시 '나의 학습 캘린더' 페이지로 이동

**특징:**
- 글래스모피즘 디자인 (반투명 배경 + 블러 효과)
- 다크 모드 완벽 지원
- 모바일 반응형 레이아웃

---

### 2. 중앙: 7단계 여정 맵 (`JourneyMapOptimized.jsx`)

**맵 구성:**
```
1. 리뷰 테스트 (시작점) → 2. 학습지 → 3. 단어 퀴즈
                                    ↓
                        4. 문장 퀴즈 ← 5. 몬스터 슈팅
                                    ↓
                        6. 메모리 게임 ← 7. 획순 테스트
```

**노드 시각화:**
- **시작점 (리뷰 테스트)**: 더 크고 반짝이는 시각적 앵커
  - 외부 광채 효과 (Outer Glow)
  - 펄스 애니메이션
  - 사용자가 앱 오픈 시 무의식적으로 손가락이 가는 "시각적 닻" 역할
- **완료된 노드**: 초록색 (Emerald) + 체크마크 ✓
- **진행 중 노드**: 파란색 (Blue) + 노란 외부 광채
- **잠긴 노드**: 회색 + 흐림 + 투명도 50%

**연결선:**
- SVG로 구현된 동적 연결선
- 완료된 구간: 초록색 그라데이션 + 그림자
- 미완료 구간: 회색
- 선 위에 완료 체크마크 표시

**인터랙션:**
- 노드 클릭 시 해당 화면으로 네비게이션
- 맵 전체 클릭 시 하단 미션 바 슬라이드업
- 호버 시 노드 확대 (scale-110)

---

### 3. 하단: 슬라이드업 미션 바 (`JourneyProgressBar.jsx`)

**트리거:**
- 여정 맵 클릭 시 하단에서 부드럽게 슬라이드업

**구성:**
- **헤더**: "⚡ 오늘의 여정 진행도" + 드래그 핸들
- **진행 요약**: 완료/7, 총 보상 XP
- **미션 리스트**: 7개 항목 (각 항목마다)
  - 미니 글래스 아이콘 (노드와 동일)
  - 미션명 + 진행도 (예: 0/5)
  - 진행도 바 (완료 시 초록색 그라데이션)
  - 보상 배지 (+50 XP)
- **액션 버튼**: 닫기 + 계속 학습하기

**특징:**
- 배경 오버레이 (클릭 시 닫기)
- 모바일 최적화 (드래그 가능한 핸들)
- 부드러운 애니메이션 (ease-out)
- 최대 높이 제한 (80vh) + 스크롤 가능

---

## 🎯 7개 노드별 3D 글래스 아이콘

모든 아이콘은 다음 공통 스타일로 생성되었습니다:

> "High-quality 3D icon, chubby and rounded bold shapes, frosted semi-transparent glass texture, soft jelly-like surface, vibrant pastel colors, internal soft glow, high gloss reflection, minimal details, cute and friendly, isometric, white background."

### 아이콘 목록

| 노드 | 파일명 | 색상 | 설명 |
|------|--------|------|------|
| 1 | `node_review.png` | 자주색 (Purple) | 돋보기 + 문서 |
| 2 | `node_flashcard.png` | 크림색 (Cream) | 두루마리 + 금색 밴드 |
| 3 | `node_word_quiz.png` | 파란색 (Blue) | 전구 + 'A' 글자 |
| 4 | `node_sentence_quiz.png` | 남색 (Indigo) | 말풍선 + '漢' 글자 |
| 5 | `node_monster_shooting.png` | 마젠타 (Magenta) | 젤리 몬스터 + 왕관 |
| 6 | `node_memory_game.png` | 민트색 (Mint) | 카드 2장 + 뇌 아이콘 |
| 7 | `node_stroke_test.png` | 홀로그래픽 (Iridescent) | 붓 + 소프트 팁 |

**저장 위치:** `/frontend/public/assets/images/icons/`

---

## 📁 파일 구조

```
frontend/src/components/
├── ProfileDashboard.jsx          # 상단 프로필 & 뱃지 대시보드
├── JourneyMapOptimized.jsx       # 중앙 7단계 여정 맵 (최적화 버전)
├── JourneyProgressBar.jsx        # 하단 슬라이드업 미션 바
├── MainMenuRenewal.jsx           # 리뉴얼된 메인 메뉴 (통합)
└── MainMenu.jsx                  # 기존 메인 메뉴 (백업)

frontend/public/assets/images/icons/
├── node_review.png
├── node_flashcard.png
├── node_word_quiz.png
├── node_sentence_quiz.png
├── node_monster_shooting.png
├── node_memory_game.png
└── node_stroke_test.png
```

---

## 🚀 구현 상태

### ✅ 완료된 작업

1. **7개 노드 아이콘 생성** - 모두 생성 완료
2. **ProfileDashboard 컴포넌트** - 완성
3. **JourneyMapOptimized 컴포넌트** - SVG 연결선 포함 완성
4. **JourneyProgressBar 컴포넌트** - 슬라이드업 애니메이션 완성
5. **MainMenuRenewal 컴포넌트** - 3개 컴포넌트 통합 완성
6. **App.jsx 수정** - MainMenu → MainMenuRenewal 변경 완료

### ⏳ 다음 단계 (선택사항)

1. **실제 데이터 연동**
   - `completedStages` 상태를 실제 사용자 진행도 데이터로 연결
   - `missionData`를 실제 미션 진행 데이터로 연결

2. **애니메이션 미세 조정**
   - 시작 노드의 펄스 애니메이션 강도 조정
   - 슬라이드업 애니메이션 타이밍 조정

3. **반응형 레이아웃 테스트**
   - 다양한 화면 크기에서 테스트
   - 모바일, 태블릿, 데스크톱 모두 확인

4. **접근성 개선**
   - ARIA 라벨 추가
   - 키보드 네비게이션 지원

---

## 🎮 사용 방법

### 프로필 대시보드
- **XP 게이지 클릭**: 상세 XP 정보 팝업
- **캘린더 아이콘 클릭**: 학습 캘린더 페이지로 이동

### 여정 맵
- **노드 클릭**: 해당 화면으로 이동
- **맵 클릭**: 미션 바 슬라이드업

### 미션 바
- **배경 클릭**: 닫기
- **닫기 버튼**: 미션 바 닫기
- **계속 학습하기**: 학습 화면으로 이동

---

## 🎨 디자인 시스템

### 색상 팔레트

| 용도 | 라이트 모드 | 다크 모드 |
|------|-----------|---------|
| 배경 | white/70 | slate-900/50 |
| 테두리 | white/80 | slate-700/80 |
| 텍스트 | slate-700 | white |
| 강조 | amber-400 | amber-400 |
| 완료 | emerald-400 | emerald-500 |
| 잠금 | slate-300 | slate-600 |

### 타이포그래피

- **제목**: font-black, text-lg md:text-xl
- **라벨**: font-black, text-xs md:text-sm
- **설명**: font-bold, text-[10px] md:text-xs

### 간격 (Spacing)

- **카드 내부**: px-4 md:px-6, py-5 md:py-6
- **요소 간 간격**: gap-3 md:gap-4
- **섹션 간 간격**: gap-6 md:gap-8

---

## 🔧 개발 팁

### SVG 연결선 최적화
- `JourneyMapOptimized.jsx`에서 SVG 렌더링 최적화
- 그라데이션 정의를 `<defs>` 내에 한 번만 정의
- 선 위에 체크마크 추가 (완료 표시)

### 애니메이션
- 시작 노드: `animate-pulse` + 커스텀 box-shadow
- 슬라이드업: `translate-y-full` → `translate-y-0`
- 호버 효과: `hover:scale-110` + `transition-all`

### 반응형 디자인
- `md:` 브레이크포인트 활용
- 모바일 우선 설계
- 이미지 크기: `w-20 h-20 md:w-24 md:h-24` 패턴

---

## 📝 주의사항

1. **아이콘 경로**: 모든 아이콘은 `/assets/images/icons/` 경로에 저장되어야 합니다.
2. **다크 모드**: 모든 색상에 `dark:` 클래스가 적용되어 있습니다.
3. **성능**: SVG 연결선은 컨테이너 크기 변화 시에만 다시 렌더링됩니다.
4. **접근성**: 버튼에 `title` 속성과 `aria-label` 추가 권장.

---

## 🐛 트러블슈팅

### 아이콘이 표시되지 않음
- 경로 확인: `/assets/images/icons/node_*.png`
- 브라우저 개발자 도구에서 네트워크 탭 확인

### SVG 연결선이 렌더링되지 않음
- 컨테이너 크기가 0인지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 슬라이드업 애니메이션이 부드럽지 않음
- GPU 가속 활성화: `will-change: transform`
- 브라우저 성능 프로파일링 도구 사용

---

## 📞 지원

구현 중 문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. 컴포넌트 props 확인
3. 파일 경로 및 import 문 확인

---

**마지막 업데이트**: 2026년 5월 7일
**버전**: 1.0 (초기 리뉴얼)
