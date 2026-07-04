# Feature Specification

## Project Overview

### Project Name
Web Escape Room

### Goal
웹 브라우저에서 플레이 가능한 방탈출 게임을 제작한다.

현재 버전은 최소 기능(MVP)을 목표로 하며, 그래프(Graph) 기반의 맵과 방 이동, 퍼즐 해결에 따른 맵 확장을 구현한다.

---

# 1. Map Specification

## 1.1 Map Structure

맵은 **Graph** 구조로 구성된다.

- Vertex = Room
- Edge = 이동 가능한 통로

플레이어는 현재 위치한 Room에서 연결된 Edge를 통해 다른 Room으로 이동할 수 있다.

---

## 1.2 Room Types

현재 구현되는 방은 다음과 같다.

| Room ID | Room Name |
|----------|-----------|
| R0 | Corridor |
| R1 | Pantry |
| R2 | Immersion Classroom |
| R3 | Open Space |
| R4 | Office |

---

## 1.3 Map Layout

초기 맵 구조는 아래와 같다.

```
                Pantry
                   |
                   |
Open Space --- Corridor --- Office
                   |
                   |
       Immersion Classroom
```

규칙

- Corridor는 모든 방과 연결된다.
- Pantry, Immersion Classroom, Open Space, Office는 Corridor와만 연결된다.
- 일반 방끼리는 직접 연결되지 않는다.

---

# 2. Room Specification

## 2.1 Visible Objects

플레이어에게 보여지는 요소

- 상호작용 가능한 오브젝트 여러 개
- 방을 나갈 수 있는 문

---

## 2.2 Hidden Data

플레이어에게 보여지지 않는 데이터

- Room ID
- 연결된 Edge ID 목록
- Puzzle Cleared 여부

---

# 3. Edge Specification

Edge는 방 사이의 이동 가능 여부를 관리한다.

Edge는 다음 두 가지 상태를 가진다.

- Locked
- Unlocked

초기에는 모든 Edge가 Locked 상태이다.

퍼즐을 해결하면 지정된 Edge가 Unlock된다.

---

# 4. Puzzle Specification

복도를 제외한 모든 방에는 하나의 퍼즐이 존재한다.

퍼즐 해결 시

- Puzzle Cleared = true
- 지정된 Edge Unlock

으로 변경된다.

---

# 5. Movement

플레이어는

현재 Room에서

Unlocked 상태인 Edge만 이용하여 이동할 수 있다.

Locked 상태의 Edge는 이동할 수 없다.

---

# 6. Unlock Event

퍼즐 해결 시

1. Puzzle Cleared를 true로 변경한다.
2. 지정된 Edge를 Unlock한다.
3. 플레이어가 이동 가능한 방향을 이미지 또는 UI 효과로 안내한다.

---

# 7. Administrator Mode

개발 및 테스트를 위한 기능이다.

현재 방에서

```
1234
```

를 입력하면

현재 방의 퍼즐을 해결한 것으로 처리한다.

실행 결과

- Puzzle Cleared = true
- Unlock Event 실행

실제 퍼즐은 수행하지 않는다.

---

# 8. Initial Game State

초기 상태

Current Room

- Corridor

Puzzle Status

| Room | Cleared |
|------|----------|
| Pantry | false |
| Immersion Classroom | false |
| Open Space | false |
| Office | false |

Edge Status

모든 Edge

- Locked

---

# 9. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-001 | Graph 구조의 맵을 생성할 수 있어야 한다. |
| FR-002 | 현재 방 정보를 표시해야 한다. |
| FR-003 | 현재 방의 오브젝트를 표시해야 한다. |
| FR-004 | 퍼즐 해결 여부를 저장해야 한다. |
| FR-005 | 퍼즐 해결 시 지정된 Edge를 Unlock해야 한다. |
| FR-006 | Unlock된 Edge만 이동 가능해야 한다. |
| FR-007 | 새로운 길이 열리면 UI를 통해 플레이어에게 알려야 한다. |
| FR-008 | 관리자 비밀번호(1234) 입력 시 현재 방의 퍼즐을 즉시 해결해야 한다. |

---

# 10. Non-Functional Requirements

- 웹 브라우저에서 실행되어야 한다.
- 새로고침 없이 방 이동이 가능해야 한다.
- Room 추가가 쉬운 구조여야 한다.
- Puzzle 추가가 쉬운 구조여야 한다.
- Edge 추가 및 수정이 쉬운 구조여야 한다.
- Graph 구조를 쉽게 확장할 수 있어야 한다.

---

# 11. Future Expansion

향후 추가 가능한 기능

- 실제 퍼즐 구현
- 인벤토리 시스템
- 아이템 획득 및 사용
- 힌트 시스템
- 저장 및 이어하기
- 여러 층의 맵
- 분기형 맵 구조
- 엔딩 분기