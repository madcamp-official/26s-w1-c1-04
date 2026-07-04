/**
 * data.js
 * 맵 데이터 정의 (Graph 구조).
 * NFR: Room / Edge / Puzzle 추가·수정이 쉬운 구조로 데이터를 이곳에 모아둔다.
 *
 * - ROOMS : Vertex(방) 정의. objects = 상호작용 오브젝트, puzzle = 방 퍼즐.
 * - EDGES : 방 사이 통로. from/to 는 무향(양방향)으로 취급한다.
 *           unlockedBy = 이 Edge를 여는 방의 puzzle id.
 */

// ---- Room ID 상수 ----
const R0 = "R0"; // Corridor
const R1 = "R1"; // Pantry
const R2 = "R2"; // Immersion Classroom
const R3 = "R3"; // Open Space
const R4 = "R4"; // Office
const R5 = "R5"; // Outside (탈출구 밖)

const ROOMS = {
  [R0]: {
    id: R0,
    name: "Corridor",
    description: "사방으로 문이 나 있는 복도. 벽 끝에는 밖으로 통하는 육중한 탈출문이 보인다.",
    objects: ["🪟 창문", "🖼️ 그림", "🕯️ 촛대"],
    puzzle: {
      id: "P0",
      // 최종 탈출문 코드
      question: "무지개는 모두 몇 가지 색일까? (숫자)",
      answer: "7",
    },
  },
  [R1]: {
    id: R1,
    name: "Pantry",
    description: "선반마다 통조림과 병들이 가득한 식료품 저장실. 바구니에 달걀 한 판이 놓여 있다.",
    objects: ["🥫 통조림", "🥚 달걀 한 판", "🧺 바구니"],
    puzzle: {
      id: "P1",
      question: "달걀 한 판(30개)에서 6개를 요리에 썼다. 남은 달걀은? (숫자)",
      answer: "24",
    },
  },
  [R2]: {
    id: R2,
    name: "Immersion Classroom",
    description: "화이트보드에 이진수가 잔뜩 적혀 있는 몰입형 강의실. 노트북 화면엔 0과 1이 흐른다.",
    objects: ["📋 화이트보드", "💻 노트북", "🔢 이진수표"],
    puzzle: {
      id: "P2",
      question: "이진수 1011 을 십진수로 바꾸면? (숫자)",
      answer: "11",
    },
  },
  [R3]: {
    id: R3,
    name: "Open Space",
    description: "탁 트인 공용 공간. 화이트보드에 숫자 수열이 적혀 있다: 2, 6, 12, 20, ?",
    objects: ["🛋️ 소파", "📈 수열 메모", "🪴 화분"],
    puzzle: {
      id: "P3",
      question: "수열 2, 6, 12, 20, ? 다음에 올 수는? (숫자)",
      answer: "30",
    },
  },
  [R4]: {
    id: R4,
    name: "Office",
    description: "서류가 쌓인 책상과 잠긴 캐비닛이 있는 사무실. 벽에 건물 층별 안내도가 붙어 있다.",
    objects: ["🗄️ 캐비닛", "🏢 층별 안내도", "📎 서류더미"],
    puzzle: {
      id: "P4",
      question: "1층에서 4층까지 걸어 올라간다. 층 사이 계단이 15칸이면 오른 계단은 모두 몇 칸? (숫자)",
      answer: "45",
    },
  },
  [R5]: {
    id: R5,
    name: "Outside",
    description: "차가운 밤공기가 밀려온다. 당신은 마침내 건물 밖으로 나왔다!",
    objects: [],
    puzzle: null,
    isExit: true, // 이 방에 도달하면 게임 클리어(탈출 성공)
  },
};

/**
 * Edge 정의.
 * Corridor는 모든 방과 연결되고, 일반 방끼리는 직접 연결되지 않는다.
 * 각 문(Edge)에는 도어락이 달려 있다.
 *   gate         = 이 문을 여는 코드가 되는 퍼즐 id (그 퍼즐의 answer가 정답 코드).
 *                  마스터코드 1234 로도 항상 열 수 있다.
 *   requiresAll  = true 인 문은 다른 모든 문을 먼저 연 뒤에야 열 수 있다(최종 탈출문).
 */
const EDGES = [
  { id: "E1", from: R0, to: R1, gate: "P1" }, // Pantry 도어락
  { id: "E2", from: R0, to: R2, gate: "P2" }, // Immersion 도어락
  { id: "E3", from: R0, to: R3, gate: "P3" }, // Open Space 도어락
  { id: "E4", from: R0, to: R4, gate: "P4" }, // Office 도어락
  { id: "E5", from: R0, to: R5, gate: "P0", requiresAll: true }, // 최종 탈출문
];

const START_ROOM = R0;
const ADMIN_PASSWORD = "1234";
