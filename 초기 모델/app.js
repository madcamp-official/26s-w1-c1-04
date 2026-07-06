/**
 * app.js
 * 해시 라우터 + 렌더링 + 도어락 UI. URL 형식: index.html#/room/R0
 *
 * - 잠긴 문을 누르면 도어락 키패드가 뜨고, 코드(퍼즐 정답 또는 1234)를 입력해 연다.
 * - hashchange 로 새로고침 없이 방 전환 (NFR)
 * - 잠긴 방으로의 직접 URL 접근은 라우터에서 차단
 */

const el = {
  roomName: document.getElementById("room-name"),
  objects: document.getElementById("objects"),
  doors: document.getElementById("doors"),
  toast: document.getElementById("toast"),
  // 도어락 모달
  overlay: document.getElementById("lock-overlay"),
  lockClose: document.getElementById("lock-close"),
  lockTarget: document.getElementById("lock-target"),
  lockRiddle: document.getElementById("lock-riddle"),
  lockDisplay: document.getElementById("lock-display"),
  lockKeypad: document.getElementById("lock-keypad"),
  // 계산기 문제 모달
  calcOverlay: document.getElementById("calc-overlay"),
  calcClose: document.getElementById("calc-close"),
  calcExpression: document.getElementById("calc-expression"),
  calcValue: document.getElementById("calc-value"),
  calcNumbers: document.getElementById("calc-numbers"),
  calcOps: document.getElementById("calc-ops"),
  calcUndo: document.getElementById("calc-undo"),
  calcReset: document.getElementById("calc-reset"),
  calcSubmit: document.getElementById("calc-submit"),
};

