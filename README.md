<div align="center">

# 🌑 심야의 전산학부 · E3-5 탈출

**새벽 3시 14분에 멈춰 버린 전산학부 건물. 흩어진 기억을 조립해 빠져나가라.**

괴물도, 점프 스케어도 없다. 공포는 오직 *증거*에서 나온다 — 브라우저로 즐기는 심리 호러 방탈출.

<br>

`웹 방탈출 게임` · `심리 호러 / 미스터리` · `Vanilla JS + Canvas` · `2인 1팀` · `KRAFTON 몰입캠프 W1`

</div>

---

## 📌 프로젝트 개요

> **공통과제 I : 웹 기반 프로젝트 (2인 1팀)** — 기획부터 배포까지 웹 개발 전체 흐름을 협업으로 경험하기.

| 항목 | 내용 |
|---|---|
| **프로젝트명** | 심야의 전산학부 · E3-5 탈출 |
| **한 줄 소개** | 03:14에 멈춘 건물에서 깨어나, 기억 조각을 모아 탈출하는 서사형 방탈출 게임 |
| **장르** | 심리 호러 · 미스터리 · 방탈출 (환경 스토리텔링) |
| **플랫폼** | 웹 브라우저 (설치·회원가입 없이 링크 접속 즉시 플레이) |
| **개발 기간** | 2026-07-02 ~ 2026-07-08 (7일) |
| **팀** | `26s-w1-c1-04` (2인) |

---

## 👥 팀원

