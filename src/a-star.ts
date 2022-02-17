//  make an openlist containing only the starting node
//   make an empty closed list
//   while (the destination node has not been reached):
//       consider the node with the lowest f score in the open list
//       if (this node is our destination node) :
//           we are finished
//       if not:
//           put the current node in the closed list and look at all of its neighbors
//           for (each neighbor of the current node):
//               if (neighbor has lower g value than current and is in the closed list) :
//                   replace the neighbor with the new, lower, g value
//                   current node is now the neighbor's parent
//               else if (current g value is lower and this neighbor is in the open list ) :
//                   replace the neighbor with the new, lower, g value
//                   change the neighbor's parent to our current node
//
//               else if this neighbor is not in both lists:
//                   add it to the open list and set its g
import { GameState, Coord, Battlesnake } from "./types";

const logStep = (text: string, thing: any) => {
  if (process.env.LOG_LEVEL === "debug") {
    console.log(text);
    if (thing) {
      console.log(thing);
    }
  }
};

export const aStar = (
  gameState: GameState,
  goal: Coord,
  h: Function = heuristics
) => {
  console.log("start");
  const goalSpace = createSpace(goal, gameState);
  const start = createSpace(gameState.you.head, gameState);

  logStep("goal", goalSpace);
  logStep("start", start);

  const openSet: { [index: string]: Space } = {}; // TODO: make this a map or min-heap
  openSet[start.id] = start;

  const cameFrom: { [index: string]: Space } = {};

  const gScore: { [index: string]: number } = {};
  gScore[start.id] = 0;

  const fScore: { [index: string]: number } = {};
  fScore[start.id] = h(start, start, gameState);

  console.log("entering loop");
  while (Object.keys(openSet).length > 0) {
    logStep("current openSet", openSet);
    logStep("f scores:", fScore);
    logStep("g scores:", gScore);
    const [[currentId, current]] = Object.entries(openSet).sort(
      ([, aval], [, bval]) => fScore[aval.id] - fScore[bval.id]
    );
    logStep("current id:", currentId);
    logStep("current", current);

    if (current.id === goalSpace.id) {
      logStep("found goal", current);
      return getMove(cameFrom, current, start);
    }

    delete openSet[currentId];

    for (const neighbor of getNeighbors(current, gameState)) {
      logStep(`looking at neighbor`, neighbor);

      const moveCost = gameState.board.hazards.some((c) =>
        areCoordsEqual(neighbor.coords, c)
      )
        ? 16
        : 1;

      const tentativeGScore = gScore[current.id] + moveCost; //manhattanDistance(current.coords, neighbor.coords);
      logStep("tentative gScore", tentativeGScore);

      const neighborGScore = gScore[neighbor.id] ?? Infinity;
      logStep("neighborGScore", neighborGScore);
      if (tentativeGScore < neighborGScore) {
        cameFrom[neighbor.id] = current;
        gScore[neighbor.id] = tentativeGScore;
        fScore[neighbor.id] = tentativeGScore + h(current, neighbor, gameState);
        if (!(neighbor.id in openSet)) {
          logStep("adding to openSet", neighbor);
          openSet[neighbor.id] = neighbor;
        }
      }
    }
  }
  console.log("failed to find path");
  return [start];
};

const getMove = (
  cameFrom: { [index: string]: Space },
  current: Space,
  start: Space
): Space[] => {
  if (cameFrom[current.id].id === start.id) {
    return [current];
  }

  return [...getMove(cameFrom, cameFrom[current.id], start), current];
};

export const manhattanDistance = (a: Coord, b: Coord): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const doesExistOnCoord = (space: Coord, coords: Coord[]): boolean =>
  coords.some((val) => val.x === space.x && val.y === space.y);