// ---- URL 유틸 ----
function roomIdFromHash() {
  const m = location.hash.match(/^#\/room\/(\w+)/);
  return m ? m[1] : null;
}
function go(roomId) {
  location.hash = `#/room/${roomId}`;
}

// ---- Map player movement ----
const PLAYER_RADIUS = 14;
const PLAYER_SPEED = 230;
const playerState = {
  x: 465,
  y: 318,
  near: null,
};
let activeMapId = START_ROOM;
let pendingSpawn = null;
let movementFrame = null;
let lastMovementTime = 0;
const pressedKeys = new Set();
const CALCULATOR_ROOM = "__disabled__";
const CALC_PUZZLE = {
  numbers: [1, 1, 5, 8],
  target: 10,
  hint: "8 / (1 - 1 / 5)",
};

const FIRST_FLOOR = {
  corridor: R0,
  topRoom: R2,
  rightRoom: R1,
  lowerRoom: R3,
  stairTarget: R6,
  topLabel: { number: "회의실", nameLines: [] },
  rightLabel: { number: "탕비실", nameLines: [] },
  lowerLabel: { number: "Git", nameLines: ["Room"] },
  corridorLabel: "열린 공간",
  stairLabel: "보안실",
  supportPrefix: "10",
  showExit: true,
};

const SECOND_FLOOR = {
  corridor: R6,
  topRoom: R8,
  rightRoom: R7,
  lowerRoom: R9,
  stairTarget: R0,
  topLabel: { number: "강연실", nameLines: [] },
  rightLabel: { number: "서버실", nameLines: [] },
  lowerLabel: { number: "기록", nameLines: ["보관실"] },
  corridorLabel: "보안실",
  stairLabel: "열린공간",
  supportPrefix: "20",
  showExit: false,
};

const DOOR_SPAWNS = {
  [R1]: { x: 740, y: 254 },
  [R2]: { x: 450, y: 174 },
  [R3]: { x: 409, y: 498 },
  [R6]: { x: 224, y: 285 },
  [R7]: { x: 740, y: 254 },
  [R8]: { x: 450, y: 174 },
  [R9]: { x: 409, y: 498 },
  [R0]: { x: 224, y: 285 },
};

const MAP_CONFIGS = {
  [R0]: {
    spawn: { x: 465, y: 318 },
    emptyHint: "방 입구나 Exit 앞으로 이동한 뒤 Enter 또는 Space로 상호작용",
    walkableRects: [
      { x: 224, y: 254, w: 562, h: 62 },
      { x: 394, y: 169, w: 112, h: 222 },
      { x: 224, y: 316, w: 317, h: 75 },
      { x: 409, y: 391, w: 47, h: 135 },
    ],
    zones: [
      { roomId: R2, label: "회의실", x: 450, y: 174, radius: 26 },
      { roomId: R1, label: "탕비실", x: 740, y: 254, radius: 34 },
      { roomId: R3, label: "Git Room", x: 409, y: 498, radius: 48 },
      { roomId: R6, label: "보안실", x: 224, y: 285, radius: 38 },
      { roomId: R5, label: "옥상", x: 786, y: 285, radius: 34 },
    ],
  },
  [R6]: {
    spawn: { x: 224, y: 285 },
    emptyHint: "방 입구나 계단 앞으로 이동한 뒤 Enter 또는 Space로 상호작용",
    walkableRects: [
      { x: 224, y: 254, w: 562, h: 62 },
      { x: 394, y: 169, w: 112, h: 222 },
      { x: 224, y: 316, w: 317, h: 75 },
      { x: 409, y: 391, w: 47, h: 135 },
    ],
    zones: [
      { roomId: R8, label: "강연실", x: 450, y: 174, radius: 26 },
      { roomId: R7, label: "서버실", x: 740, y: 254, radius: 34 },
      { roomId: R9, label: "기록보관실", x: 409, y: 498, radius: 48 },
      { roomId: R0, label: "열린 공간", x: 224, y: 285, radius: 38 },
    ],
  },
};

function getRoomMapConfig(roomId) {
  if (MAP_CONFIGS[roomId]) return MAP_CONFIGS[roomId];
  const corridorId = getCorridorForRoom(roomId);
  const config = {
    spawn: { x: 460, y: 470 },
    emptyHint: "문 앞으로 이동한 뒤 Enter 또는 Space로 복도로 나가기",
    walkableRects: [{ x: 194, y: 119, w: 532, h: 372 }],
    obstacleRects: [],
    zones: [{ roomId: corridorId, label: ROOMS[corridorId].name, x: 460, y: 510, radius: 58 }],
  };
  if (roomId === CALCULATOR_ROOM) {
    config.emptyHint = "문 또는 계산기 앞으로 이동한 뒤 Enter 또는 Space로 상호작용";
    config.obstacleRects = [{ x: 331, y: 224, w: 258, h: 124 }];
    config.zones.push({ type: "calculator", label: "계산기", x: 460, y: 214, radius: 58 });
  }
  return config;
}

function getCorridorForRoom(roomId) {
  if ([R7, R8, R9].includes(roomId)) return R6;
  return R0;
}

function isCorridorRoom(roomId) {
  return !!MAP_CONFIGS[roomId];
}

function clampToRect(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isPointInRect(x, y, rect) {
  return (
    x >= rect.x &&
    x <= rect.x + rect.w &&
    y >= rect.y &&
    y <= rect.y + rect.h
  );
}

function isWalkablePoint(x, y) {
  const config = getRoomMapConfig(activeMapId);
  const inFloor = config.walkableRects.some((rect) => isPointInRect(x, y, rect));
  const inObstacle = (config.obstacleRects || []).some((rect) => isPointInRect(x, y, rect));
  return inFloor && !inObstacle;
}

function nearestWalkablePoint(x, y) {
  const rects = getRoomMapConfig(activeMapId).walkableRects;
  let best = { x: playerState.x, y: playerState.y };
  let bestDistance = Infinity;
  rects.forEach((rect) => {
    const cx = clampToRect(x, rect.x, rect.x + rect.w);
    const cy = clampToRect(y, rect.y, rect.y + rect.h);
    const distance = Math.hypot(cx - x, cy - y);
    if (distance < bestDistance) {
      best = { x: cx, y: cy };
      bestDistance = distance;
    }
  });
  return best;
}

function findNearbyInteraction() {
  const zones = getRoomMapConfig(activeMapId).zones;
  return (
    zones.find((zone) => {
      const distance = Math.hypot(playerState.x - zone.x, playerState.y - zone.y);
      return distance <= zone.radius;
    }) || null
  );
}

function updatePlayerMarker() {
  const marker = document.getElementById("player-marker");
  if (!marker) return;

  marker.setAttribute("cx", playerState.x);
  marker.setAttribute("cy", playerState.y);
  playerState.near = findNearbyInteraction();

  document.querySelectorAll(".map-target.is-near").forEach((target) => {
    target.classList.remove("is-near");
  });

  const hint = document.getElementById("player-hint");
  if (playerState.near) {
    if (playerState.near.roomId) {
      const target = document.querySelector(
        `.map-target[data-room="${playerState.near.roomId}"]`
      );
      if (target) target.classList.add("is-near");
    } else if (playerState.near.type) {
      const target = document.querySelector(
        `.map-object[data-object="${playerState.near.type}"]`
      );
      if (target) target.classList.add("is-near");
    }
    if (hint) hint.textContent = `${playerState.near.label} 앞입니다. Enter 또는 Space로 상호작용`;
  } else if (hint) {
    hint.textContent = getRoomMapConfig(activeMapId).emptyHint;
  }
}

function movePlayer(dx, dy) {
  const targetX = playerState.x + dx;
  const targetY = playerState.y + dy;

  if (isWalkablePoint(targetX, targetY)) {
    playerState.x = targetX;
    playerState.y = targetY;
  } else if (isWalkablePoint(targetX, playerState.y)) {
    playerState.x = targetX;
  } else if (isWalkablePoint(playerState.x, targetY)) {
    playerState.y = targetY;
  } else {
    const next = nearestWalkablePoint(targetX, targetY);
    playerState.x = next.x;
    playerState.y = next.y;
  }

  updatePlayerMarker();
}

function setPlayerSpawn(roomId) {
  activeMapId = roomId;
  const spawn = pendingSpawn || getRoomMapConfig(roomId).spawn;
  playerState.x = spawn.x;
  playerState.y = spawn.y;
  playerState.near = null;
  pendingSpawn = null;
  pressedKeys.clear();
}

function getTransitionSpawn(fromRoomId, targetRoomId) {
  if (!isCorridorRoom(targetRoomId)) return null;
  return DOOR_SPAWNS[fromRoomId] || DOOR_SPAWNS[targetRoomId] || null;
}

function movementVector() {
  let dx = 0;
  let dy = 0;
  if (pressedKeys.has("ArrowLeft")) dx -= 1;
  if (pressedKeys.has("ArrowRight")) dx += 1;
  if (pressedKeys.has("ArrowUp")) dy -= 1;
  if (pressedKeys.has("ArrowDown")) dy += 1;
  if (dx && dy) {
    const normal = Math.SQRT1_2;
    dx *= normal;
    dy *= normal;
  }
  return { dx, dy };
}

function movementTick(timestamp) {
  if (!lastMovementTime) lastMovementTime = timestamp;
  const deltaSeconds = Math.min((timestamp - lastMovementTime) / 1000, 0.05);
  lastMovementTime = timestamp;

  if (el.overlay.hidden && el.calcOverlay.hidden && pressedKeys.size) {
    const vector = movementVector();
    if (vector.dx || vector.dy) {
      movePlayer(
        vector.dx * PLAYER_SPEED * deltaSeconds,
        vector.dy * PLAYER_SPEED * deltaSeconds
      );
    }
    movementFrame = requestAnimationFrame(movementTick);
    return;
  }

  movementFrame = null;
  lastMovementTime = 0;
}

function startMovementLoop() {
  if (!movementFrame) {
    lastMovementTime = 0;
    movementFrame = requestAnimationFrame(movementTick);
  }
}

function interactWithNearbyTarget() {
  playerState.near = findNearbyInteraction();
  if (!playerState.near) {
    toast("방 입구나 Exit 앞에서 상호작용할 수 있습니다.", "error");
    return;
  }
  if (playerState.near.type === "calculator") {
    openCalculatorPuzzle();
    return;
  }
  onMapRoomClick(playerState.near.roomId);
}

// ---- Toast 알림 (FR-007) ----
let toastTimer = null;
function toast(msg, kind = "info") {
  el.toast.textContent = msg;
  el.toast.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.toast.className = "toast";
  }, 2600);
}

