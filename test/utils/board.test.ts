import { createGrid, BFS, getNeighbors, getMoves } from "../../src/utils/board";
import { createBoard, createSnake } from "../utils";

describe("utils/board", () => {
  describe("createBoard", () => {
    it("generates 0x0 grid", () => {
      const grid = createGrid(createBoard(0));
      expect(grid.length).toBe(0);
    });

    it("generates 4x4 grid", () => {
      const grid = createGrid(createBoard(4));
      expect(grid.length).toBe(4);
      expect(grid[0].length).toBe(4);
    });
    it("generates grid with food", () => {
      const grid = createGrid(createBoard(4, [{ x: 0, y: 0 }]));
      const foodTile = grid[0][0];
      expect(foodTile.hasFood).toBe(true);
    });
  });

  describe("BFS", () => {
    it("finds shortest path in simple space", () => {
      const head = { x: 2, y: 0 };
      const goal = { x: 2, y: 4 };
      const grid = createGrid(createBoard(5, [goal]));
      const path = BFS(grid, head, goal);
      expect(path).toHaveLength(5);
      expect(path[0].coord).toEqual(head);
      expect(path[4].coord).toEqual(goal);
    });

    it("finds shortest path with enemy snake", () => {
      const head = { x: 2, y: 0 };
      const goal = { x: 2, y: 4 };
      const snake = [
        { x: 3, y: 3 },
        { x: 2, y: 3 },
      ];
      const enemySnake = createSnake(snake);
      const grid = createGrid(createBoard(5, [goal], [enemySnake]));
      const path = BFS(grid, head, goal);

      path.forEach((node) => {
        expect(node.coord).not.toEqual({ x: 3, y: 3 });
      });
    });
  });

  describe("getMove", () => {
    it("won't move backward", () => {
      // _ _ _
      // _ _ h
      // _ _ s

      const snake = createSnake([
        { x: 2, y: 1 },
        { x: 2, y: 0 },
      ]);

      const grid = createGrid(createBoard(3, [], [snake]));
      const neighbors = getMoves(grid, snake.body, false);
      expect(neighbors).toHaveLength(2);
      expect(neighbors[0].coord).toEqual({ x: 2, y: 2 });
      expect(neighbors[1].coord).toEqual({ x: 1, y: 1 });
    });
  });

  describe("getNeighbors", () => {
    it("returns values on grid", () => {
      const grid = createGrid(createBoard(3));
      const neigbors = getNeighbors(grid)({ x: 0, y: 0 });
      expect(neigbors).toHaveLength(2);
      expect(neigbors[0].coord).toEqual({ x: 0, y: 1 });
      expect(neigbors[1].coord).toEqual({ x: 1, y: 0 });
    });
    it("returns nothing for out of bounds coord", () => {
      const grid = createGrid(createBoard(3));
      const neigbors = getNeighbors(grid)({ x: 10, y: -10 });
      expect(neigbors).toHaveLength(0);
    });
    it("does not return options with snakes", () => {
      const snake = createSnake([
        { x: 0, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ]);
      const grid = createGrid(createBoard(3, [], [snake]));
      const neigbors = getNeighbors(grid)({ x: 0, y: 0 });
      expect(neigbors).toHaveLength(1);
      expect(neigbors[0].coord).toEqual({ x: 1, y: 0 });
    });

    it("ignores tail space", () => {
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ s s s _ _ _ _ _
      // _ _ _ s _ h _ _ _ _ _
      // _ _ _ s s s _ _ _ _ _

      const snake = createSnake([
        { x: 5, y: 1 },
        { x: 5, y: 0 },
        { x: 4, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
      ]);

      const grid = createGrid(createBoard(11, [], [snake]));
      const neighbors = getNeighbors(grid)({ x: 5, y: 1 });
      expect(neighbors).toHaveLength(3);
      expect(neighbors[0].coord).toEqual({ x: 5, y: 2 });
      expect(neighbors[1].coord).toEqual({ x: 6, y: 1 });
      expect(neighbors[2].coord).toEqual({ x: 4, y: 1 });
    });

    it("does not return occupied space", () => {
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ _ _ _ _ _ _ _ _
      // _ _ _ s s s s _ _ _ _
      // _ _ _ s _ h _ _ _ _ _
      // _ _ _ s s s _ _ _ _ _

      const snake = createSnake([
        { x: 5, y: 1 },
        { x: 5, y: 0 },
        { x: 4, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 5, y: 2 },
        { x: 6, y: 2 },
      ]);

      const grid = createGrid(createBoard(11, [], [snake]));
      const neighbors = getNeighbors(grid)({ x: 5, y: 1 });
      expect(neighbors).toHaveLength(2);
      expect(neighbors[0].coord).toEqual({ x: 6, y: 1 });
      expect(neighbors[1].coord).toEqual({ x: 4, y: 1 });
    });
  });
});