const getNeighbors = (space: Space, gameState: GameState): Space[] => {
  const spaceCoords = space.coords;
  const neighbors = [
    { x: spaceCoords.x - 1, y: spaceCoords.y },
    { x: spaceCoords.x + 1, y: spaceCoords.y },
    { x: spaceCoords.x, y: spaceCoords.y - 1 },
    { x: spaceCoords.x, y: spaceCoords.y + 1 },
  ];

  const largerSnakes = gameState.board.snakes.filter(
    (s) => s.length >= gameState.you.length
  );
  //const largerSnakeHeads = largerSnakes.map(prop("head"));
  const legalNeighbors = neighbors
    .map(fixWrappedMoves(gameState))
    .filter(isLegalMove(gameState));
  //.filter((n) => !isSnake(n, [gameState.you]));
  return legalNeighbors.map((n) => createSpace(n, gameState));
};

const isLegalMove = (state: GameState) => ({ x, y }: Coord) =>
  x >= 0 && x < state.board.width && y >= 0 && y < state.board.height;

export const fixWrappedMoves = (state: GameState) => ({
  x,
  y,
}: Coord): Coord => {
  if (state.game.ruleset.name === "wrapped") {
    return { x: x % state.board.width, y: y % state.board.height };
  }
  return { x, y };
};

interface Space {
  id: string;
  hasFood: boolean;
  hasSnake: boolean;
  hasSnakeHead: boolean;
  coords: Coord;
}

const isNeighborOf = (coord: Coord) => (maybeNeighbor: Coord) =>
  Math.abs(coord.x - maybeNeighbor.x) + Math.abs(coord.y - maybeNeighbor.y) ===
  1;

const createSpace = (space: Coord, gameState: GameState): Space => {
  return {
    id: `${space.x}${space.y}`,
    coords: space,
    hasFood: isFood(space, gameState),
    hasSnake: isSnake(space, gameState.board.snakes),
    hasSnakeHead: isSnakeHead(space, gameState),
  };
};

const isSnake = (coords: Coord, snakes: Battlesnake[]): boolean =>
  doesExistOnCoord(
    coords,
    snakes.flatMap((s) => s.body)
  );
const isSnakeHead = (coords: Coord, gameState: GameState): boolean =>
  doesExistOnCoord(
    coords,
    gameState.board.snakes.flatMap((s) => s.head)
  );
const isFood = (coords: Coord, gameState: GameState): boolean =>
  doesExistOnCoord(coords, gameState.board.food);

const snakeLength = (
  coords: Coord,
  gameState: GameState
): number | undefined => {
  const snake = gameState.board.snakes.find(
    (s) => s.head.x === coords.x && s.head.y === coords.y
  );
  return snake ? snake.length : undefined;
};

export const prop = <T, K extends keyof T>(key: K) => (obj: T) => obj[key];
export const areCoordsEqual = (a: Coord, b: Coord) =>
  a.x === b.x && a.y === b.y;

const heuristics = (
  current: Space,
  neighbor: Space,
  gameState: GameState
): number => {
  const you = gameState.you;
  const snakes = gameState.board.snakes.flatMap(prop("body"));
  const snakeheads = gameState.board.snakes
    .map(prop("head"))
    .filter((h) => !areCoordsEqual(h, you.head));
  const coord = neighbor.coords;
  let total = 0;

  const deathCost = 1000;
  if (snakes.some((s) => s.x === coord.x && s.y === coord.y)) {
    total += deathCost;
  }

  const possibleSnakes = snakeheads
    .filter(isNeighborOf(coord))
    .map((h) => snakeLength(h, gameState));
  const possibleSnakeKills = possibleSnakes.filter(
    (sl) => sl && sl < you.length
  );
  const possibleSnakeDeaths = possibleSnakes.filter(
    (sl) => sl && sl >= you.length
  );

  if (possibleSnakeKills.length > 0) {
    total += -100;
  }
  if (possibleSnakeDeaths.length > 0) {
    total += deathCost; // only a possible move for the enemy snake, so don't want Infinity
  }

  //total += manhattanDistance(current.coords, neighbor.coords);
  //console.log(`${neighbor.id} is h ${total}`);
  return total;
};