// ---- 렌더링 ----
function render() {
  const room = Game.getCurrentRoom();
  el.roomName.textContent = room.name;

  // 탈출 성공 화면
  if (room.isExit) {
    renderEscape(room);
    return;
  }

  setPlayerSpawn(room.id);

  // 공간 시각화
  el.objects.innerHTML = renderRoomView(room);

  el.doors.innerHTML = "";

  el.objects.querySelectorAll(".map-target[data-room]").forEach((target) => {
    target.addEventListener("click", () => onMapRoomClick(target.dataset.room));
    target.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onMapRoomClick(target.dataset.room);
      }
    });
  });
  el.objects.querySelectorAll(".map-object[data-object]").forEach((target) => {
    target.addEventListener("click", () => {
      if (target.dataset.object === "calculator") openCalculatorPuzzle();
    });
    target.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (target.dataset.object === "calculator") openCalculatorPuzzle();
      }
    });
  });

  updatePlayerMarker();
}

function renderRoomView(room) {
  const map = isCorridorRoom(room.id) ? renderFloorMap(room.id) : renderInteriorMap(room);
  return `
    ${map}
    <p class="room-desc">${room.description}</p>
  `;
}

function renderFloorMap(activeRoomId) {
  const floor = activeRoomId === R6 ? SECOND_FLOOR : FIRST_FLOOR;
  const roomClass = (roomId) => (activeRoomId === roomId ? "is-active" : "");
  const roomState = (roomId) => {
    if (roomId === activeRoomId) return "현재 위치";
    if (roomId === floor.corridor) return "중앙 복도";
    const door = Game.getDoor(roomId, floor.corridor);
    return door && door.unlocked ? "입장 가능" : "잠김";
  };
  const renderNameLines = (label, x, startY) =>
    label.nameLines
      .map((line, index) => `<text class="room-name-label" x="${x}" y="${startY + index * 20}">${line}</text>`)
      .join("");

  return `
    <section class="floor-map" aria-label="복도 평면도">
      <svg class="floor-plan" viewBox="0 0 920 620" role="img" aria-labelledby="map-title map-desc">
        <title id="map-title">KRAFTON SoC E3-5 사건 현장 지도</title>
        <desc id="map-desc">직각 벽 구조로 정리한 2D top view 지도. 각 방은 사건을 재해석하는 증거를 보관한다.</desc>

        <g class="map-target" data-room="${floor.corridor}" role="button" tabindex="0" aria-label="${floor.corridorLabel}">
          <path
            class="corridor-shape ${roomClass(floor.corridor)}"
            d="M210 240 H380 V155 H520 V240 H800 V330 H555 V405 H470 V540 H285 V405 H210 Z"
          />
          <text class="corridor-label" x="465" y="318">${floor.corridorLabel}</text>
        </g>

        <g class="map-target" data-room="${floor.topRoom}" role="button" tabindex="0" aria-label="${floor.topLabel.number} 도어락 열기">
          <rect class="room-shape room-105 ${roomClass(floor.topRoom)}" x="380" y="65" width="140" height="90" />
          <text class="room-label" x="450" y="${floor.topLabel.nameLines.length ? 102 : 112}">${floor.topLabel.number}</text>
          ${renderNameLines(floor.topLabel, 450, 124)}
        </g>

        <g class="map-target" data-room="${floor.rightRoom}" role="button" tabindex="0" aria-label="${floor.rightLabel.number} 도어락 열기">
          <rect class="room-shape room-104 ${roomClass(floor.rightRoom)}" x="680" y="150" width="120" height="90" />
          <text class="room-label" x="740" y="${floor.rightLabel.nameLines.length ? 188 : 198}">${floor.rightLabel.number}</text>
          ${renderNameLines(floor.rightLabel, 740, 211)}
        </g>

        <g class="map-target" data-room="${floor.lowerRoom}" role="button" tabindex="0" aria-label="${floor.lowerLabel.number} 도어락 열기">
          <rect class="room-shape room-107 ${roomClass(floor.lowerRoom)}" x="285" y="455" width="110" height="85" />
          <text class="room-label" x="340" y="${floor.lowerLabel.nameLines.length ? 491 : 504}">${floor.lowerLabel.number}</text>
          ${renderNameLines(floor.lowerLabel, 340, 515)}
        </g>

        <g class="map-target" data-room="${floor.stairTarget}" role="button" tabindex="0" aria-label="${floor.stairLabel}">
          <rect class="stair-shape ${roomClass(floor.stairTarget)}" x="128" y="250" width="82" height="70" />
          <text class="exit-label" x="169" y="284">${floor.stairLabel}</text>
        </g>

        ${
          floor.showExit
            ? `<g class="map-target" data-room="${R5}" role="button" tabindex="0" aria-label="Exit 최종 탈출문 열기">
                <rect class="exit-shape ${roomClass(R5)}" x="800" y="250" width="82" height="70" />
                <text class="exit-label" x="841" y="284">옥상</text>
              </g>`
            : ""
        }

        <rect class="support-room" x="555" y="330" width="85" height="75" />
        <rect class="support-room" x="640" y="330" width="85" height="75" />
        <rect class="support-room" x="725" y="330" width="55" height="75" />

        <line class="wall-line" x1="380" y1="155" x2="520" y2="155" />
        <line class="wall-line" x1="680" y1="150" x2="680" y2="240" />
        <line class="wall-line" x1="555" y1="330" x2="780" y2="330" />
        <line class="wall-line" x1="640" y1="330" x2="640" y2="405" />
        <line class="wall-line" x1="725" y1="330" x2="725" y2="405" />
        <line class="wall-line" x1="780" y1="330" x2="780" y2="405" />
        <line class="wall-line" x1="285" y1="455" x2="395" y2="455" />

        <text class="support-label" x="598" y="368">${floor.supportPrefix}1</text>
        <text class="support-label" x="682" y="368">${floor.supportPrefix}2</text>
        <text class="support-label" x="752" y="368">${floor.supportPrefix}3</text>

        <circle id="player-marker" class="player-marker" cx="${playerState.x}" cy="${playerState.y}" r="${PLAYER_RADIUS}" />
      </svg>

      <p class="player-hint" id="player-hint">방 입구나 Exit 앞으로 이동한 뒤 Enter 또는 Space로 상호작용</p>

      <div class="map-legend" aria-label="방 상태">
        <div class="map-status"><span>${floor.corridorLabel}</span><strong>${roomState(floor.corridor)}</strong></div>
        <div class="map-status"><span>${floor.rightLabel.number}</span><strong>${roomState(floor.rightRoom)}</strong></div>
        <div class="map-status"><span>${floor.topLabel.number}</span><strong>${roomState(floor.topRoom)}</strong></div>
        <div class="map-status"><span>${floor.lowerLabel.number}</span><strong>${roomState(floor.lowerRoom)}</strong></div>
        <div class="map-status"><span>${floor.showExit ? "옥상" : "열린 공간"}</span><strong>${roomState(floor.showExit ? R5 : floor.stairTarget)}</strong></div>
      </div>
    </section>
  `;
}

