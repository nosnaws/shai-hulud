import { createBoard, createGameState, createSnake } from "../utils";
import {
  makeMove,
  resolveTurn,
  cloneGameState,
  addMove,
} from "../../src/utils/game_sim";

describe("game_sim", () => {
  describe("makeMove", () => {
    it("adds move to snake head", () => {
      const s = createSnake([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ]);
      const board = createBoard(3, [], [s]);
      const gs = createGameState(board, s);
      const newMove = { x: 1, y: 0 };
      makeMove(gs, s, newMove);
      expect(gs.board.snakes[0].head).toEqual(newMove);
      expect(gs.board.snakes[0].body).toHaveLength(4);
      expect(gs.board.snakes[0].length).toBe(3); //length doesn't change unless we eat
    });
  });
  describe("cloneGameState", () => {
    it("clones game state", () => {
      const s = createSnake([
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ]);
      const board = createBoard(3, [], [s]);
      const gs = createGameState(board, s);
      expect(cloneGameState(gs)).toEqual(gs);
    });
  });

  describe("resolveTurn", () => {
    it("does not throw errors", () => {
      const s = createSnake(
        [
          {
            y: 4,
            x: 5,
          },
          {
            y: 3,
            x: 5,
          },
          {
            y: 2,
            x: 5,
          },
        ],
        { health: 98 }
      );
      const s2 = createSnake(
        [
          {
            y: 9,
            x: 0,
          },
          {
            y: 10,
            x: 0,
          },
          {
            y: 10,
            x: 1,
          },
          {
            y: 9,
            x: 1,
          },
        ],
        { health: 10 }
      );
      const s3 = createSnake(
        [
          {
            y: 6,
            x: 5,
          },
          {
            y: 7,
            x: 5,
          },
          {
            y: 8,
            x: 5,
          },
        ],
        { health: 10 }
      );
      const food = [
        {
          y: 0,
          x: 6,
        },
        {
          y: 10,
          x: 4,
        },
        {
          y: 5,
          x: 5,
        },
        {
          y: 9,
          x: 2,
        },
      ];
      const board = createBoard(11, food, [s, s2, s3]);
      const gs = createGameState(board, s);
      const sMove = { x: 5, y: 6 };
      const s2Move = { x: 4, y: 7 };
      const s3Move = { x: 3, y: 9 };
      addMove(gs, s, sMove);
      addMove(gs, s2, s2Move);
      addMove(gs, s3, s3Move);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes).toHaveLength(2);
    });

    it("snake moves", () => {
      const s = createSnake([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
      ]);
      const board = createBoard(3, [], [s]);
      const gs = createGameState(board, s);
      const newMove = { x: 1, y: 0 };
      makeMove(gs, s, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes[0].health).toBe(99);
      expect(gs.board.snakes[0].health).toBe(100); // did not modify original
      expect(ns.board.snakes[0].head).toEqual(newMove);
      expect(ns.board.snakes[0].body).toEqual([
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ]);
    });

    it("snake moves, `you` is updated", () => {
      const s = createSnake([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
      ]);
      const board = createBoard(3, [], [s]);
      const gs = createGameState(board, s);
      const newMove = { x: 1, y: 0 };
      makeMove(gs, s, newMove);
      const ns = resolveTurn(gs);
      expect(ns.you.health).toBe(99);
      expect(ns.you.head).toEqual(newMove);
      expect(ns.you.body).toEqual([
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
      ]);
    });

    it("snake eats", () => {
      const s = createSnake([
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
      ]);
      const board = createBoard(3, [{ x: 1, y: 0 }], [s]);
      const gs = createGameState(board, s);
      const newMove = { x: 1, y: 0 };
      makeMove(gs, s, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes[0].health).toBe(100);
      expect(ns.board.snakes[0].head).toEqual(newMove);
      expect(ns.board.snakes[0].body).toEqual([
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 1 },
      ]);
    });

    it("snakes eats itself", () => {
      const s = createSnake([
        { x: 1, y: 0 },
        { x: 0, y: 0 }, // _ _ _
        { x: 0, y: 1 }, // s s s
        { x: 1, y: 1 }, // s h _
        { x: 2, y: 1 },
      ]);
      const board = createBoard(3, [], [s]);
      const gs = createGameState(board, s);
      const newMove = { x: 1, y: 1 };
      makeMove(gs, s, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes).toHaveLength(0);
      expect(ns.you).toBeDefined();
    });

    it("snakes goes out of bounds", () => {
      const s = createSnake([
        { x: 2, y: 0 }, // _ _ _
        { x: 1, y: 0 }, // _ _ _
        { x: 0, y: 0 }, // s s h
      ]);
      const board = createBoard(3, [], [s]);
      const gs = createGameState(board, s);
      const newMove = { x: 3, y: 0 };
      makeMove(gs, s, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes).toHaveLength(0);
    });

    it("snake collides with another", () => {
      const s = createSnake([
        { x: 2, y: 0 }, // _ _ e
        { x: 1, y: 0 }, // _ k e
        { x: 0, y: 0 }, // s s h
      ]);
      const e = createSnake([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ]);
      const board = createBoard(3, [], [s, e]);
      const gs = createGameState(board, s);
      const newMove = { x: 2, y: 1 };
      makeMove(gs, s, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes).toHaveLength(1);
      expect(ns.board.snakes[0].id).toBe(e.id);
    });

    it("snake head to head different lengths", () => {
      const s = createSnake([
        { x: 2, y: 0 }, // e e k
        { x: 1, y: 0 }, // e _ _
        { x: 0, y: 0 }, // s s h
      ]);
      const e = createSnake([
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { x: 0, y: 1 },
      ]);
      const board = createBoard(3, [], [s, e]);
      const gs = createGameState(board, s);
      const newMove = { x: 2, y: 1 };
      makeMove(gs, s, newMove);
      makeMove(gs, e, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes).toHaveLength(1);
      expect(ns.board.snakes[0].id).toBe(e.id);
      expect(ns.board.snakes[0].head).toEqual(newMove);
      expect(ns.board.snakes[0].body).toHaveLength(4);
    });

    it("snake head to head equal lengths", () => {
      const s = createSnake([
        { x: 2, y: 0 }, // e e k
        { x: 1, y: 0 }, // _ _ _
        { x: 0, y: 0 }, // s s h
      ]);
      const e = createSnake([
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
      ]);
      const board = createBoard(3, [], [s, e]);
      const gs = createGameState(board, s);
      const newMove = { x: 2, y: 1 };
      makeMove(gs, s, newMove);
      makeMove(gs, e, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes).toHaveLength(0);
    });

    it("factors in hazard damage", () => {
      const s = createSnake([
        { x: 2, y: 0 }, // _ _ _
        { x: 1, y: 0 }, // _ _ x
        { x: 0, y: 0 }, // s s h
      ]);
      const board = createBoard(3, [], [s], [{ x: 2, y: 1 }]);
      const gs = createGameState(board, s);
      const newMove = { x: 2, y: 1 };
      makeMove(gs, s, newMove);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes[0].health).toEqual(85); // 1 for the turn, 15 for hazard
    });

    it("properly resolves collisions and hazard damage", () => {
      const s = createSnake(
        [
          {
            y: 9,
            x: 9,
          },
          {
            y: 9,
            x: 8,
          },
          {
            y: 9,
            x: 7,
          },
          {
            y: 8,
            x: 7,
          },
          {
            y: 8,
            x: 6,
          },
          {
            y: 7,
            x: 6,
          },
          {
            y: 6,
            x: 6,
          },
        ],
        { health: 42 }
      );
      const s2 = createSnake(
        [
          {
            y: 10,
            x: 8,
          },
          {
            y: 10,
            x: 7,
          },
          {
            y: 10,
            x: 6,
          },
          {
            y: 10,
            x: 5,
          },
          {
            y: 10,
            x: 4,
          },
          {
            y: 10,
            x: 3,
          },
          {
            y: 10,
            x: 2,
          },
          {
            y: 10,
            x: 1,
          },
          {
            y: 9,
            x: 1,
          },
          {
            y: 8,
            x: 1,
          },
          {
            y: 8,
            x: 2,
          },
          {
            y: 8,
            x: 3,
          },
          {
            y: 8,
            x: 4,
          },
          {
            y: 8,
            x: 5,
          },
          {
            y: 7,
            x: 5,
          },
          {
            y: 7,
            x: 4,
          },
          {
            y: 7,
            x: 3,
          },
        ],
        { health: 10 }
      );
      const hazards = [
        {
          y: 0,
          x: 0,
        },
        {
          y: 1,
          x: 0,
        },
        {
          y: 2,
          x: 0,
        },
        {
          y: 3,
          x: 0,
        },
        {
          y: 4,
          x: 0,
        },
        {
          y: 5,
          x: 0,
        },
        {
          y: 6,
          x: 0,
        },
        {
          y: 7,
          x: 0,
        },
        {
          y: 8,
          x: 0,
        },
        {
          y: 9,
          x: 0,
        },
        {
          y: 10,
          x: 0,
        },
        {
          y: 0,
          x: 1,
        },
        {
          y: 1,
          x: 1,
        },
        {
          y: 9,
          x: 1,
        },
        {
          y: 10,
          x: 1,
        },
        {
          y: 0,
          x: 2,
        },
        {
          y: 1,
          x: 2,
        },
        {
          y: 9,
          x: 2,
        },
        {
          y: 10,
          x: 2,
        },
        {
          y: 0,
          x: 3,
        },
        {
          y: 1,
          x: 3,
        },
        {
          y: 9,
          x: 3,
        },
        {
          y: 10,
          x: 3,
        },
        {
          y: 0,
          x: 4,
        },
        {
          y: 1,
          x: 4,
        },
        {
          y: 9,
          x: 4,
        },
        {
          y: 10,
          x: 4,
        },
        {
          y: 0,
          x: 5,
        },
        {
          y: 1,
          x: 5,
        },
        {
          y: 9,
          x: 5,
        },
        {
          y: 10,
          x: 5,
        },
        {
          y: 0,
          x: 6,
        },
        {
          y: 1,
          x: 6,
        },
        {
          y: 9,
          x: 6,
        },
        {
          y: 10,
          x: 6,
        },
        {
          y: 0,
          x: 7,
        },
        {
          y: 1,
          x: 7,
        },
        {
          y: 9,
          x: 7,
        },
        {
          y: 10,
          x: 7,
        },
        {
          y: 0,
          x: 8,
        },
        {
          y: 1,
          x: 8,
        },
        {
          y: 9,
          x: 8,
        },
        {
          y: 10,
          x: 8,
        },
        {
          y: 0,
          x: 9,
        },
        {
          y: 1,
          x: 9,
        },
        {
          y: 9,
          x: 9,
        },
        {
          y: 10,
          x: 9,
        },
        {
          y: 0,
          x: 10,
        },
        {
          y: 1,
          x: 10,
        },
        {
          y: 9,
          x: 10,
        },
        {
          y: 10,
          x: 10,
        },
      ];
      const food = [
        {
          y: 4,
          x: 0,
        },
        {
          y: 7,
          x: 9,
        },
        {
          y: 2,
          x: 2,
        },
        {
          y: 10,
          x: 9,
        },
        {
          y: 4,
          x: 5,
        },
        {
          y: 3,
          x: 8,
        },
      ];
      const board = createBoard(11, food, [s, s2], hazards);
      const gs = createGameState(board, s);
      const sMove = { x: 9, y: 10 };
      const s2Move = { x: 9, y: 10 };
      addMove(gs, s, sMove);
      addMove(gs, s2, s2Move);
      const ns = resolveTurn(gs);
      expect(ns.board.snakes).toHaveLength(1);
      expect(ns.board.snakes[0].id).toEqual(s2.id);
    });
  });
});
