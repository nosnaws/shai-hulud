import { InfoResponse, GameState, MoveResponse, Game, Coord } from "./types";
import {
  aStar,
  manhattanDistance,
  areCoordsEqual,
  prop,
  createSpace,
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

export function move(gameState: GameState): MoveResponse {
  logger.info(`${gameState.game.id} MOVE`);
  return calculateMove(gameState);
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
  const possibleMoves = getPossibleMoves(state.you.head, state);
  const safeMove = possibleMoves.find((m) => m.x === move.x && m.y === move.y);

  if (!safeMove) {
    logger.info(`${move.x},${move.y} not safe, going left`);
    return "left";
  }

  return safeMove.dir;
};

const getRandomSafeMove = (coord: Coord, state: GameState) =>
  getPossibleMoves(coord, state)
    .map((m) => createSpace(m, state))
    .filter((s) => !s.hasSnake && !s.isPossibleLargerSnakeHead);

const calculateMove = (state: GameState): MoveResponse => {
  const head = state.you.head;
  const foods = state.board.food
    .map((f) => ({
      x: f.x,
      y: f.y,
      distance: manhattanDistance(head, f),
    }))
    .sort((a, b) => a.distance - b.distance);

  for (const food of foods) {
    const [move] = aStar(state, food);

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
        `${move.coords.x},${move.coords.y} potential larger snake move`
      );

      if (Math.random() < 0.8) {
        logger.info(`ignoring ${move.coords.x},${move.coords.y}`);
        continue;
      } else {
        // TODO: probably want to consider all paths before risking a potential collision
        logger.info(
          `selected ${move.coords.x},${move.coords.y} risking it for the biscuit`
        );
      }
    }

    const response: MoveResponse = {
      move: getMove(move.coords, state),
    };

    logger.info(`${state.game.id} MOVE ${state.turn}: ${response.move}`);
    return response;
  }

  const [randomMove] = getRandomSafeMove(head, state);
  if (randomMove) {
    logger.info(
      `no usable moves from pathfinding, randomly selected ${randomMove.coords.x},${randomMove.coords.y}`
    );
    return { move: getMove(randomMove.coords, state) };
  }

  logger.info(`no safe moves, going left`);
  return { move: "left" };
};