function renderInteriorMap(room) {
  const titleY = room.id === CALCULATOR_ROOM ? 78 : 150;
  const titleClass = room.id === CALCULATOR_ROOM ? "interior-title outside-title" : "interior-title";
  return `
    <section class="floor-map" aria-label="${room.name} 평면도">
      <svg class="floor-plan" viewBox="0 0 920 620" role="img" aria-labelledby="room-map-title room-map-desc">
        <title id="room-map-title">${room.name} 2D top view</title>
        <desc id="room-map-desc">${room.name} 내부를 표시한 2D top view. 아래쪽 문을 통해 복도로 돌아갈 수 있다.</desc>

        <g class="room-interior">
          <rect class="interior-floor" x="180" y="105" width="560" height="400" />
          <rect class="interior-door-zone" x="395" y="480" width="130" height="25" />
          <text class="${titleClass}" x="460" y="${titleY}">${room.name}</text>
          <text class="interior-door-label" x="460" y="535">Corridor</text>

          ${renderInteriorObjects(room)}
        </g>

        <g class="map-target" data-room="${getCorridorForRoom(room.id)}" role="button" tabindex="0" aria-label="Corridor로 돌아가기">
          <rect class="interaction-pad" x="370" y="468" width="180" height="52" />
        </g>

        <circle id="player-marker" class="player-marker" cx="${playerState.x}" cy="${playerState.y}" r="${PLAYER_RADIUS}" />
      </svg>

      <p class="player-hint" id="player-hint">문 앞으로 이동한 뒤 Enter 또는 Space로 복도로 나가기</p>
    </section>
  `;
}

