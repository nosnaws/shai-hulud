import { InfoResponse, GameState, MoveResponse, Coord, Board } from "./types";
import getLogger from "./logger";
import { isCoordEqual } from "./utils/board";

import { determineMove } from "./lookahead_snake";
import { log } from "./utils/general";

const logger = getLogger();
export function info(): InfoResponse {
  const response: InfoResponse = {
    apiversion: "1",
    author: "nosnaws",
    color: "#e3a86d",
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

  const moveCoord = determineMove(state, 5);
  const moveRes = getMoveResponse(moveCoord, state);
  logger.info(`${state.game.id} MOVE ${state.turn}: ${moveRes.move}`);
  return moveRes;
}

const getMoveResponse = (location: Coord, state: GameState): MoveResponse => {
  const width = state.board.width;
  const height = state.board.height;
  const you = state.you;
  const neighbors = [
    { x: you.head.x - 1, y: you.head.y, dir: "left" },
    { x: you.head.x + 1, y: you.head.y, dir: "right" },
    { x: you.head.x, y: you.head.y - 1, dir: "down" },
    { x: you.head.x, y: you.head.y + 1, dir: "up" },
  ]
    .map(({ x, y, dir }) => ({
      x: x % width,
      y: y % height,
      dir,
    }))
    .map(({ x, y, dir }) => {
      if (x < 0) {
        x = width - 1;
      }
      if (y < 0) {
        y = height - 1;
      }
      return { x, y, dir };
    });

  if (location) {
    log(neighbors);
    const [move] = neighbors.filter(isCoordEqual(location));

    if (move) {
      return { move: move.dir };
    }
  }
  logger.info("no move, going left");
  return { move: "left" };
};

//interface Move extends Coord {
//dir: string;
//}

//const getPossibleMoves = (location: Coord, { height, width }: Board): Move[] =>
//[
//{ x: location.x - 1, y: location.y, dir: "left" },
//{ x: location.x + 1, y: location.y, dir: "right" },
//{ x: location.x, y: location.y - 1, dir: "down" },
//{ x: location.x, y: location.y + 1, dir: "up" },
//].map(({ x, y, dir }) => {
//if (x < 0) {
//x =
//}

//}({ x: x % width, y: y % height, dir }));
