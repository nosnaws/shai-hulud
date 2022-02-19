import { InfoResponse, GameState, MoveResponse, Game, Coord } from "./types";
import {
  aStar,
  manhattanDistance,
  areCoordsEqual,
  prop,
  createSpace,
  Space,
} from "./a-star";
import getLogger from "./logger";

const logger = getLogger();
export function info(): InfoResponse {
  const response: InfoResponse = {
    apiversion: "1",
    author: "",
    color: "#204f22",
    head: "sand-worm",
    tail: "bolt",
  };
  return response;
}

export function start(gameState: GameState): void {
  logger.info(`${gameState.game.id} START`);
}

export function end(gameState: GameState): void {
  logger.info(`${gameState.game.id} END`);
}

export function move(state: GameState): MoveResponse {
  logger.info(`${state.game.id} MOVE`);
  const moveRes = calculateMove(state);
  logger.info(`${state.game.id} MOVE ${state.turn}: ${moveRes.move}`);
  return moveRes;
}

interface Move extends Coord {
  dir: string;
}

const getPossibleMoves = (
  location: Coord,
  { board, game }: GameState
): Move[] =>
  [
    { x: location.x - 1, y: location.y, dir: "left" },
    { x: location.x + 1, y: location.y, dir: "right" },
    { x: location.x, y: location.y - 1, dir: "down" },
    { x: location.x, y: location.y + 1, dir: "up" },
  ]
    .map((m) => {
      const gameMode = game.ruleset.name;
      const width = board.width;
      const height = board.height;

      if (gameMode === "wrapped") {
        return { x: m.x % width, y: m.y % height, dir: m.dir };
      }
      return m;
    })
    .filter(
      (m) => m.x < board.width && m.y < board.height && m.x >= 0 && m.y >= 0
    );

const getMove = (move: Coord, state: GameState) => {
  if (move) {
    const possibleMoves = getPossibleMoves(state.you.head, state);
    const possibleMove = possibleMoves.find(
      (m) => m.x === move.x && m.y === move.y
    );

    if (possibleMove) {
      return possibleMove.dir;
    }
  }
  logger.info(`selected move not possible, going left`);

  return "left";
};

const shuffle = <T>(array: Array<T>): Array<T> =>
  array.sort(() => 0.5 - Math.random());

const getPossibleSpaces = (coord: Coord, state: GameState) =>
  getPossibleMoves(coord, state).map((m) => createSpace(m, state));

const getRandomSafeMove = (coord: Coord, state: GameState): Space[] =>
  shuffle(
    getPossibleSpaces(coord, state).filter(
      (s) => !s.hasSnake && !s.isPossibleLargerSnakeHead
    )
  );

const getRandomDesperateMove = (coord: Coord, state: GameState): Space[] =>
  shuffle(getPossibleSpaces(coord, state).filter((s) => !s.hasSnake));

const calculateMove = (state: GameState): MoveResponse => {
  const head = state.you.head;
  const length = state.you.length;
  const health = state.you.health;
  const muchSmallerSnakes = state.board.snakes
    .filter((s) => !areCoordsEqual(s.head, head))
    .filter((s) => s.length < length + 2);

  const isKillingTime =
    length > 10 && muchSmallerSnakes.length > 0 && health > 50;

  const addDistance = (f: Coord) => ({
    x: f.x,
    y: f.y,
    distance: manhattanDistance(head, f),
  });
  const distanceSort = (a: { distance: number }, b: { distance: number }) =>
    a.distance - b.distance;

  const foods = state.board.food.map(addDistance).sort(distanceSort);
  const smallerSnakeHeads = muchSmallerSnakes
    .map(prop("head"))
    .map(addDistance)
    .sort(distanceSort);

  let goals = foods;
  if (isKillingTime) {
    goals = [...smallerSnakeHeads, ...goals];
  }

  for (const goal of goals) {
    const [move] = aStar(state, goal);

    if (areCoordsEqual(move.coords, head)) {
      logger.info(`food at ${move.id} unreachable`);
      continue;
    }

    if (move.hasSnake) {
      logger.info(`${move.coords.x},${move.coords.y} has a snake, ignoring`);
      continue;
    }

    if (move.isPossibleLargerSnakeHead) {
      logger.info(
        `${move.coords.x},${move.coords.y} potential larger snake move, ignoring`
      );
      continue;
    }

    const response: MoveResponse = {
      move: getMove(move.coords, state),
    };

    return response;
  }
  logger.info(`no usable moves from pathfinding`);

  const [randomMove] = getRandomSafeMove(head, state);
  if (randomMove) {
    logger.info(`randomly selected safe move`);
    return { move: getMove(randomMove.coords, state) };
  }

  const [desperateMove] = getRandomDesperateMove(head, state);
  logger.info(`randomly selected desperate move`);

  return { move: getMove(desperateMove?.coords, state) };
};