function renderInteriorObjects(room) {
  if (room.id === CALCULATOR_ROOM) {
    return `
      <g class="interior-table">
        <rect x="345" y="238" width="230" height="96" />
      </g>
      <g class="map-object" data-object="calculator" role="button" tabindex="0" aria-label="계산기 문제 열기">
        <rect class="calculator-body" x="422" y="191" width="76" height="54" />
        <rect class="calculator-screen" x="434" y="201" width="52" height="13" />
        <circle class="calculator-button" cx="440" cy="225" r="4" />
        <circle class="calculator-button" cx="456" cy="225" r="4" />
        <circle class="calculator-button" cx="472" cy="225" r="4" />
        <circle class="calculator-button" cx="440" cy="237" r="4" />
        <circle class="calculator-button" cx="456" cy="237" r="4" />
        <circle class="calculator-button" cx="472" cy="237" r="4" />
        <text class="calculator-label" x="460" y="174">Calculator</text>
      </g>
    `;
  }
  const labels = room.objects && room.objects.length ? room.objects : ["Puzzle Area"];
  const positions = [
    { x: 275, y: 255 },
    { x: 460, y: 245 },
    { x: 645, y: 255 },
  ];

  return labels
    .slice(0, 3)
    .map((label, index) => {
      const pos = positions[index];
      return `
        <g class="interior-object">
          <rect x="${pos.x - 55}" y="${pos.y - 34}" width="110" height="68" />
          <text x="${pos.x}" y="${pos.y}">${label}</text>
        </g>
      `;
    })
    .join("");
}

