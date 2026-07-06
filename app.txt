
  app.js
  해시 라우터 + 렌더링 + 도어락 UI. URL 형식 index.html#roomR0
 
  - 잠긴 문을 누르면 도어락 키패드가 뜨고, 코드(퍼즐 정답 또는 1234)를 입력해 연다.
  - hashchange 로 새로고침 없이 방 전환 (NFR)
  - 잠긴 방으로의 직접 URL 접근은 라우터에서 차단
 

const el = {
  roomName document.getElementById(room-name),
  objects document.getElementById(objects),
  doors document.getElementById(doors),
  toast document.getElementById(toast),
   도어락 모달
  overlay document.getElementById(lock-overlay),
  lockClose document.getElementById(lock-close),
  lockTarget document.getElementById(lock-target),
  lockRiddle document.getElementById(lock-riddle),
  lockDisplay document.getElementById(lock-display),
  lockKeypad document.getElementById(lock-keypad),
   Make 10 모달
  m10Overlay document.getElementById(make10-overlay),
  m10Close document.getElementById(make10-close),
  m10Expr document.getElementById(make10-expr),
  m10Val document.getElementById(make10-val),
  m10Tiles document.getElementById(make10-tiles),
  m10Ops document.getElementById(make10-ops),
  m10Undo document.getElementById(make10-undo),
  m10Reset document.getElementById(make10-reset),
  m10Hint document.getElementById(make10-hint),
  m10Check document.getElementById(make10-check),
};

 ---- URL 유틸 ----
function roomIdFromHash() {
  const m = location.hash.match(^#room(w+));
  return m  m[1]  null;
}
function go(roomId) {
  location.hash = `#room${roomId}`;
}

 ---- Toast 알림 (FR-007) ----
let toastTimer = null;
function toast(msg, kind = info) {
  el.toast.textContent = msg;
  el.toast.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() = {
    el.toast.className = toast;
  }, 2600);
}

 ---- 렌더링 ----
function render() {
  const room = Game.getCurrentRoom();
  el.roomName.textContent =
    room.isCorridor  room.isExit  room.name  `${room.floor}F ${room.name}`;

   탈출 성공 화면
  if (room.isExit) {
    renderEscape(room);
    return;
  }

   오브젝트 (FR-003)
  el.objects.innerHTML = `
    p class=room-desc${room.description}p
    div class=object-grid
      ${room.objects.map((o) = `div class=object-card${o}div`).join()}
    div
  `;

   문계단 — 이웃 (FR-002  FR-006)
  const neighbors = Game.getNeighbors();
  el.doors.innerHTML =
    `h2 class=doors-title🚪 문 · 🪜 계단h2` +
    neighbors.map(doorButtonHTML).join();

  el.doors.querySelectorAll(.door).forEach((btn) = {
    btn.addEventListener(click, () = onDoorClick(btn.dataset.room));
  });
}

 문계단 버튼 1개의 HTML
function doorButtonHTML(n) {
  const locked = !n.unlocked;
  const isExit = n.kind === exit;
  const isStair = n.kind === stair;
  const isMake10 = n.puzzleType === make10;
  const up = n.direction  0;

  let icon, label, sub, extraClass;
  if (isExit) {
    extraClass = exit;
    icon = locked  🏁  🏃;
    label = 🚪 옥상으로 탈출;
    sub = locked  관제실 코드를 입력하면 열림  탈출!;
  } else if (isStair) {
    extraClass = stair;
    icon = locked  🔒  up  ⬆️  ⬇️;
    label = `${n.room.name} (${up  올라가기  내려가기})`;
    sub = locked  이 층의 방을 모두 풀면 열림  계단 · 이동;
  } else {
    extraClass = ;
    icon = locked  (isMake10  🧩  🔒)  ➡️;
    label = n.room.name;
    sub = !locked
       열림 · 이동
       isMake10
       🧩 10 만들기 퍼즐
       🔢 도어락 · 코드 입력;
  }
  return `
    button class=door ${locked  locked  unlocked} ${extraClass}
            data-room=${n.room.id}
      span class=door-icon${icon}span
      span class=door-text
        span class=door-name${label}span
        span class=door-sub${sub}span
      span
    button`;
}

 ---- 탈출 성공 화면 ----
