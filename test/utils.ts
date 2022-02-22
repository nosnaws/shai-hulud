import { v4 as uuid } from "uuid";
import { Coord, Battlesnake, Board, GameState, Game } from "../src/types";

export const createGameState = (board: Board, you: Battlesnake): GameState => {
  return {
    board,
    you,
    game: createGame(),
    turn: 1,
  };
};

export const createBoard = (
  size: number,
  food: Coord[] = [],
  snakes: Battlesnake[] = []
): Board => {
  return {
    height: size,
    width: size,
    food: food,
    snakes,
    hazards: [],
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

const createGame = (): Game => {
  return {
    id: uuid(),
    ruleset: { name: "standard", version: "0.1" },
    timeout: 500,
  };
};