function onMapRoomClick(targetRoomId) {
  if (targetRoomId === Game.state.currentRoom) return;

  const door = Game.getDoor(targetRoomId);
  if (door) {
    onDoorClick(targetRoomId);
    return;
  }

  toast("복도로 나온 뒤 선택할 수 있습니다.", "error");
}

// ---- 탈출 성공 화면 ----
function renderEscape(room) {
  el.objects.innerHTML = `
    <div class="escape">
      <h2 class="escape-title">03:14</h2>
      <p class="escape-desc">${room.description}</p>
      <p class="escape-desc">누군가가 부른 흔적은 없다. 모든 경고와 모든 기록은 같은 방향으로 접힌다.</p>
      <button id="restart-btn" class="btn-submit">다시 도전하기</button>
    </div>
  `;
  el.doors.innerHTML = "";
  document.getElementById("restart-btn").addEventListener("click", () => {
    Game.init();
    go(START_ROOM);
  });
}

// ---- 문 클릭 ----
function onDoorClick(targetRoomId) {
  const door = Game.getDoor(targetRoomId);
  if (!door) return;
  const fromRoomId = Game.state.currentRoom;

  // 이미 열린 문 → 바로 이동
  if (door.unlocked) {
    pendingSpawn = getTransitionSpawn(fromRoomId, targetRoomId);
    go(targetRoomId);
    return;
  }
  // 최종 탈출문인데 아직 조건 미충족
  if (door.requiresAll && !Game.allDoorsOpenedExceptFinal()) {
    toast("아직 모든 증거가 하나로 연결되지 않았습니다.", "error");
    return;
  }
  // 도어락 모달 열기
  openLock(targetRoomId, door);
}

// ---- 도어락 모달 ----
let lockState = { target: null, code: "" };

function openLock(targetRoomId, door) {
  lockState = { target: targetRoomId, code: "" };
  const isExit = door.targetRoom.isExit;
  el.lockTarget.textContent = isExit
    ? "최종 탈출문"
    : `${door.targetRoom.name} 도어락`;
  el.lockRiddle.textContent = door.puzzle
    ? door.puzzle.question
    : "코드를 입력하세요.";
  updateLockDisplay();
  el.overlay.hidden = false;
}

function closeLock() {
  el.overlay.hidden = true;
  lockState = { target: null, code: "" };
}

