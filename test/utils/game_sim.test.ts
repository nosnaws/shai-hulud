import { createBoard, createGameState, createSnake } from "../utils";
import {
  makeMove,
  resolveTurn,
  cloneGameState,
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

  describe("resolveTurn", () => {
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
      expect(ns.board.snakes[0].health).toEqual(84); // 1 for the turn, 15 for hazard
    });
  });
});
