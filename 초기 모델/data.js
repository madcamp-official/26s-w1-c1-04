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
const R0 = "R0"; // 열린 공간
const R1 = "R1"; // 탕비실
const R2 = "R2"; // 회의실
const R3 = "R3"; // Git Room
const R4 = "R4"; // Reserved
const R5 = "R5"; // 옥상
const R6 = "R6"; // 보안실
const R7 = "R7"; // 서버실
const R8 = "R8"; // 강연실
const R9 = "R9"; // 기록보관실

const ROOMS = {
  [R0]: {
    id: R0,
    name: "열린 공간",
    description: "몰입캠프 마지막 밤의 공용 공간. 휴대폰은 먹통이고 모든 시계는 03:14에 멈춰 있다. 화이트보드에는 지워진 TODO와 '옥상에 오지 마'라는 문장이 남아 있다.",
    objects: ["Daily Scrum", "화이트보드", "팀원 자리"],
    puzzle: {
      id: "P0",
      question: "모든 기록이 반복해서 가리키는 기준 시각은? (HHMM)",
      answer: "0314",
    },
  },
  [R1]: {
    id: R1,
    name: "탕비실",
    description: "종이컵마다 같은 시각이 적혀 있고, 커피 머신 로그도 매번 같은 순서로 반복된다. 누군가 머문 흔적처럼 보이지만 동선은 지나치게 익숙하다.",
    objects: ["종이컵 03:14", "포스트잇", "커피 로그"],
    puzzle: {
      id: "P1",
      question: "반복되는 종이컵과 커피 머신 로그가 공통으로 남긴 시각은? (HHMM)",
      answer: "0314",
    },
  },
  [R2]: {
    id: R2,
    name: "회의실",
    description: "회의록과 발표 준비 체크리스트가 펼쳐져 있다. 찢어진 페이지에는 '옥상으로 오라'와 '가지 마'가 서로 다른 필체처럼 겹쳐 보인다.",
    objects: ["회의록", "체크리스트", "찢어진 페이지"],
    puzzle: {
      id: "P2",
      question: "발표 준비 체크리스트에서 끝내 확인되지 않은 항목 수는? (숫자)",
      answer: "1",
    },
  },
  [R3]: {
    id: R3,
    name: "Git Room",
    description: "Commit History와 Branch Graph가 떠 있다. Unknown Author가 남긴 커밋은 해킹처럼 보이지만, 메시지의 말투가 이상하게 낯익다.",
    objects: ["Commit History", "Branch Graph", "Unknown Author"],
    puzzle: {
      id: "P3",
      question: "Unknown Author의 마지막 커밋 메시지에 반복되는 숫자는? (숫자)",
      answer: "314",
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
    name: "옥상",
    description: "옥상에는 아무도 없다. 노트북 하나가 켜져 있고, 마지막 Commit 메모 끝에는 '난간에 올라가지 마.'라는 문장만 남아 있다. 지금까지의 음성이 모두 낯익은 목소리였음을 깨닫는다.",
    objects: [],
    puzzle: null,
    isExit: true,
  },
  [R6]: {
    id: R6,
    name: "보안실",
    description: "CCTV Timeline과 출입 기록이 한 화면에 모여 있다. 모든 동선은 누군가의 습격이 아니라 플레이어 자신의 발걸음으로 이어진다.",
    objects: ["CCTV Timeline", "출입 기록", "동선 로그"],
    puzzle: {
      id: "P6",
      question: "옥상으로 향한 CCTV에 끝까지 반복해서 등장하는 사람 수는? (숫자)",
      answer: "1",
    },
  },
  [R7]: {
    id: R7,
    name: "서버실",
    description: "Recovery Log가 화면을 가득 채운다. 처음에는 데이터 복구처럼 보이지만 로그의 주어는 점점 기억 쪽으로 기울어진다.",
    objects: ["Recovery Log", "백업 서버", "복구 큐"],
    puzzle: {
      id: "P7",
      question: "Recovery Log에서 복구가 시작된 기준 시각은? (HHMM)",
      answer: "0314",
    },
  },
  [R8]: {
    id: R8,
    name: "강연실",
    description: "발표 리허설 영상이 반복 재생된다. 화면 속 플레이어는 발표 직전까지 있다가, 언제나 같은 순간 자리를 비운다.",
    objects: ["리허설 영상", "빈 발표대", "타임라인"],
    puzzle: {
      id: "P8",
      question: "리허설 영상에서 플레이어가 사라지는 발표 순서는? (숫자)",
      answer: "1",
    },
  },
  [R9]: {
    id: R9,
    name: "기록보관실",
    description: "지난 자료는 모두 남아 있는데 올해 발표 자료만 비어 있다. 삭제된 것이 아니라, 발표 자체가 끝까지 진행되지 못한 듯하다.",
    objects: ["빈 발표 자료", "보관함", "누락 기록"],
    puzzle: {
      id: "P9",
      question: "비어 있는 발표 자료는 올해 자료 몇 개뿐인가? (숫자)",
      answer: "1",
    },
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
  { id: "E1", from: R0, to: R1, gate: "P1", countsForExit: true },
  { id: "E2", from: R0, to: R2, gate: "P2", countsForExit: true },
  { id: "E3", from: R0, to: R3, gate: "P3", countsForExit: true },
  { id: "E4", from: R0, to: R6, gate: "P6", countsForExit: true },
  { id: "E5", from: R0, to: R5, gate: "P0", requiresAll: true },
  { id: "E6", from: R6, to: R7, gate: "P7", countsForExit: true },
  { id: "E7", from: R6, to: R8, gate: "P8", countsForExit: true },
  { id: "E8", from: R6, to: R9, gate: "P9", countsForExit: true },
];

const START_ROOM = R0;
const ADMIN_PASSWORD = "1234";
