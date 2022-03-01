import {
  determineMove,
  voronoi,
  minmax,
  IDSMinMax,
} from "../src/lookahead_snake";
import { createBoard, createGameState, createSnake } from "./utils";
import { resolveTurn } from "../src/utils/game_sim";

describe("lookahead_snake", () => {
  describe("voronoi", () => {
    it("returns count for 1 snake", () => {
      // _ _ _
      // _ _ _
      // h _ _
      const snake1 = createSnake([{ x: 0, y: 0 }]);
      const board = createBoard(3, [], [snake1]);
      const gs = createGameState(board, snake1, 1, "solo");
      const count = voronoi(gs);
      expect(count).toBe(8);
    });

    it("returns counts for 2 snakes", () => {
      // _ _ _ _ _
      // _ _ _ h s
      // _ _ _ _ s
      // _ _ _ _ _
      // k e e _ _
      const snake1 = createSnake([
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 4, y: 2 },
      ]);
      const snake2 = createSnake([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]);
      const board = createBoard(5, [], [snake1, snake2]);
      const gs = createGameState(board, snake1);
      const count = voronoi(gs);
      expect(count).toBe(15);
    });
  });
  describe("minmax", () => {
    it("returns move in under 100ms, 2 food", () => {
      const snake = createSnake([
        { x: 9, y: 10 },
        { x: 9, y: 9 },
        { x: 9, y: 8 },
        { x: 9, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 7 },
      ]);
      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 1, y: 10 },
            { x: 2, y: 10 },
          ],
          [snake]
        ),
        snake
      );

      const time = Date.now();
      const move = minmax(gameState, snake.head, 4, -Infinity, Infinity, true);
      expect(Date.now() - time).toBeLessThan(100);
    });
    it("returns move in under 100ms, 1 food", () => {
      const snake = createSnake([
        { x: 9, y: 10 },
        { x: 9, y: 9 },
        { x: 9, y: 8 },
        { x: 9, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 7 },
      ]);
      const gameState = createGameState(
        createBoard(11, [{ x: 1, y: 10 }], [snake]),
        snake
      );

      const time = Date.now();
      const move = minmax(gameState, snake.head, 4, -Infinity, Infinity, true);
      expect(Date.now() - time).toBeLessThan(200);
    });
    it("returns move in under 100ms, 2 food - 2 snakes", () => {
      const snake1 = createSnake([
        { x: 9, y: 10 },
        { x: 9, y: 9 },
        { x: 9, y: 8 },
        { x: 9, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 7 },
      ]);
      const snake2 = createSnake([
        { x: 0, y: 10 },
        { x: 0, y: 9 },
        { x: 0, y: 8 },
        { x: 0, y: 7 },
        { x: 0, y: 7 },
        { x: 0, y: 7 },
      ]);

      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 1, y: 10 },
            { x: 2, y: 10 },
          ],
          [snake1, snake2]
        ),
        snake1
      );

      const time = Date.now();
      const move = minmax(gameState, snake1.head, 4, -Infinity, Infinity, true);
      expect(Date.now() - time).toBeLessThan(200);
    });

    it("returns move in under 400ms, 2 food - 4 snakes", () => {
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ w w _ _
      // _ _ _ _ _ _ _ _ w _ _
      // s s h _ _ _ _ _ _ _ _
      // s _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ e e e _ _
      // _ _ r _ _ _ e _ _ _ _
      // _ _ r _ _ _ e _ _ _ _
      // _ r r _ _ _ e _ _ _ _
      const snake1 = createSnake([
        { x: 2, y: 6 },
        { x: 1, y: 6 },
        { x: 0, y: 6 },
        { x: 0, y: 5 },
      ]);
      const snake2 = createSnake([
        { x: 8, y: 3 },
        { x: 7, y: 3 },
        { x: 6, y: 3 },
        { x: 6, y: 2 },
        { x: 6, y: 1 },
        { x: 6, y: 0 },
      ]);
      const snake3 = createSnake([
        { x: 2, y: 2 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
        { x: 1, y: 0 },
      ]);
      const snake4 = createSnake([
        { x: 7, y: 8 },
        { x: 8, y: 8 },
        { x: 8, y: 7 },
      ]);
      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 1, y: 10 },
            { x: 2, y: 10 },
            { x: 5, y: 0 },
          ],
          [snake1, snake2, snake3, snake4]
        ),
        snake1
      );

      const time = Date.now();
      const move = minmax(gameState, snake1.head, 4, -Infinity, Infinity, true);
      expect(Date.now() - time).toBeLessThan(400);
    });
  });

  describe("IDSMinMax", () => {
    it("returns move in under 100ms, 2 food", () => {
      const snake = createSnake([
        { x: 9, y: 10 },
        { x: 9, y: 9 },
        { x: 9, y: 8 },
        { x: 9, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 7 },
      ]);
      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 1, y: 10 },
            { x: 2, y: 10 },
          ],
          [snake]
        ),
        snake
      );

      const time = Date.now();
      const move = IDSMinMax(gameState, time, 50);
      expect(Date.now() - time).toBeLessThan(100);
    });
    it("returns move in under 100ms, 1 food", () => {
      const snake = createSnake([
        { x: 9, y: 10 },
        { x: 9, y: 9 },
        { x: 9, y: 8 },
        { x: 9, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 7 },
      ]);
      const gameState = createGameState(
        createBoard(11, [{ x: 1, y: 10 }], [snake]),
        snake
      );

      const time = Date.now();
      const move = IDSMinMax(gameState, time, 50);
      expect(Date.now() - time).toBeLessThan(100);
    });
    it("returns move in under 100ms, 2 food - 2 snakes", () => {
      const snake1 = createSnake([
        { x: 9, y: 10 },
        { x: 9, y: 9 },
        { x: 9, y: 8 },
        { x: 9, y: 7 },
        { x: 8, y: 7 },
        { x: 7, y: 7 },
      ]);
      const snake2 = createSnake([
        { x: 0, y: 10 },
        { x: 0, y: 9 },
        { x: 0, y: 8 },
        { x: 0, y: 7 },
        { x: 0, y: 7 },
        { x: 0, y: 7 },
      ]);

      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 1, y: 10 },
            { x: 2, y: 10 },
          ],
          [snake1, snake2]
        ),
        snake1
      );

      const time = Date.now();
      const move = IDSMinMax(gameState, time, 100);
      expect(Date.now() - time).toBeLessThan(200);
    });

    it("returns move in under 400ms, 2 food - 4 snakes", () => {
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ w w _ _
      // _ _ _ _ _ _ _ _ w _ _
      // s s h _ _ _ _ _ _ _ _
      // s _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ e e e _ _
      // _ _ r _ _ _ e _ _ _ _
      // _ _ r _ _ _ e _ _ _ _
      // _ r r _ _ _ e _ _ _ _
      const snake1 = createSnake([
        { x: 2, y: 6 },
        { x: 1, y: 6 },
        { x: 0, y: 6 },
        { x: 0, y: 5 },
      ]);
      const snake2 = createSnake([
        { x: 8, y: 3 },
        { x: 7, y: 3 },
        { x: 6, y: 3 },
        { x: 6, y: 2 },
        { x: 6, y: 1 },
        { x: 6, y: 0 },
      ]);
      const snake3 = createSnake([
        { x: 2, y: 2 },
        { x: 2, y: 1 },
        { x: 2, y: 0 },
        { x: 1, y: 0 },
      ]);
      const snake4 = createSnake([
        { x: 7, y: 8 },
        { x: 8, y: 8 },
        { x: 8, y: 7 },
      ]);
      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 1, y: 10 },
            { x: 2, y: 10 },
            { x: 5, y: 0 },
          ],
          [snake1, snake2, snake3, snake4]
        ),
        snake1
      );

      const time = Date.now();
      const move = IDSMinMax(gameState, time, 150);
      expect(Date.now() - time).toBeLessThan(400);
    });
  });
  describe("determineMove", () => {
    it("chooses to eat food", () => {
      const snake = createSnake(
        [
          { x: 1, y: 2 },
          { x: 1, y: 1 }, // _ _ _ _ e
          { x: 1, y: 0 }, // _ f _ _ e
          { x: 2, y: 0 }, // _ h _ _ e
          { x: 3, y: 0 }, // _ s _ _ _
          { x: 4, y: 0 }, // _ s s s s
        ],
        { health: 2 }
      );
      const snake2 = createSnake([
        { x: 4, y: 4 },
        { x: 4, y: 3 },
        { x: 4, y: 2 },
      ]);
      const gameState = createGameState(
        createBoard(5, [{ x: 1, y: 3 }], [snake]),
        snake,
        2,
        "solo"
      );

      const move = determineMove(gameState);
      expect(move).toEqual({ x: 1, y: 3 });
    });

    it("moves toward food on low health", () => {
      const snake = createSnake(
        [
          { x: 1, y: 2 }, // _ _ _ _ _
          { x: 1, y: 1 }, // _ _ f _ _
          { x: 1, y: 0 }, // _ _ _ _ _
          { x: 1, y: 0 }, // _ h _ _ _
          { x: 2, y: 0 }, // _ s _ _ _
          { x: 3, y: 0 }, // _ s s s s
        ],
        { health: 4 }
      );
      const gameState = createGameState(
        createBoard(5, [{ x: 2, y: 4 }], [snake]),
        snake
      );

      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 0, y: 2 });
    });

    it("doesn't get get itself stuck 11x11", () => {
      const snake = createSnake([
        { x: 0, y: 4 }, // _ _ _ _ _ _ _ _ _ _ _
        { x: 1, y: 4 }, // _ _ _ _ f _ _ _ _ _ _
        { x: 2, y: 4 }, // _ _ _ _ _ _ _ _ _ s s
        { x: 2, y: 3 }, // _ _ _ _ _ _ _ _ _ _ s
        { x: 2, y: 2 }, // _ _ _ _ _ _ _ _ _ _ s
        { x: 2, y: 1 }, // _ _ _ _ _ _ _ _ _ _ s
        { x: 2, y: 0 }, // h s s _ _ _ _ _ _ _ s
        { x: 3, y: 0 }, // _ _ s _ _ _ _ _ _ _ s
        { x: 4, y: 0 }, // f _ s _ s s s s s s s
        { x: 4, y: 1 }, // _ _ s _ s _ _ _ f _ _
        { x: 4, y: 2 }, // _ _ s s s _ _ _ _ _ _
        { x: 5, y: 2 },
        { x: 6, y: 2 },
        { x: 7, y: 2 },
        { x: 8, y: 2 },
        { x: 9, y: 2 },
        { x: 10, y: 2 },
        { x: 10, y: 3 },
        { x: 10, y: 4 },
        { x: 10, y: 5 },
        { x: 10, y: 6 },
        { x: 10, y: 7 },
        { x: 10, y: 8 },
        { x: 9, y: 8 },
      ]);
      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 0, y: 2 },
            { x: 8, y: 1 },
            { x: 4, y: 9 },
          ],
          [snake]
        ),
        snake,
        2,
        "solo"
      );

      const move = determineMove(gameState);
      expect(move).toEqual({ x: 0, y: 5 });
    });

    it("doesn't decide to die 1", () => {
      // _ _ e _ _ _ _ _ _ _ _
      // _ _ e _ _ _ _ _ _ _ _
      // _ _ e _ _ _ _ _ _ _ _
      // _ _ e _ _ _ _ _ _ _ _
      // _ _ k s s s _ _ _ _ _
      // _ _ _ h _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ f _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ f _ _ _ _ _ _
      // h = my head, k = enemy head

      const me = createSnake(
        [
          { x: 3, y: 5 },
          { x: 3, y: 6 },
          { x: 4, y: 6 },
          { x: 5, y: 6 },
        ],
        { health: 84 }
      );
      const other = createSnake(
        [
          { x: 2, y: 6 },
          { x: 2, y: 7 },
          { x: 2, y: 8 },
          { x: 2, y: 9 },
          { x: 2, y: 10 },
        ],
        { health: 94 }
      );
      const gameState = createGameState(
        createBoard(
          11,
          [
            { x: 2, y: 3 },
            { x: 4, y: 0 },
          ],
          [me, other]
        ),
        me
      );

      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 2, y: 5 });
    });

    it("doesn't decide to die 2", () => {
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ f _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ s h _ _
      // _ _ _ _ _ _ _ s _ _ _
      // _ _ _ _ _ e e e k _ _
      // h = my head, k = enemy head

      const me = createSnake(
        [
          { x: 8, y: 2 },
          { x: 7, y: 2 },
          { x: 7, y: 1 },
        ],
        { health: 96 }
      );
      const other = createSnake(
        [
          { x: 8, y: 0 },
          { x: 7, y: 0 },
          { x: 6, y: 0 },
          { x: 5, y: 0 },
        ],
        { health: 99 }
      );
      const gameState = createGameState(
        createBoard(11, [{ x: 5, y: 5 }], [me, other]),
        me
      );
      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 8, y: 1 });
    });

    it("choose path through moving tail", () => {
      // _ _ _ _ _
      // _ _ _ _ _
      // _ e e e e
      // _ e s s h
      // _ k _ _ _
      // h = my head, k = enemy head

      const me = createSnake([
        { x: 4, y: 1 },
        { x: 3, y: 1 },
        { x: 2, y: 1 },
      ]);
      const other = createSnake([
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ]);
      const gameState = createGameState(createBoard(5, [], [me, other]), me);
      const move = minmax(gameState, me.head, 2, -Infinity, Infinity, true);
      expect(move.move).toEqual({ x: 4, y: 2 });
    });

    it("does not choose path through moving tail if snake did eat", () => {
      // _ _ _ _ _
      // _ _ _ _ _
      // k e e e e
      // _ _ s s h
      // _ _ _ _ _
      // h = my head, k = enemy head

      const me = createSnake([
        { x: 4, y: 1 },
        { x: 3, y: 1 },
        { x: 2, y: 1 },
      ]);
      const other = createSnake([
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 2 }, // denotes eating last turn
      ]);
      const gameState = createGameState(createBoard(5, [], [me, other]), me);
      const move = determineMove(gameState);
      expect(move).toEqual({ x: 4, y: 0 });
    });

    it("does not eat own tail after growing", () => {
      // f _ _ _ _ _ _ f _ _ _
      // _ _ f _ f _ f _ _ f f
      // f f _ f _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // f _ _ _ _ _ _ _ _ _ _
      // f _ _ _ _ _ _ _ f f f
      // _ _ _ _ k _ _ _ _ _ _
      // _ f _ _ e _ s h _ f _
      // _ _ _ _ e _ s s _ f _
      // _ _ _ _ e e s s _ _ _
      // h = my head, k = enemy head
      // node my snake consumed food turn before, tail spot is no longer valid

      const food = [
        { x: 9, y: 9 },
        { x: 9, y: 4 },
        { x: 9, y: 2 },
        { x: 9, y: 1 },
        { x: 8, y: 4 },
        { x: 7, y: 10 },
        { x: 6, y: 9 },
        { x: 4, y: 9 },
        { x: 3, y: 8 },
        { x: 2, y: 9 },
        { x: 10, y: 9 },
        { x: 10, y: 4 },
        { x: 1, y: 8 },
        { x: 1, y: 2 },
        { x: 0, y: 8 },
        { x: 0, y: 5 },
        { x: 0, y: 4 },
        { x: 0, y: 10 },
      ];
      const me = createSnake(
        [
          { x: 7, y: 2 },
          { x: 7, y: 1 },
          { x: 7, y: 0 },
          { x: 6, y: 0 },
          { x: 6, y: 1 },
          { x: 6, y: 2 },
          { x: 6, y: 2 },
        ],
        { health: 99 }
      );
      const other = createSnake([
        { x: 4, y: 3 },
        { x: 4, y: 2 },
        { x: 4, y: 1 },
        { x: 4, y: 0 },
        { x: 5, y: 0 },
      ]);
      const gameState = createGameState(createBoard(11, food, [me, other]), me);
      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 6, y: 2 });
    });

    it("doesn't go for the head to head and lose", () => {
      // f _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ e e e
      // _ _ _ _ _ _ f _ _ _ e
      // _ _ _ _ _ _ _ _ _ _ e
      // s s s s s h _ f _ _ e
      // s f f _ _ _ h e e e e
      // _ _ _ f _ _ _ _ _ f f
      // f _ _ _ _ _ _ f _ _ f
      // f _ _ _ _ _ f _ _ _ f
      // _ _ _ _ _ _ _ _ _ f _
      // _ _ _ _ f _ f _ _ _ f
      // h = my head, k = enemy head

      const me = createSnake(
        [
          { x: 5, y: 6 },
          { x: 4, y: 6 },
          { x: 3, y: 6 },
          { x: 2, y: 6 },
          { x: 1, y: 6 },
          { x: 0, y: 6 },
          { x: 0, y: 5 },
        ],
        { health: 77 }
      );

      const snake2 = createSnake(
        [
          { x: 6, y: 5 },
          { x: 7, y: 5 },
          { x: 8, y: 5 },
          { x: 9, y: 5 },
          { x: 10, y: 5 },
          { x: 10, y: 6 },
          { x: 10, y: 7 },
          { x: 10, y: 8 },
          { x: 10, y: 9 },
          { x: 9, y: 9 },
          { x: 8, y: 9 },
        ],
        { health: 54 }
      );

      const food = [
        { x: 0, y: 10 },
        { x: 6, y: 8 },
        { x: 7, y: 6 },
        { x: 0, y: 2 },
        { x: 0, y: 3 },
        { x: 1, y: 5 },
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 4, y: 0 },
        { x: 6, y: 0 },
        { x: 6, y: 2 },
        { x: 7, y: 3 },
        { x: 9, y: 4 },
        { x: 10, y: 4 },
        { x: 10, y: 3 },
        { x: 10, y: 2 },
        { x: 9, y: 1 },
        { x: 10, y: 0 },
      ];
      const gameState = createGameState(
        createBoard(11, food, [me, snake2]),
        me,
        109,
        "wrapped"
      );
      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 5, y: 5 });
    });

    it("sees wrapped moves", () => {
      // ◦◦◦◦■■■⌀◦◦◦
      // ■■■■■◦◦◦◦◦■
      // ◦◦◦◦◦◦◦◦◦◦■
      // ◦⌀⌀⌀◦◦◦◦◦◦■
      // ◦⌀◦⌀⌀◦◦◦⚕◦■
      // ⚕⌀◦⚕⌀◦◦◦◦◦■
      // ⌀⌀◦⚕⌀⌀◦◦◦◦■
      // ⌀⚕◦◦⌀⌀◦◦◦◦■
      // ⌀⌀⌀⌀◦◦◦◦◦■■
      // ⌀⌀⚕⌀⌀⌀⌀⌀⚕■◦
      // ◦⚕■■■■■⌀◦◦◦
      // _ _ _ _ s s s e _ _ _
      // s s s s s _ _ _ _ _ s
      // _ _ _ _ _ _ _ _ _ _ s
      // _ e e e _ _ _ _ _ _ s
      // _ e _ e e _ _ _ f _ s
      // f e _ f e _ _ _ _ _ s
      // e e _ f e e _ _ _ _ s
      // e f _ _ e e _ _ _ _ s
      // e e e e _ _ _ _ _ s s
      // e e f e e e e e f s _
      // _ f h s s s s e _ _ _
      // h = my head, x = hazard

      const me = createSnake(
        [
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 0 },
          { x: 6, y: 0 },
          { x: 6, y: 10 },
          { x: 5, y: 10 },
          { x: 4, y: 10 },
          { x: 4, y: 9 },
          { x: 3, y: 9 },
          { x: 2, y: 9 },
          { x: 1, y: 9 },
          { x: 0, y: 9 },
          { x: 10, y: 9 },
          { x: 10, y: 8 },
          { x: 10, y: 7 },
          { x: 10, y: 6 },
          { x: 10, y: 5 },
          { x: 10, y: 4 },
          { x: 10, y: 3 },
          { x: 10, y: 2 },
          { x: 9, y: 2 },
          { x: 9, y: 1 },
        ],
        { health: 97 }
      );

      // _ _ _ _ s s s k _ _ _
      // s s s s s _ _ _ _ _ s
      // _ _ _ _ _ _ _ _ _ _ s
      // _ e e e _ _ _ _ _ _ s
      // _ e _ e e _ _ _ f _ s
      // f e _ f e _ _ _ _ _ s
      // e e _ f e e _ _ _ _ s
      // e f _ _ e e _ _ _ _ s
      // e e e e _ _ _ _ _ s s
      // e e f e e e e e f s _
      // _ f h s s s s e _ _ _
      // h = my head, x = hazard
      const snake2 = createSnake(
        [
          { x: 7, y: 10 },
          { x: 7, y: 0 },
          { x: 7, y: 1 },
          { x: 6, y: 1 },
          { x: 5, y: 1 },
          { x: 4, y: 1 },
          { x: 3, y: 1 },
          { x: 3, y: 2 },
          { x: 2, y: 2 },
          { x: 1, y: 2 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
          { x: 0, y: 2 },
          { x: 0, y: 3 },
          { x: 0, y: 4 },
          { x: 1, y: 4 },
          { x: 1, y: 5 },
          { x: 1, y: 6 },
          { x: 1, y: 7 },
          { x: 2, y: 7 },
          { x: 3, y: 7 },
          { x: 3, y: 6 },
          { x: 4, y: 6 },
          { x: 4, y: 5 },
          { x: 4, y: 4 },
          { x: 4, y: 3 },
          { x: 5, y: 3 },
          { x: 5, y: 4 },
        ],
        { health: 98 }
      );

      // _ _ _ _ s s s k _ _ _
      // s s s s s _ _ _ _ _ s
      // _ _ _ _ _ _ _ _ _ _ s
      // _ e e e _ _ _ _ _ _ s
      // _ e _ e e _ _ _ f _ s
      // f e _ f e _ _ _ _ _ s
      // e e _ f e e _ _ _ _ s
      // e f _ _ e e _ _ _ _ s
      // e e e e _ _ _ _ _ s s
      // e e f e e e e e f s _
      // _ f h s s s s e _ _ _
      // h = my head, x = hazard
      const food = [
        { x: 1, y: 0 },
        { x: 2, y: 1 },
        { x: 8, y: 6 },
        { x: 8, y: 1 },
      ];
      const gameState = createGameState(
        createBoard(11, food, [me, snake2]),
        me,
        109,
        "wrapped"
      );
      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 2, y: 1 });
    });

    it("chooses life over zoning", () => {
      // _ _ _ _ _ _ f _ _ _ _
      // _ _ _ _ _ _ _ _ f _ _
      // f f _ _ _ _ _ _ _ _ _
      // _ _ _ f _ s _ _ _ _ _
      // _ _ _ h s s _ _ _ _ _
      // _ _ _ _ k e _ _ _ _ e
      // _ _ _ _ _ e e e e e e
      // _ _ _ _ f _ _ _ _ _ _
      // _ f _ _ _ _ f _ _ _ _
      // _ _ _ f _ _ _ _ f f f
      // _ _ _ _ _ _ _ _ _ _ _
      // h = my head, x = hazard

      const me = createSnake(
        [
          { x: 3, y: 4 },
          { x: 4, y: 4 },
          { x: 5, y: 4 },
          { x: 5, y: 3 },
        ],
        { health: 3 }
      );
      const snake2 = createSnake(
        [
          { x: 4, y: 5 },
          { x: 5, y: 5 },
          { x: 5, y: 6 },
          { x: 6, y: 6 },
          { x: 7, y: 6 },
          { x: 8, y: 6 },
          { x: 9, y: 6 },
          { x: 10, y: 6 },
          { x: 10, y: 5 },
        ],
        { health: 98 }
      );
      const food = [
        { x: 0, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 8 },
        { x: 3, y: 3 },
        { x: 3, y: 9 },
        { x: 4, y: 7 },
        { x: 6, y: 0 },
        { x: 6, y: 8 },
        { x: 8, y: 1 },
        { x: 8, y: 9 },
        { x: 9, y: 9 },
        { x: 10, y: 9 },
      ];
      const gameState = createGameState(
        createBoard(11, food, [me, snake2]),
        me,
        109
      );
      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 3, y: 5 });
    });

    it("does not choose death by hazard", () => {
      // _ _ _ _ f
      // _ _ _ _ x
      // _ _ _ _ h
      // _ _ _ _ s
      // _ _ _ _ s
      // h = my head, x = hazard

      const me = createSnake(
        [
          { x: 4, y: 2 },
          { x: 4, y: 1 },
          { x: 4, y: 0 },
        ],
        { health: 15 }
      );
      const hazards = [{ x: 4, y: 3 }];
      const gameState = createGameState(
        createBoard(5, [{ x: 4, y: 4 }], [me], hazards),
        me,
        1,
        "solo"
      );
      const move = determineMove(gameState);
      expect(move).not.toEqual({ x: 4, y: 3 });
    });

    it("returns -infinity for death move", () => {
      // _ _ _ _ _
      // _ _ e e h
      // _ _ _ _ s
      // _ _ _ _ s
      // _ _ _ _ s
      // h = my head, x = hazard

      const snake1 = createSnake(
        [
          { x: 4, y: 3 },
          { x: 4, y: 2 },
          { x: 4, y: 1 },
          { x: 4, y: 0 },
        ],
        { health: 16 }
      );

      const me = createSnake(
        [
          { x: 4, y: 3 },
          { x: 3, y: 3 },
          { x: 2, y: 3 },
        ],
        { health: 16 }
      );
      const gameState = createGameState(
        createBoard(5, [], [snake1, me]),
        me,
        1,
        "standard"
      );
      const state = resolveTurn(gameState);
      console.log(JSON.stringify(state, null, 2));
      const score = minmax(state, state.you.head, 2, -Infinity, Infinity, true);
      expect(score.score).toBe(-Infinity);
    });

    it("returns infinity for win move", () => {
      // _ _ _ _ _
      // _ _ e e h
      // _ _ _ _ s
      // _ _ _ _ s
      // _ _ _ _ s
      // h = my head, x = hazard

      const me = createSnake(
        [
          { x: 4, y: 3 },
          { x: 4, y: 2 },
          { x: 4, y: 1 },
          { x: 4, y: 0 },
        ],
        { health: 16 }
      );

      const snake2 = createSnake(
        [
          { x: 4, y: 3 },
          { x: 3, y: 3 },
          { x: 2, y: 3 },
        ],
        { health: 16 }
      );
      const gameState = createGameState(
        createBoard(5, [], [me, snake2]),
        me,
        1,
        "standard"
      );
      const state = resolveTurn(gameState);
      console.log(JSON.stringify(state, null, 2));
      const score = minmax(state, state.you.head, 2, -Infinity, Infinity, true);
      expect(score.score).toBe(Infinity);
    });
  });
});