function renderEscape(room) {
  el.objects.innerHTML = `
    div class=escape
      div class=escape-emoji🎉🏃🌙div
      h2 class=escape-titleESCAPE SUCCESS!h2
      p class=escape-desc${room.description}p
      button id=restart-btn class=btn-submit다시 도전하기button
    div
  `;
  el.doors.innerHTML = ;
  document.getElementById(restart-btn).addEventListener(click, () = {
    Game.init();
    go(START_ROOM);
  });
}

 ---- 문 클릭 ----
function onDoorClick(targetRoomId) {
  const door = Game.getDoor(targetRoomId);
  if (!door) return;

   이미 열린 문계단 → 바로 이동
  if (door.unlocked) {
    go(targetRoomId);
    return;
  }
   계단·탈출문 요구 퍼즐이 남아 있음
  if (door.kind === stair  door.kind === exit) {
    const missing = Game.missingRooms(door.requires);
    toast(`🔒 먼저 해결하세요 ${missing.join(, )}`, error);
    return;
  }
   특수 퍼즐(10 만들기) 전용 모달
  if (door.puzzle && door.puzzle.type === make10) {
    openMake10(targetRoomId, door);
    return;
  }
   일반 도어락 모달
  openLock(targetRoomId, door);
}

 ---- 도어락 모달 ----
let lockState = { target null, code  };

function openLock(targetRoomId, door) {
  lockState = { target targetRoomId, code  };
  const isExit = door.targetRoom.isExit;
  el.lockTarget.textContent = isExit
     🚪 최종 탈출문
     `${door.targetRoom.name} 도어락`;
  el.lockRiddle.textContent = door.puzzle
     `❓ ${door.puzzle.question}`
     코드를 입력하세요.;
  updateLockDisplay();
  el.overlay.hidden = false;
}

function closeLock() {
  el.overlay.hidden = true;
  lockState = { target null, code  };
}

function updateLockDisplay() {
  const dots = lockState.code
     lockState.code
        .split()
        .map(() = ●)
        .join( )
     · · · ·;
  el.lockDisplay.textContent = dots;
}

function pressKey(key) {
  if (key === clear) {
    lockState.code = lockState.code.slice(0, -1);
    updateLockDisplay();
    return;
  }
  if (key === enter) {
    submitLock();
    return;
  }
  if (lockState.code.length = 8) return;  과입력 방지
  lockState.code += key;
  updateLockDisplay();
}

function submitLock() {
  const target = lockState.target;
  const res = Game.tryDoor(target, lockState.code);

  if (res.ok) {
    closeLock();
    toast(
      res.master  🔑 마스터코드 · 문이 열렸습니다!  ✅ 잠금 해제!,
      success
    );
    go(target);  상태는 tryDoor 에서 이미 이동됨 → 해시만 동기화
    return;
  }
   실패 흔들림 + 코드 초기화
  el.lockDisplay.classList.remove(shake);
  void el.lockDisplay.offsetWidth;  reflow 로 애니메이션 재시작
  el.lockDisplay.classList.add(shake);
  lockState.code = ;
  updateLockDisplay();
  toast(res.reason  ❌ 코드가 틀렸습니다., error);
}

 키패드 클릭
el.lockKeypad.addEventListener(click, (e) = {
  const btn = e.target.closest(button[data-key]);
  if (btn) pressKey(btn.dataset.key);
});
 물리 키보드 지원
document.addEventListener(keydown, (e) = {
  if (el.overlay.hidden) return;
  if (e.key = 0 && e.key = 9) pressKey(e.key);
  else if (e.key === Backspace) pressKey(clear);
  else if (e.key === Enter) pressKey(enter);
  else if (e.key === Escape) closeLock();
});
el.lockClose.addEventListener(click, closeLock);
el.overlay.addEventListener(click, (e) = {
  if (e.target === el.overlay) closeLock();
});

 ============================================================
  Make 10 퍼즐 (사칙연산 + 괄호로 10 만들기)
 ============================================================
