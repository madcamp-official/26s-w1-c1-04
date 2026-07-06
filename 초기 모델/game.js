/**
 * game.js
 * 게임 상태와 순수 로직. (DOM/렌더링은 app.js 담당)
 *
 * 문(door): 도어락 코드/1234로 연다.  계단(stair)·탈출문(exit): 요구 퍼즐이 모두 풀리면 자동으로 열린다.
 * FR-004 퍼즐 해결 저장, FR-005 Unlock, FR-006 열린 Edge만 이동, FR-008 마스터코드.
 */

const Game = (() => {
  const state = {
    currentRoom: START_ROOM,
    cleared: {}, // puzzle id -> 해결 여부
    unlocked: {}, // door edge id -> 열림 여부 (stair/exit 는 requires 로 계산)
  };

  function init() {
    state.currentRoom = START_ROOM;
    state.cleared = {};
    state.unlocked = {};
    Object.values(ROOMS).forEach((room) => {
      if (room.puzzle) state.cleared[room.puzzle.id] = false;
    });
    EDGES.forEach((e) => {
      if (e.kind === "door") state.unlocked[e.id] = false;
    });
  }

  function getCurrentRoom() {
    return ROOMS[state.currentRoom];
  }

  function getEdgesOf(roomId) {
    return EDGES.filter((e) => e.from === roomId || e.to === roomId);
  }

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

<<<<<<< HEAD:초기 모델/game.js
  // 최종 탈출문을 제외한 모든 문이 열렸는가?
  function allDoorsOpenedExceptFinal() {
    return EDGES.filter((e) => e.countsForExit).every(
      (e) => state.unlocked[e.id]
    );
=======
  // Edge 가 열려 있는가? (door 는 저장값, stair/exit 는 requires 로 계산)
  function isEdgeUnlocked(edge) {
    if (edge.requires) return edge.requires.every((pid) => state.cleared[pid]);
    return !!state.unlocked[edge.id];
>>>>>>> 4978512d26472292745cbcca8cd84067865ae7fe:game.js
  }

  // 현재 방에서 보이는 문/계단 목록
  function getNeighbors(roomId = state.currentRoom) {
    return getEdgesOf(roomId).map((edge) => {
      const targetId = otherEnd(edge, roomId);
      const puzzle = edge.gate ? findPuzzleById(edge.gate) : null;
      const target = ROOMS[targetId];
      return {
        edgeId: edge.id,
        room: target,
        kind: edge.kind,
        unlocked: isEdgeUnlocked(edge),
        direction: target.floor - ROOMS[roomId].floor, // +위 / -아래 / 0
        question: puzzle ? puzzle.question : null,
        puzzleType: puzzle ? puzzle.type || "code" : null,
      };
    });
  }

  // 현재 방 → 목표 방 문 정보
  function getDoor(targetRoomId, fromRoomId = state.currentRoom) {
    const edge = getEdgeBetween(fromRoomId, targetRoomId);
    if (!edge) return null;
    return {
      edge,
      kind: edge.kind,
      puzzle: edge.gate ? findPuzzleById(edge.gate) : null,
      requires: edge.requires || null,
      unlocked: isEdgeUnlocked(edge),
      targetRoom: ROOMS[targetRoomId],
    };
  }

  // requires 퍼즐 중 아직 안 풀린 방 이름 목록 (안내용)
  function missingRooms(requires) {
    if (!requires) return [];
    return requires
      .filter((pid) => !state.cleared[pid])
      .map((pid) => {
        const room = Object.values(ROOMS).find(
          (r) => r.puzzle && r.puzzle.id === pid
        );
        return room ? room.name : pid;
      });
  }

  /**
   * 도어락 코드로 문 열기 (door edge 전용).
   * @returns {object} { ok, moved?, master?, wrong?, reason? }
   */
  function tryDoor(targetRoomId, rawCode) {
    const door = getDoor(targetRoomId);
    if (!door) return { ok: false, reason: "연결된 길이 없습니다." };
    if (door.unlocked) {
      state.currentRoom = targetRoomId;
      return { ok: true, moved: true };
    }
    const code = String(rawCode == null ? "" : rawCode).trim();
    const answer = door.puzzle ? String(door.puzzle.answer) : null;
    const isMaster = code === ADMIN_PASSWORD; // FR-008
    const correct =
      isMaster || (answer && code.toLowerCase() === answer.toLowerCase());
    if (!correct) return { ok: false, wrong: true };
    openEdge(door);
    state.currentRoom = targetRoomId;
    return { ok: true, moved: true, master: isMaster, targetRoom: door.targetRoom };
  }

  // 특수 퍼즐(make10)을 UI에서 이미 풀었을 때 문 열기
  function forceOpen(targetRoomId) {
    const door = getDoor(targetRoomId);
    if (!door) return { ok: false };
    openEdge(door);
    state.currentRoom = targetRoomId;
    return { ok: true, targetRoom: door.targetRoom };
  }

  // Unlock Event: 문 열림 + 퍼즐 clear (stair/exit 는 requires 로 자동 갱신됨)
  function openEdge(door) {
    if (door.edge.kind === "door") state.unlocked[door.edge.id] = true;
    if (door.puzzle) state.cleared[door.puzzle.id] = true;
  }

  return {
    state,
    init,
    getCurrentRoom,
    getNeighbors,
    getDoor,
    tryDoor,
    forceOpen,
    missingRooms,
  };
})();
