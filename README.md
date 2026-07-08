<div align="center">

# 심야의 전산학부 · E3-5 탈출

**새벽 3시 14분에 멈춰 버린 전산학부 건물. 흩어진 기억을 조립해 빠져나가라.**

괴물도, 점프 스케어도 없다. 공포는 오직 *증거*에서 나온다 — 브라우저로 즐기는 심리 호러 방탈출.

<br>

`웹 방탈출 게임` · `심리 호러 / 미스터리` · `Vanilla JS + Canvas` · `2인 1팀` · `KRAFTON 몰입캠프 W1`

</div>

---

## 팀원

| 이름 | GitHub | 역할 |
|---|---|---|
| 김태현 | [@terry2549](https://github.com/terry2549) | 백엔드 리더보드(API)·기록 저장·배포, 퍼즐 유형 리서치 |
| 이유담 | [@omok00](https://github.com/omok00) | 게임 클라이언트(엔진·퍼즐·손전등·미니맵)·스토리·연출·문서화 |

---

## 기획안

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

## 기능 명세서 

# 필수 기능
[ ] **Top-down movement** — 방향키/WASD 이동 + 마우스 클릭 상호작용, 새로고침 없는 단일 화면

[ ] **Flashlight-based visibility system** — 어둠 속에서 손전등 반경만 밝게, 탐색의 긴장감

[ ] **Interaction** — 특정 물체 근처에 가면 퍼즐이나 설명 띄움

[ ] **Minimap** — 호실 번호를 항상 표시하고 현재·방문·잠금 상태를 색으로 구분

[ ] **Online Leaderboard** — 닉네임 기반 클리어 타임 랭킹(동률 시 힌트 적은 순)

[ ] **Operation**

| input | action |
|---|---|
| `방향키` / `WASD` | 이동 |
| `마우스 클릭`/ E | 오브젝트 상호작용 / 퍼즐 입력 |
| `F` | 손전등 On/Off |
| 화면 키패드 | 도어락 · 숫자 · 한글 자판 · A~Z 입력 (물리 키보드 없이도 가능) |

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| **클라이언트** | Vanilla JavaScript · HTML5 Canvas · CSS (프레임워크·빌드 없음, 단일 파일) |
| **오디오** | Web Audio API (합성 앰비언트, 외부 음원 0개) |
| **서버** | Node.js · Express 4 (정적 서빙 + 리더보드 REST API) |
| **저장소** | JSON 파일(`scores.json`) 기반 리더보드 |
| **협업** | GitHub (브랜치 전략) · VS Code |

> 순수 웹 표준으로 구현해 **어떤 브라우저에서도 링크 접속 즉시 실행**되도록 설계했습니다.

---

## IA 및 화면 설계서

**IA**


<img width="583" height="355" alt="image" src="https://github.com/user-attachments/assets/7ed6634b-f99e-4504-b5a4-28a4d7ec88b1" />


**화면 설계서**

주요 화면: **프로필/시작**(닉네임·리더보드) · **게임 플레이**(캔버스 + 미니맵·인벤토리·저널·손전등·조각 HUD) · **퍼즐 모달**(입력 UI·힌트 위젯) · **엔딩**(서술 결말·랭킹).


<img width="584" height="353" alt="image" src="https://github.com/user-attachments/assets/6874f3d6-2fca-48e6-a304-a33afc0aff73" />


---

## DB 및 API

서버가 저장하는 대상은 **리더보드 하나**다. 게임 진행 상태는 클라이언트 메모리에서만 관리한다.

**리더보드 레코드 (`업데이트 모델/data/scores.json`)**

| 필드 | 타입 | 설명 |
|---|---|---|
| `nickname` | string | 닉네임 (최대 12자) |
| `clearTimeMs` | number | 클리어 시간(ms), `> 0` |
| `clearedAt` | string(ISO8601) | 클리어 시각(UTC, 서버 생성) |

**REST API** (`업데이트 모델/server/index.js`)

| Method | Endpoint | 설명 | 요청 | 응답 |
|---|---|---|---|---|
| `GET` | `/api/leaderboard` | 상위 10위 조회 (타임↑ → 힌트↑) | — | `[{nickname, clearTimeMs, hints, clearedAt}]` |
| `POST` | `/api/scores` | 기록 제출 | `{nickname, clearTimeMs, hints}` | `201` 저장된 기록 |
| `POST` | `/api/leaderboard/reset` | 랭킹 초기화(관리자) | `{adminCode}` | `{ok:true}` / `403` |

**에러**: 닉네임 누락 `400` · 클리어시간 비정상 `400` · 관리자코드 불일치 `403` · 서버 오류 `500`.

---

## 배포 결과물

- **서비스 URL:** https://terry2549.madcamp-kaist.org/move2d_update.html
- **실행방법:** 링크 접속 후 닉네임 입력
- **저장소:** https://github.com/madcamp-official/26s-w1-c1-04

---

## 회고 문서

### Keep

- 게임 분위기에 맞는 디자인
- 높은 퀄리티의 문제 제공

### Problem

- 유지보수성과 확장성이 떨어지는 단일 HTML 개발.
- 문제 데이터 베이스를 구축했으나, 단일 HTML에서 구동시킴. 

### Try

- 실제 건물 기반 거리뷰 이동방식
- 닉네임별 진행상황 저장

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

-방탈출고사
https://roomescapetest.swygbro.com/
