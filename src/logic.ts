import { InfoResponse, GameState, MoveResponse, Game, Coord } from "./types";
import { aStar, manhattanDistance, areCoordsEqual, prop } from "./a-star";
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

const getPossibleMoves = ({ you, board, game }: GameState): Move[] =>
  [
    { x: you.head.x - 1, y: you.head.y, dir: "left" },
    { x: you.head.x + 1, y: you.head.y, dir: "right" },
    { x: you.head.x, y: you.head.y - 1, dir: "down" },
    { x: you.head.x, y: you.head.y + 1, dir: "up" },
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
  const possibleMoves = getPossibleMoves(state);
  const safeMove = possibleMoves.find((m) => m.x === move.x && m.y === move.y);

  if (!safeMove) {
    logger.info(`${move.x},${move.y} not safe, going left`);
    return "left";
  }

  return safeMove.dir;
};

const bumpers = (move: Coord, possibleMoves: Move[], { board }: GameState) => {
  const snakes = board.snakes.flatMap(prop("body"));
  const safeMoves = possibleMoves.filter(
    (m) => !snakes.some((sb) => areCoordsEqual(m, sb))
  );

  const isSelectedMoveSafe = safeMoves.some((sm) => areCoordsEqual(sm, move));
  if (!isSelectedMoveSafe) {
    logger.info(
      `bumpers: selected move ${move.x},${move.y} is unsafe, randomly selecting a move`
    );
    const randomSafeMove =
      safeMoves[Math.floor(Math.random() * safeMoves.length)];
    if (randomSafeMove) {
      logger.info(
        `bumpers: found random safe move ${randomSafeMove.x},${randomSafeMove.y}`
      );
      return randomSafeMove;
    }

    logger.info("bumpers: no safe moves available");
  }

  logger.info("bumpers: returning original move");
  return move;
};

const calculateMove = (state: GameState) => {
  const foods = state.board.food
    .map((f) => ({
      x: f.x,
      y: f.y,
      distance: manhattanDistance(state.you.head, f),
    }))
    .sort((a, b) => a.distance - b.distance);

  for (const food of foods) {
    const [move] = aStar(state, food);

    if (areCoordsEqual(move.coords, state.you.head)) {
      logger.info(`food at ${move.id} unreachable`);
      continue;
    }

    const safeMove = bumpers(move.coords, getPossibleMoves(state), state);
    const response: MoveResponse = {
      move: getMove(safeMove, state),
    };

    logger.info(`${state.game.id} MOVE ${state.turn}: ${response.move}`);
    return response;
  }

  return { move: "left" };
};
