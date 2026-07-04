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
};

// ---- URL 유틸 ----
function roomIdFromHash() {
  const m = location.hash.match(/^#\/room\/(\w+)/);
  return m ? m[1] : null;
}
function go(roomId) {
  location.hash = `#/room/${roomId}`;
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

  // 오브젝트 (FR-003)
  el.objects.innerHTML = `
    <p class="room-desc">${room.description}</p>
    <div class="object-grid">
      ${room.objects.map((o) => `<div class="object-card">${o}</div>`).join("")}
    </div>
  `;

  // 문(도어락) — 이웃 방 (FR-002 / FR-006)
  const neighbors = Game.getNeighbors();
  el.doors.innerHTML =
    `<h2 class="doors-title">🚪 문</h2>` +
    neighbors
      .map((n) => {
        const locked = !n.unlocked;
        const isExit = n.room.isExit;
        const icon = !locked ? (isExit ? "🏃" : "➡️") : isExit ? "🏁" : "🔒";
        const label = isExit ? "🚪 탈출구 (밖으로 나가기)" : n.room.name;
        const sub = !locked
          ? "열림 · 이동"
          : isExit
          ? "최종 탈출문"
          : "도어락 · 코드 입력";
        return `
          <button
            class="door ${locked ? "locked" : "unlocked"} ${isExit ? "exit" : ""}"
            data-room="${n.room.id}"
          >
            <span class="door-icon">${icon}</span>
            <span class="door-text">
              <span class="door-name">${label}</span>
              <span class="door-sub">${sub}</span>
            </span>
          </button>`;
      })
      .join("");

  el.doors.querySelectorAll(".door").forEach((btn) => {
    btn.addEventListener("click", () => onDoorClick(btn.dataset.room));
  });
}

// ---- 탈출 성공 화면 ----
function renderEscape(room) {
  el.objects.innerHTML = `
    <div class="escape">
      <div class="escape-emoji">🎉🏃🌙</div>
      <h2 class="escape-title">ESCAPE SUCCESS!</h2>
      <p class="escape-desc">${room.description}</p>
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

  // 이미 열린 문 → 바로 이동
  if (door.unlocked) {
    go(targetRoomId);
    return;
  }
  // 최종 탈출문인데 아직 조건 미충족
  if (door.requiresAll && !Game.allDoorsOpenedExceptFinal()) {
    toast("🔒 먼저 모든 방의 잠금을 해제하세요.", "error");
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
    ? "🚪 최종 탈출문"
    : `${door.targetRoom.name} 도어락`;
  el.lockRiddle.textContent = door.puzzle
    ? `❓ ${door.puzzle.question}`
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
  const res = Game.tryDoor(target, lockState.code);

  if (res.ok) {
    closeLock();
    toast(
      res.master ? "🔑 마스터코드 · 문이 열렸습니다!" : "✅ 잠금 해제!",
      "success"
    );
    go(target); // 상태는 tryDoor 에서 이미 이동됨 → 해시만 동기화
    return;
  }
  // 실패: 흔들림 + 코드 초기화
  el.lockDisplay.classList.remove("shake");
  void el.lockDisplay.offsetWidth; // reflow 로 애니메이션 재시작
  el.lockDisplay.classList.add("shake");
  lockState.code = "";
  updateLockDisplay();
  toast(res.reason || "❌ 코드가 틀렸습니다.", "error");
}

// 키패드 클릭
el.lockKeypad.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-key]");
  if (btn) pressKey(btn.dataset.key);
});
// 물리 키보드 지원
document.addEventListener("keydown", (e) => {
  if (el.overlay.hidden) return;
  if (e.key >= "0" && e.key <= "9") pressKey(e.key);
  else if (e.key === "Backspace") pressKey("clear");
  else if (e.key === "Enter") pressKey("enter");
  else if (e.key === "Escape") closeLock();
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
    Game.tryDoor(target); // 열린 문 → 이동
    render();
    return;
  }
  // 그 외(잠긴 방 직접 접근)는 차단
  toast("🔒 잠긴 문입니다. 도어락을 먼저 여세요.", "error");
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