function updateLockDisplay() {
  const dots = lockState.code
    ? lockState.code
        .split("")
        .map(() => "●")
        .join(" ")
    : "· · · ·";
  el.lockDisplay.textContent = dots;
}

function pressKey(key) {
  if (key === "clear") {
    lockState.code = lockState.code.slice(0, -1);
    updateLockDisplay();
    return;
  }
  if (key === "enter") {
    submitLock();
    return;
  }
  if (lockState.code.length >= 8) return; // 과입력 방지
  lockState.code += key;
  updateLockDisplay();
}

function submitLock() {
  const target = lockState.target;
  const fromRoomId = Game.state.currentRoom;
  const res = Game.tryDoor(target, lockState.code);

  if (res.ok) {
    closeLock();
    toast(
      res.master ? "마스터코드 · 기록을 건너뛰었습니다." : "새 사실을 확인했습니다.",
      "success"
    );
    pendingSpawn = getTransitionSpawn(fromRoomId, target);
    go(target); // 상태는 tryDoor 에서 이미 이동됨 → 해시만 동기화
    return;
  }
  // 실패: 흔들림 + 코드 초기화
  el.lockDisplay.classList.remove("shake");
  void el.lockDisplay.offsetWidth; // reflow 로 애니메이션 재시작
  el.lockDisplay.classList.add("shake");
  lockState.code = "";
  updateLockDisplay();
  toast(res.reason || "코드가 틀렸습니다.", "error");
}

// ---- 계산기 문제 ----
const CALC_OPS = ["+", "-", "*", "/", "(", ")"];
let calcState = { tiles: [], tokens: [] };

function openCalculatorPuzzle() {
  calcState = {
    tiles: CALC_PUZZLE.numbers.map((value) => ({ value, used: false })),
    tokens: [],
  };
  renderCalculatorPuzzle();
  el.calcOverlay.hidden = false;
}

function closeCalculatorPuzzle() {
  el.calcOverlay.hidden = true;
  calcState = { tiles: [], tokens: [] };
}

function renderCalculatorPuzzle() {
  el.calcNumbers.innerHTML = calcState.tiles
    .map(
      (tile, index) =>
        `<button type="button" data-index="${index}" ${tile.used ? "disabled" : ""}>${tile.value}</button>`
    )
    .join("");
  el.calcOps.innerHTML = CALC_OPS.map(
    (op) => `<button type="button" data-op="${op}">${op}</button>`
  ).join("");
  updateCalculatorDisplay();
}

function updateCalculatorDisplay() {
  const expression = calcState.tokens.map((token) => token.text).join(" ");
  el.calcExpression.textContent = expression || "식을 입력하세요";
  const value = evaluateCalculatorExpression();
  el.calcValue.textContent = `현재 값: ${value == null ? "—" : formatCalcValue(value)}`;
  el.calcValue.classList.toggle(
    "hit",
    value != null && Math.abs(value - CALC_PUZZLE.target) < 1e-9
  );
}

function pushCalcNumber(index) {
  const tile = calcState.tiles[index];
  if (!tile || tile.used) return;
  tile.used = true;
  calcState.tokens.push({ type: "number", text: String(tile.value), tileIndex: index });
  renderCalculatorPuzzle();
}

function pushCalcOp(op) {
  calcState.tokens.push({ type: "op", text: op });
  updateCalculatorDisplay();
}

function undoCalculatorToken() {
  const token = calcState.tokens.pop();
  if (token && token.type === "number") {
    calcState.tiles[token.tileIndex].used = false;
  }
  renderCalculatorPuzzle();
}

function resetCalculatorPuzzle() {
  calcState.tiles.forEach((tile) => {
    tile.used = false;
  });
  calcState.tokens = [];
  renderCalculatorPuzzle();
}

