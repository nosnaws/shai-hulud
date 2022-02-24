import { v4 as uuid } from "uuid";
import { Coord, Battlesnake, Board, Game } from "../src/types";
import { GameStateSim } from "../src/utils/game_sim";

export const createGameState = (
  board: Board,
  you: Battlesnake,
  turn = 1,
  mode = "standard"
): GameStateSim => {
  return {
    board,
    you,
    game: createGame(mode),
    turn,
    pendingMoves: [],
  };
};

export const createBoard = (
  size: number,
  food: Coord[] = [],
  snakes: Battlesnake[] = [],
  hazards: Coord[] = []
): Board => {
  return {
    height: size,
    width: size,
    food: food,
    snakes,
    hazards: hazards,
  };
};

export const createSnake = (
  body: Coord[],
  { ...overrides } = {}
): Battlesnake => {
  return {
    id: uuid(),
    name: "test",
    health: 100,
    body,
    latency: "0",
    head: body[0],
    length: body.length,
    shout: "",
    squad: "",
    ...overrides,
  };
};

const createGame = (mode = "standard"): Game => {
  return {
    id: uuid(),
    ruleset: { name: mode, version: "0.1" },
    timeout: 500,
  };
};
