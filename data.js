/**
 * data.js
 * 5층 건물 맵 데이터 (Graph 구조).
 *
 * 구조
 *  - 각 층에는 복도(corridor)가 있고, 복도에서 방(room)으로 통하는 문이 있다.
 *  - 방문(door)에는 도어락이 있고, 그 방 퍼즐의 정답(코드) 또는 마스터코드(1234)로 연다.
 *  - 계단(stair)은 위/아래 층 복도를 잇는다. 그 층의 방을 모두 풀면 자동으로 열린다.
 *  - 5층 복도에서 옥상(rooftop, exit)으로 나가면 탈출 성공.
 *
 * 확장(NFR): 방/퍼즐/계단을 ROOMS·EDGES 배열에 추가만 하면 된다.
 */

const ROOMS = {
  // ===== 1층: 로비 =====
  C1: {
    id: "C1", floor: 1, name: "1F 로비", isCorridor: true,
    description: "출입문은 굳게 잠겼다. 리셉션과 보안실로 통하는 문, 그리고 위층 계단이 보인다.",
    objects: ["🚪 정문(잠김)", "🪧 안내판", "🪜 계단"],
  },
  reception: {
    id: "reception", floor: 1, name: "리셉션",
    description: "방명록이 펼쳐진 안내 데스크. 오늘과 어제의 방문객 수가 적혀 있다.",
    objects: ["📖 방명록", "☎️ 전화기", "🔔 벨"],
    puzzle: { id: "P_rec", question: "방명록: 오늘 방문객 7명, 어제 5명. 이틀 합계는? (숫자)", answer: "12" },
  },
  security: {
    id: "security", floor: 1, name: "보안실",
    description: "모니터가 가득한 보안실. 금고 옆에 소수(prime)에 대한 힌트가 적혀 있다.",
    objects: ["🖥️ CCTV", "🔐 금고", "🗝️ 열쇠고리"],
    puzzle: { id: "P_sec", question: "10보다 작은 소수 중 가장 작은 세 개(2,3,5)의 합은? (숫자)", answer: "10" },
  },

  // ===== 2층: 식당 =====
  C2: {
    id: "C2", floor: 2, name: "2F 홀", isCorridor: true,
    description: "음식 냄새가 남아 있는 2층 홀. 주방과 창고로 가는 문이 있다.",
    objects: ["🪑 테이블", "🖼️ 그림", "🪜 계단"],
  },
  kitchen: {
    id: "kitchen", floor: 2, name: "주방",
    description: "달걀 판이 쌓인 주방. 요리사가 급히 나간 흔적이 있다.",
    objects: ["🥚 달걀 2판", "🔪 칼", "🍳 프라이팬"],
    puzzle: { id: "P_kit", question: "달걀 2판(한 판 30알) 중 15알을 썼다. 남은 알은? (숫자)", answer: "45" },
  },
  storage: {
    id: "storage", floor: 2, name: "창고",
    description: "상자가 반듯하게 쌓인 창고. 한 줄에 5개씩, 여러 줄이다.",
    objects: ["📦 상자더미", "🧹 빗자루", "🪣 양동이"],
    puzzle: { id: "P_sto", question: "상자가 한 줄에 5개씩 4줄로 쌓여 있다. 모두 몇 개? (숫자)", answer: "20" },
  },

  // ===== 3층: 연구소 =====
  C3: {
    id: "C3", floor: 3, name: "3F 홀", isCorridor: true,
    description: "형광등이 깜빡이는 연구소 층. 실험실과 서버실로 통한다.",
    objects: ["🧯 소화기", "📃 공지", "🪜 계단"],
  },
  lab: {
    id: "lab", floor: 3, name: "실험실",
    description: "시험관마다 숫자 라벨이 붙어 있다: 3, 6, 11, 18, ?",
    objects: ["🧪 시험관", "🔬 현미경", "📋 실험노트"],
    puzzle: { id: "P_lab", question: "라벨 수열 3, 6, 11, 18, ? 다음에 올 수는? (숫자)", answer: "27" },
  },
  server: {
    id: "server", floor: 3, name: "서버실",
    description: "서버 랙의 콘솔에 「1 1 5 8 → 10?」 이 떠 있다. 숫자 잠금이 걸려 있다.",
    objects: ["🖥️ 서버랙", "🔢 콘솔", "❄️ 냉방기"],
    puzzle: {
      id: "P_srv", type: "make10",
      question: "1, 1, 5, 8 을 각각 한 번씩 써서 10을 만드세요.",
      numbers: [1, 1, 5, 8], target: 10, hint: "8 ÷ (1 − 1 ÷ 5)",
    },
  },

  // ===== 4층: 사무 =====
  C4: {
    id: "C4", floor: 4, name: "4F 홀", isCorridor: true,
    description: "서류 냄새가 나는 사무 층. 사무실과 회의실이 있다.",
    objects: ["🗄️ 파일함", "🪴 화분", "🪜 계단"],
  },
  office: {
    id: "office", floor: 4, name: "사무실",
    description: "캐비닛이 늘어선 사무실. 각 캐비닛에는 서랍이 여러 칸이다.",
    objects: ["🗃️ 캐비닛 4개", "🖥️ 모니터", "📎 클립"],
    puzzle: { id: "P_off", question: "캐비닛 4개, 각 캐비닛에 서랍 3칸. 서랍은 모두 몇 칸? (숫자)", answer: "12" },
  },
  meeting: {
    id: "meeting", floor: 4, name: "회의실",
    description: "화이트보드에 「3 4 6 8 → 10?」 이 적혀 있는 회의실.",
    objects: ["📋 화이트보드", "🪑 회의탁자", "📽️ 프로젝터"],
    puzzle: {
      id: "P_mtg", type: "make10",
      question: "3, 4, 6, 8 을 각각 한 번씩 써서 10을 만드세요.",
      numbers: [3, 4, 6, 8], target: 10, hint: "3 × 4 − 8 + 6",
    },
  },

  // ===== 5층: 관제 & 옥상 =====
  C5: {
    id: "C5", floor: 5, name: "5F 홀", isCorridor: true,
    description: "옥상으로 통하는 마지막 층. 관제실 문과 옥상 비상문이 보인다.",
    objects: ["🚨 경광등", "📟 단말기", "🚪 옥상 비상문"],
  },
  control: {
    id: "control", floor: 5, name: "관제실",
    description: "비상 콘솔이 있는 관제실. 옥상문을 여는 코드가 이진수로 표시돼 있다.",
    objects: ["📟 비상콘솔", "🕹️ 조작반", "🔴 비상버튼"],
    puzzle: { id: "P_ctl", question: "비상 코드: 이진수 1101 을 십진수로 바꾸면? (숫자)", answer: "13" },
  },
  rooftop: {
    id: "rooftop", floor: 5, name: "옥상", isExit: true,
    description: "차가운 밤공기가 밀려온다. 당신은 마침내 건물 옥상으로 탈출했다!",
    objects: [],
  },
};