| 이름 | GitHub | 역할 |
|---|---|---|
| 김태현 | [@terry2549](https://github.com/terry2549) | 백엔드 리더보드(API)·기록 저장·배포, 퍼즐 유형 리서치 |
| 이유담 | [@omok00](https://github.com/omok00) | 게임 클라이언트(엔진·퍼즐·손전등·미니맵)·스토리·연출·문서화 |

---

## ✨ 핵심 기능

**거리뷰형 1인칭 탐험** — 방향키/WASD 이동 + 마우스 클릭 상호작용, 새로고침 없는 단일 화면

**손전등 시야 시스템** — 어둠 속에서 손전등 반경만 밝게, 탐색의 긴장감

**미니맵** — 호실 번호를 항상 표시하고 현재·방문·잠금 상태를 색으로 구분

**13종+ 아하(a-ha) 퍼즐** — 실제 방탈출고사 유형을 호러 톤으로 리메이크

**기억 조각 5개 수집** — α·β·γ·δ·ε(=3·1·4·1·5)를 옥상에서 `3 : 14 : 15` 로 배치하는 최종 관문

**온라인 리더보드** — 닉네임 기반 클리어 타임 랭킹(동률 시 힌트 적은 순)

**10분 게이트 힌트** — 퍼즐 첫 진입 후 10분이 지나야 열리는 1회성 힌트

**합성 앰비언트 BGM** — 외부 음원 없이 Web Audio API로 코드 생성

---

## 🕹️ 조작

| 입력 | 동작 |
|---|---|
| `방향키` / `WASD` | 이동 |
| `마우스 클릭` | 오브젝트 상호작용 / 퍼즐 입력 |
| `F` | 손전등 On/Off |
| 화면 키패드 | 도어락 · 숫자 · 한글 자판 · A~Z 입력 (물리 키보드 없이도 가능) |

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|---|---|
| **클라이언트** | Vanilla JavaScript · HTML5 Canvas · CSS (프레임워크·빌드 없음, 단일 파일) |
| **오디오** | Web Audio API (합성 앰비언트, 외부 음원 0개) |
| **서버** | Node.js · Express 4 (정적 서빙 + 리더보드 REST API) |
| **저장소** | JSON 파일(`scores.json`) 기반 리더보드 |
| **협업** | GitHub (브랜치 전략) · VS Code |

> 순수 웹 표준으로 구현해 **어떤 브라우저에서도 링크 접속 즉시 실행**되도록 설계했습니다.

---

## 🚀 실행 방법

```bash
# 클론 후 서버 실행 (리더보드 포함)
git clone https://github.com/madcamp-official/26s-w1-c1-04.git
cd "26s-w1-c1-04/업데이트 모델"
npm install
npm start          # → http://localhost:3000
```

> 게임만 확인하려면 `업데이트 모델/public/index.html` 을 브라우저로 바로 열어도 됩니다(리더보드는 서버가 떠 있어야 저장·조회).
> **요구사항:** Node.js 18+ / 최신 Chrome·Edge 권장. 별도 빌드 과정 없음.

**환경 변수**

| 변수 | 기본값 | 설명 |
|---|---|---|
| `PORT` | `3000` | 서버 포트 |
| `ADMIN_CODE` | `omokterry` | 리더보드 초기화용 관리자 코드 |

---

## 🗺️ 화면 흐름 (IA)

```
프로필(닉네임 입력) ─▶ 스토리 인트로 ─▶ 게임 플레이(탐험) ⇄ 퍼즐 모달
                                              │
                            [기억 조각 5개 + 옥상 진입]
                                              ▼
                                     최종 배치 퍼즐(3:14:15)
                                              ▼
                                     엔딩(서술·기록 저장)
```

주요 화면: **프로필/시작**(닉네임·리더보드) · **게임 플레이**(캔버스 + 미니맵·인벤토리·저널·손전등·조각 HUD) · **퍼즐 모달**(입력 UI·힌트 위젯) · **엔딩**(서술 결말·랭킹).

---

## 🗄️ 데이터 & API

서버가 저장하는 대상은 **리더보드 하나**다. 게임 진행 상태는 클라이언트 메모리에서만 관리한다.

**리더보드 레코드 (`업데이트 모델/data/scores.json`)**

| 필드 | 타입 | 설명 |
|---|---|---|
| `nickname` | string | 닉네임 (최대 12자) |
| `clearTimeMs` | number | 클리어 시간(ms), `> 0` |
| `hints` | number | 사용 힌트 수 (동률 tie-break) |
| `clearedAt` | string(ISO8601) | 클리어 시각(UTC, 서버 생성) |

**REST API** (`업데이트 모델/server/index.js`)

| Method | Endpoint | 설명 | 요청 | 응답 |
|---|---|---|---|---|
| `GET` | `/api/leaderboard` | 상위 10위 조회 (타임↑ → 힌트↑) | — | `[{nickname, clearTimeMs, hints, clearedAt}]` |
| `POST` | `/api/scores` | 기록 제출 | `{nickname, clearTimeMs, hints}` | `201` 저장된 기록 |
| `POST` | `/api/leaderboard/reset` | 랭킹 초기화(관리자) | `{adminCode}` | `{ok:true}` / `403` |

**에러**: 닉네임 누락 `400` · 클리어시간 비정상 `400` · 관리자코드 불일치 `403` · 서버 오류 `500`.

---

## 🌐 배포

- **서비스 URL:** _배포 후 링크 추가 예정_
- **저장소:** https://github.com/madcamp-official/26s-w1-c1-04
- Node 서버가 필요하므로 Render/Railway/Fly.io 등에 `업데이트 모델/` 을 배포(빌드 `npm install`, 시작 `npm start`). 정적 호스팅만 하면 게임은 되지만 리더보드는 비활성.

---

## 🔁 회고 (KPT)

- **Keep** — 컨셉·연출 규칙을 먼저 문서화 / 데이터 주도 설계로 방·퍼즐 확장 용이 / 이미지 base64·합성 BGM으로 외부 의존 0 / 잦은 커밋과 헤드리스 브라우저 검증
- **Problem** — 작업 파일 분기(root vs 업데이트 모델), Git 병합 충돌, 퍼즐 정답 오독(성냥개비 `SAFE`→`VIVA`), 리더보드 파일 저장의 영속성, 단일 파일 비대화
- **Try** — 단일 소스 오브 트루스 확정 / 병합 전 충돌 마커 CI 검출 / 정답 원본 대조 리뷰 절차 / 리더보드 DB 이관 / 게임 로직 모듈 분리

---

## 📁 프로젝트 구조

```
26s-w1-c1-04/
├─ README.md
└─ 업데이트 모델/                ← 실행 대상
   ├─ server/index.js           ← Express 정적 서빙 + 리더보드 API
   ├─ public/                   ← 클라이언트(정적)
   │  ├─ index.html             ← 게임 본체(단일 파일: HTML+CSS+JS+Canvas, 이미지 base64 내장)
   │  ├─ js/app.js
   │  └─ css/style.css
   ├─ data/scores.json          ← 리더보드 데이터
   └─ package.json              ← 의존성(express)·start 스크립트(node server/index.js)
```

---

## 📚 참고 자료

- [SDD(스펙 주도 개발) 이해하기](https://news.hada.io/topic?id=21338)
- [Software Design Document Best Practices](https://www.atlassian.com/work-management/project-management/design-document)
- [IA 정보구조도 작성 방법](https://brunch.co.kr/@nyonyo/7)
- [기획자 화면설계서 작성법](https://brunch.co.kr/@soup/10)
- [Figma 와이어프레임 가이드](https://www.figma.com/ko-kr/resource-library/what-is-wireframing/)
- [ERD/DB 설계 총정리](https://inpa.tistory.com/entry/DB-%F0%9F%93%9A-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%AA%A8%EB%8D%B8%EB%A7%81-%EA%B0%9C%EB%85%90-ERD-%EB%8B%A4%EC%9D%B4%EC%96%B4%EA%B7%B8%EB%9E%A8)
- [API 명세서 작성 가이드라인](https://velog.io/@sebinChu/BackEnd-API-%EB%AA%85%EC%84%B8%EC%84%9C-%EC%9E%91%EC%84%B1-%EA%B0%80%EC%9D%B4%EB%93%9C-%EB%9D%BC%EC%9D%B8)
- [좋은 README 작성하는 방법](https://velog.io/@sabo/good-readme)
- [단기 프로젝트 회고 KPT 방법론](https://velog.io/@habwa/%EB%8B%A8%EA%B8%B0-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%ED%9A%8C%EA%B3%A0-KPT-%EB%B0%A9%EB%B2%95%EB%A1%A0)

<div align="center">
<br>

*"탈출했다"가 아니라, **"내가 하나의 사건을 추리해냈다"** 는 감정을 남기는 것.*

</div>
