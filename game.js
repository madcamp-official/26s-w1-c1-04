/**
 * game.js
 * 게임 상태와 순수 로직. (DOM/렌더링은 app.js 담당)
 *
 * 도어락 방식: 각 문에 코드(퍼즐 정답 또는 마스터코드 1234)를 입력해 연다.
 * FR-004 퍼즐 해결 여부 저장, FR-005 Edge Unlock,
 * FR-006 Unlocked Edge만 이동, FR-008 관리자 코드 처리를 담당한다.
 */

const Game = (() => {
  // ---- 초기 상태 ----
  const state = {
    currentRoom: START_ROOM,
    cleared: {}, // puzzle id -> cleared 여부
    unlocked: {}, // edge id -> unlocked 여부
  };

  // 모든 퍼즐/Edge를 초기값(false/Locked)으로 세팅
  function init() {
    state.currentRoom = START_ROOM;
    state.cleared = {};
    state.unlocked = {};
    Object.values(ROOMS).forEach((room) => {
      if (room.puzzle) state.cleared[room.puzzle.id] = false;
    });
    EDGES.forEach((e) => {
      state.unlocked[e.id] = false;
    });
  }

  function getCurrentRoom() {
    return ROOMS[state.currentRoom];
  }

  // 특정 방에서 나가는 Edge 목록 (무향 그래프)
  function getEdgesOf(roomId) {
    return EDGES.filter((e) => e.from === roomId || e.to === roomId);
  }

  // Edge 반대편 방 id
  function otherEnd(edge, roomId) {
    return edge.from === roomId ? edge.to : edge.from;
  }

  function getEdgeBetween(a, b) {
    return getEdgesOf(a).find((e) => otherEnd(e, a) === b);
  }

  function findPuzzleById(pid) {
    const room = Object.values(ROOMS).find(
      (r) => r.puzzle && r.puzzle.id === pid
    );
    return room ? room.puzzle : null;
  }

  // 최종 탈출문을 제외한 모든 문이 열렸는가?
  function allDoorsOpenedExceptFinal() {
    return EDGES.filter((e) => !e.requiresAll).every(
      (e) => state.unlocked[e.id]
    );
  }

  // 현재 방에서 보이는 문 목록 (도어락 정보 포함)
  function getNeighbors(roomId = state.currentRoom) {
    return getEdgesOf(roomId).map((edge) => {
      const targetId = otherEnd(edge, roomId);
      const puzzle = edge.gate ? findPuzzleById(edge.gate) : null;
      return {
        edgeId: edge.id,
        room: ROOMS[targetId],
        unlocked: !!state.unlocked[edge.id],
        requiresAll: !!edge.requiresAll,
        // requiresAll 문은 다른 문을 다 열어야 시도 가능
        openable: !edge.requiresAll || allDoorsOpenedExceptFinal(),
        question: puzzle ? puzzle.question : null,
      };
    });
  }

  // 현재 방 → 목표 방 문(도어락) 정보
  function getDoor(targetRoomId, fromRoomId = state.currentRoom) {
    const edge = getEdgeBetween(fromRoomId, targetRoomId);
    if (!edge) return null;
    return {
      edge,
      puzzle: edge.gate ? findPuzzleById(edge.gate) : null,
      unlocked: !!state.unlocked[edge.id],
      requiresAll: !!edge.requiresAll,
      targetRoom: ROOMS[targetRoomId],
    };
  }

  /**
   * 도어락에 코드를 입력해 문을 여는 시도.
   * 성공하면 Edge Unlock + 해당 퍼즐 clear + 목표 방으로 이동한다.
   * @returns {object} { ok, moved?, master?, reason?, wrong?, locked? }
   */
  function tryDoor(targetRoomId, rawCode) {
    const door = getDoor(targetRoomId);
    if (!door) return { ok: false, reason: "연결된 길이 없습니다." };

    // 이미 열린 문이면 코드 없이 이동
    if (door.unlocked) {
      state.currentRoom = targetRoomId;
      return { ok: true, moved: true };
    }

    // 최종 탈출문: 다른 문을 모두 연 뒤에만 열 수 있다
    if (door.requiresAll && !allDoorsOpenedExceptFinal()) {
      return { ok: false, locked: true, reason: "먼저 모든 방의 잠금을 해제하세요." };
    }

    const code = String(rawCode == null ? "" : rawCode).trim();
    const answer = door.puzzle ? String(door.puzzle.answer) : null;
    const isMaster = code === ADMIN_PASSWORD; // FR-008 마스터코드 1234
    const correct =
      isMaster || (answer && code.toLowerCase() === answer.toLowerCase());
    if (!correct) return { ok: false, wrong: true };

    // Unlock Event
    state.unlocked[door.edge.id] = true;
    if (door.puzzle) state.cleared[door.puzzle.id] = true;
    state.currentRoom = targetRoomId;
    return { ok: true, moved: true, master: isMaster, targetRoom: door.targetRoom };
  }

  return {
    state,
    init,
    getCurrentRoom,
    getNeighbors,
    getDoor,
    tryDoor,
    allDoorsOpenedExceptFinal,
  };
})();