const M10_OPS = [
  { t +, k op },
  { t −, k op },
  { t ×, k op },
  { t ÷, k op },
  { t (, k lp },
  { t ), k rp },
];

let m10 = { target null, puzzle null, tiles [], tokens [] };

function openMake10(targetRoomId, door) {
  const p = door.puzzle;
  m10 = {
    target targetRoomId,
    puzzle p,
    tiles p.numbers.map((v) = ({ value v, used false })),
    tokens [],
  };
  renderM10Tiles();
  renderM10Ops();
  updateM10();
  el.m10Overlay.hidden = false;
}

function closeMake10() {
  el.m10Overlay.hidden = true;
  m10 = { target null, puzzle null, tiles [], tokens [] };
}

function renderM10Tiles() {
  el.m10Tiles.innerHTML = m10.tiles
    .map(
      (t, i) =
        `button class=m10-tile data-idx=${i} ${t.used  disabled  }${t.value}button`
    )
    .join();
}

function renderM10Ops() {
  el.m10Ops.innerHTML = M10_OPS.map(
    (o) = `button class=m10-op data-op=${o.t} data-kind=${o.k}${o.t}button`
  ).join();
}

 토큰 배치 가능 여부 (식이 항상 올바른 형태가 되도록)
function m10LastKind() {
  const last = m10.tokens[m10.tokens.length - 1];
  return last  last.kind  null;
}
function m10OpenParens() {
  return m10.tokens.reduce(
    (n, t) = n + (t.kind === lp  1  t.kind === rp  -1  0),
    0
  );
}
function m10CanPlace(kind) {
  const last = m10LastKind();
  if (kind === num  kind === lp)
    return last === null  last === op  last === lp;
  if (kind === op) return last === num  last === rp;
  if (kind === rp)
    return (last === num  last === rp) && m10OpenParens()  0;
  return false;
}

function m10Push(kind, text, tileIdx) {
  if (!m10CanPlace(kind)) {
    flashM10();
    return;
  }
  const tok = { kind, text };
  if (kind === num) {
    tok.tileIdx = tileIdx;
    m10.tiles[tileIdx].used = true;
  }
  m10.tokens.push(tok);
  renderM10Tiles();
  updateM10();
}

function m10Undo() {
  const tok = m10.tokens.pop();
  if (!tok) return;
  if (tok.kind === num && tok.tileIdx != null)
    m10.tiles[tok.tileIdx].used = false;
  renderM10Tiles();
  updateM10();
}

function m10Reset() {
  m10.tokens = [];
  m10.tiles.forEach((t) = (t.used = false));
  renderM10Tiles();
  updateM10();
}

 토큰 → 계산값 (불완전오류면 null)
function m10Evaluate() {
  if (m10.tokens.length === 0) return null;
  if (m10LastKind() === op  m10LastKind() === lp) return null;  끝이 연산자여는괄호
  if (m10OpenParens() !== 0) return null;  괄호 불균형
  const js = m10.tokens
    .map((t) = {
      if (t.kind === num) return t.text;
      if (t.text === ×) return ;
      if (t.text === ÷) return ;
      if (t.text === −) return -;
      return t.text;  + ( )
    })
    .join();
  if (!^[0-9+-().]+$.test(js)) return null;
  try {
    const v = Function('use strict; return (' + js + );)();
    return typeof v === number && isFinite(v)  v  null;
  } catch (e) {
    return null;
  }
}

function m10Fmt(v) {
  const r = Math.round(v);
  if (Math.abs(v - r)  1e-9) return String(r);
  return String(Math.round(v  100)  100);
}