/**
 * Edge 정의.
 *   kind: "door"  = 복도↔방. gate(퍼즐)의 정답 코드/1234로 연다.
 *         "stair" = 복도↔복도. requires 퍼즐이 모두 clear 되면 자동으로 열린다.
 *         "exit"  = 복도↔옥상. requires clear 시 열린다(최종 탈출문).
 */
const EDGES = [
  // 1층
  { id: "D_rec", kind: "door", from: "C1", to: "reception", gate: "P_rec" },
  { id: "D_sec", kind: "door", from: "C1", to: "security", gate: "P_sec" },
  { id: "S1", kind: "stair", from: "C1", to: "C2", requires: ["P_rec", "P_sec"] },
  // 2층
  { id: "D_kit", kind: "door", from: "C2", to: "kitchen", gate: "P_kit" },
  { id: "D_sto", kind: "door", from: "C2", to: "storage", gate: "P_sto" },
  { id: "S2", kind: "stair", from: "C2", to: "C3", requires: ["P_kit", "P_sto"] },
  // 3층
  { id: "D_lab", kind: "door", from: "C3", to: "lab", gate: "P_lab" },
  { id: "D_srv", kind: "door", from: "C3", to: "server", gate: "P_srv" },
  { id: "S3", kind: "stair", from: "C3", to: "C4", requires: ["P_lab", "P_srv"] },
  // 4층
  { id: "D_off", kind: "door", from: "C4", to: "office", gate: "P_off" },
  { id: "D_mtg", kind: "door", from: "C4", to: "meeting", gate: "P_mtg" },
  { id: "S4", kind: "stair", from: "C4", to: "C5", requires: ["P_off", "P_mtg"] },
  // 5층
  { id: "D_ctl", kind: "door", from: "C5", to: "control", gate: "P_ctl" },
  { id: "X_roof", kind: "exit", from: "C5", to: "rooftop", requires: ["P_ctl"] },
];

const START_ROOM = "C1";
const ADMIN_PASSWORD = "1234";