function evaluateCalculatorExpression() {
  if (!calcState.tokens.length) return null;
  const expression = calcState.tokens.map((token) => token.text).join("");
  if (!/^[0-9+\-*/().\s]+$/.test(expression)) return null;
  try {
    const value = Function(`"use strict"; return (${expression});`)();
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch (e) {
    return null;
  }
}

function formatCalcValue(value) {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 1e-9 ? String(rounded) : String(Math.round(value * 100) / 100);
}

function submitCalculatorPuzzle() {
  if (calcState.tiles.some((tile) => !tile.used)) {
    toast("1, 1, 5, 8을 모두 한 번씩 사용하세요.", "error");
    return;
  }
  const value = evaluateCalculatorExpression();
  if (value == null) {
    toast("식이 올바르지 않습니다.", "error");
    return;
  }
  if (Math.abs(value - CALC_PUZZLE.target) < 1e-9) {
    closeCalculatorPuzzle();
    toast("정답입니다. 계산기 문제가 해결되었습니다.", "success");
  } else {
    toast(`현재 값은 ${formatCalcValue(value)}입니다. 10을 만들어 보세요.`, "error");
  }
}

// 키패드 클릭
el.lockKeypad.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-key]");
  if (btn) pressKey(btn.dataset.key);
});

el.calcNumbers.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-index]");
  if (btn) pushCalcNumber(Number(btn.dataset.index));
});
el.calcOps.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-op]");
  if (btn) pushCalcOp(btn.dataset.op);
});
el.calcUndo.addEventListener("click", undoCalculatorToken);
el.calcReset.addEventListener("click", resetCalculatorPuzzle);
el.calcSubmit.addEventListener("click", submitCalculatorPuzzle);
el.calcClose.addEventListener("click", closeCalculatorPuzzle);
el.calcOverlay.addEventListener("click", (e) => {
  if (e.target === el.calcOverlay) closeCalculatorPuzzle();
});

// 물리 키보드 지원
document.addEventListener("keydown", (e) => {
  if (el.overlay.hidden) return;
  if (e.key >= "0" && e.key <= "9") pressKey(e.key);
  else if (e.key === "Backspace") pressKey("clear");
  else if (e.key === "Enter") pressKey("enter");
  else if (e.key === "Escape") closeLock();
});

document.addEventListener("keydown", (e) => {
  if (!el.calcOverlay.hidden) {
    let handled = true;
    if (e.key >= "0" && e.key <= "9") {
      const index = calcState.tiles.findIndex(
        (tile) => !tile.used && String(tile.value) === e.key
      );
      if (index !== -1) pushCalcNumber(index);
    } else if (["+", "-", "*", "/", "(", ")"].includes(e.key)) {
      pushCalcOp(e.key);
    } else if (e.key === "Backspace") {
      undoCalculatorToken();
    } else if (e.key === "Enter") {
      submitCalculatorPuzzle();
    } else if (e.key === "Escape") {
      closeCalculatorPuzzle();
    } else {
      handled = false;
    }
    if (handled) e.preventDefault();
    return;
  }

  if (!el.overlay.hidden) return;

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    pressedKeys.add(e.key);
    startMovementLoop();
    return;
  }

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    interactWithNearbyTarget();
  }
});

document.addEventListener("keyup", (e) => {
  if (pressedKeys.delete(e.key) && pressedKeys.size === 0) {
    lastMovementTime = 0;
  }
});

window.addEventListener("blur", () => {
  pressedKeys.clear();
});
el.lockClose.addEventListener("click", closeLock);
el.overlay.addEventListener("click", (e) => {
  if (e.target === el.overlay) closeLock();
});

// ---- 라우터 ----
function handleRoute() {
  const target = roomIdFromHash();
  if (!target || !ROOMS[target]) {
    go(START_ROOM);
    return;
  }
  const current = Game.state.currentRoom;
  if (target === current) {
    render();
    return;
  }
  // 인접 + 이미 열린 문이면 이동 허용 (뒤로/앞으로 가기 등)
  const door = Game.getDoor(target);
  if (door && door.unlocked) {
    pendingSpawn = getTransitionSpawn(current, target);
    Game.tryDoor(target); // 열린 문 → 이동
    render();
    return;
  }
  // 그 외(잠긴 방 직접 접근)는 차단
  toast("잠긴 문입니다. 도어락을 먼저 여세요.", "error");
  go(current);
}

// ---- 시작 ----
Game.init();
window.addEventListener("hashchange", handleRoute);
if (!roomIdFromHash()) {
  go(START_ROOM);
} else {
  handleRoute();
}