function updateM10() {
  el.m10Expr.innerHTML = m10.tokens.length
     m10.tokens.map((t) = `span class=m10-tok${t.text}span`).join()
     `span class=m10-ph숫자 타일과 연산자를 눌러 식을 만드세요span`;
  const v = m10Evaluate();
  el.m10Val.textContent = v == null    m10Fmt(v);
  const goal = m10.puzzle  m10.puzzle.target  10;
  el.m10Val.className = v != null && Math.abs(v - goal)  1e-9  hit  ;
}

function flashM10() {
  el.m10Expr.classList.remove(shake);
  void el.m10Expr.offsetWidth;
  el.m10Expr.classList.add(shake);
}

function m10SubmitCheck() {
  if (m10.tiles.some((t) = !t.used)) {
    toast(네 숫자를 모두 한 번씩 사용하세요., error);
    flashM10();
    return;
  }
  const v = m10Evaluate();
  const goal = m10.puzzle.target;
  if (v == null) {
    toast(식이 올바르지 않습니다., error);
    flashM10();
    return;
  }
  if (Math.abs(v - goal)  1e-9) {
    const target = m10.target;
    Game.forceOpen(target);
    closeMake10();
    toast(🎉 정답! 10을 만들었습니다. 문이 열립니다., success);
    go(target);
  } else {
    toast(`현재 값은 ${m10Fmt(v)} 입니다. ${goal}을 만들어 보세요.`, error);
    flashM10();
  }
}

 이벤트 바인딩
el.m10Tiles.addEventListener(click, (e) = {
  const btn = e.target.closest(button[data-idx]);
  if (!btn  btn.disabled) return;
  const i = Number(btn.dataset.idx);
  m10Push(num, String(m10.tiles[i].value), i);
});
el.m10Ops.addEventListener(click, (e) = {
  const btn = e.target.closest(button[data-op]);
  if (!btn) return;
  m10Push(btn.dataset.kind, btn.dataset.op);
});
el.m10Undo.addEventListener(click, m10Undo);
el.m10Reset.addEventListener(click, m10Reset);
el.m10Check.addEventListener(click, m10SubmitCheck);
el.m10Hint.addEventListener(click, () = {
  if (m10.puzzle && m10.puzzle.hint)
    toast(`💡 예시 정답 ${m10.puzzle.hint} = ${m10.puzzle.target}`, info);
});
el.m10Close.addEventListener(click, closeMake10);
el.m10Overlay.addEventListener(click, (e) = {
  if (e.target === el.m10Overlay) closeMake10();
});

 물리 키보드 지원 (Make 10)
document.addEventListener(keydown, (e) = {
  if (el.m10Overlay.hidden) return;
  const k = e.key;
  let handled = true;
  if (k = 0 && k = 9) {
    const idx = m10.tiles.findIndex((t) = !t.used && String(t.value) === k);
    if (idx !== -1) m10Push(num, k, idx);
  } else if (k === +) m10Push(op, +);
  else if (k === -) m10Push(op, −);
  else if (k === ) m10Push(op, ×);
  else if (k === ) m10Push(op, ÷);
  else if (k === () m10Push(lp, ();
  else if (k === )) m10Push(rp, ));
  else if (k === Backspace) m10Undo();
  else if (k === Enter) m10SubmitCheck();
  else if (k === Escape) closeMake10();
  else handled = false;
  if (handled) e.preventDefault();
});

 ---- 라우터 ----
function handleRoute() {
  const target = roomIdFromHash();
  if (!target  !ROOMS[target]) {
    go(START_ROOM);
    return;
  }
  const current = Game.state.currentRoom;
  if (target === current) {
    render();
    return;
  }
   인접 + 이미 열린 문이면 이동 허용 (뒤로앞으로 가기 등)
  const door = Game.getDoor(target);
  if (door && door.unlocked) {
    Game.tryDoor(target);  열린 문 → 이동
    render();
    return;
  }
   그 외(잠긴 방 직접 접근)는 차단
  toast(🔒 잠긴 문입니다. 도어락을 먼저 여세요., error);
  go(current);
}

 ---- 시작 ----
Game.init();
window.addEventListener(hashchange, handleRoute);
if (!roomIdFromHash()) {
  go(START_ROOM);
} else {
  handleRoute();
}
