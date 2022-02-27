import { Battlesnake, Board, Coord, Ruleset } from "../types";
import { log, prop } from "./general";
import { createQueue } from "./queue";

export interface Node {
  coord: Coord;
  hasFood: boolean;
  hasSnake: boolean;
  hasHazard: boolean;
  hasSnakeTail: boolean;
  snake: Battlesnake | undefined;
}

export type Grid = Node[][];

export const createGrid = ({
  snakes,
  food,
  hazards,
  height,
  width,
}: Board): Grid => {
  const snakeTails = snakes.map(prop("body")).flatMap((b) => b.slice(-1));
  const isFood = isInArray(food);
  const isSnakeTail = isInArray(snakeTails);
  const isSnake = isInArray(snakes.flatMap(prop("body")));
  const getSnake = (bodyPart: Coord) =>
    snakes.find((s) => s.body.some(isCoordEqual(bodyPart)));
  const isHazard = isInArray(hazards);

  const grid: Grid = [];
  for (let i = 0; i < height; i++) {
    grid[i] = [];
    for (let j = 0; j < width; j++) {
      const coord = { x: j, y: i };
      grid[i][j] = {
        coord,
        hasFood: isFood(coord),
        hasSnake: isSnake(coord),
        hasHazard: isHazard(coord),
        hasSnakeTail: isSnakeTail(coord),
        snake: getSnake(coord),
      };
    }
  }

  return grid;
};

export const BFS = (
  grid: Grid,
  root: Coord,
  goal: Coord,
  isWrapped = false
): Node[] => {
  const getEdges = getNeighbors(grid, isWrapped);
  const rootNode = grid[root.y][root.x];
  const queue = createQueue([rootNode]);
  const visited: { [key: string]: Node } = {};
  const visitedSet = new Set([nodeId(rootNode)]);

  while (queue.size() > 0) {
    const current = queue.dequeue();
    if (isCoordEqual(current.coord)(goal)) {
      return getPath(current, visited);
    }

    const edgeNodes = getEdges(current.coord);
    const len = edgeNodes.length;
    for (let i = 0; i < len; i++) {
      const edgeNode = edgeNodes[i];
      const edgeId = nodeId(edgeNode);
      if (!visitedSet.has(edgeId)) {
        visited[edgeId] = current;
        visitedSet.add(edgeId);
        queue.enqueue(edgeNode);
      }
    }
  }
  return [];
};

const getPath = (current: Node, visited: { [key: string]: Node }): Node[] => {
  const path = [];
  let node = current;
  while (node !== undefined) {
    path.push(node);
    node = visited[nodeId(node)];
  }

  return path.reverse();
};

export const getAllPossibleMoves = (
  grid: Grid,
  roots: Coord[],
  isWrapped: boolean
): Node[] => roots.flatMap(getNeighbors(grid, isWrapped));

export const getMoves = (
  grid: Grid,
  body: Coord[],
  isWrapped: boolean
): Node[] => {
  //const [head, neck] = body;
  //const neighbors = getNeighbors(grid, isWrapped)(head);
  //return neighbors.filter((n) => !isCoordEqual(neck)(n.coord)); // filter out neck, so going backwards isn't an option
  return getNeighbors(grid, isWrapped)(body[0]);
};

export const getNeighbors = (grid: Grid, isWrapped: boolean = false) => ({
  x,
  y,
}: Coord): Node[] => {
  let neighbors = [
    { x, y: y + 1 }, // up
    { x: x + 1, y }, // right
    { x, y: y - 1 }, // down
    { x: x - 1, y }, // left
  ];

  if (isWrapped) {
    neighbors = adjustForWrapped(neighbors, grid.length, grid[0].length);
  }

  return neighbors
    .filter(isCoordInBounds(grid))
    .map(({ x, y }) => grid[y][x])
    .filter(
      (n) =>
        !n.hasSnake ||
        (n.hasSnakeTail && n.snake && !hasDuplicates(n.snake.body))
    );
};

export const adjustForWrapped = (
  coords: Coord[],
  height: number,
  width: number
): Coord[] =>
  coords
    .map(({ x, y }) => ({
      x: x % width,
      y: y % height,
    }))
    .map(({ x, y }) => {
      if (x < 0) {
        x = width - 1;
      }
      if (y < 0) {
        y = height - 1;
      }
      return { x, y };
    });

export const isInArray = (coords: Coord[]) => (l: Coord): boolean =>
  coords.some(isCoordEqual(l));

export const isCoordEqual = (a: Coord) => (b: Coord) =>
  a.x === b.x && a.y === b.y;

export const isCoordInBounds = (grid: Grid) => (b: Coord) =>
  b.y >= 0 && b.y < grid.length && b.x >= 0 && b.x < grid[0].length;

const nodeId = (node: Node): string => `${node.coord.x}${node.coord.y}`;

export const hasDuplicates = (coords: Coord[]): boolean => {
  if (coords.length < 2) {
    return false;
  }

  let current = coords[0];
  const len = coords.length;
  for (let i = 1; i < len; i++) {
    const next = coords[i];
    if (isCoordEqual(current)(next)) {
      return true;
    }
    current = next;
  }

  return false;
};

export const printGrid = (grid: Grid) => {
  const nodeChar = " _ ";
  const snakeChar = " s ";
  const headChar = " h ";
  const foodChar = " f ";
  const hazardChar = " x ";

  const getCharForNode = (node: Node) => {
    const isEqual = isCoordEqual(node.coord);
    if (node.snake && isEqual(node.snake.head)) {
      return ` ${node.snake.name[0]} `;
    }
    if (node.hasSnake) {
      return snakeChar;
    }
    if (node.hasFood) {
      return foodChar;
    }
    if (node.hasHazard) {
      return hazardChar;
    }

    return nodeChar;
  };

  const rowStrings = grid
    .map((row) => row.map(getCharForNode).join("|"))
    .reverse();

  console.dir(rowStrings);
};
