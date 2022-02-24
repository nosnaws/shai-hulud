import { v4 as uuid } from "uuid";
import { Battlesnake, Board, Coord, GameState, Game, Ruleset } from "../types";
import { isCoordEqual } from "./board";
import { placeFoodAutomatically } from "./food_spawning";
import { prop } from "./general";

export interface GameStateSim extends GameState {
  pendingMoves: { snake: Battlesnake; move: Coord }[] | undefined;
}

export const resolveTurn = (gs: GameStateSim): GameStateSim => {
  const time = Date.now();
  const ns = cloneGameState(gs);
  // apply moves
  //
  if (Array.isArray(ns.pendingMoves)) {
    for (const pm of ns.pendingMoves) {
      makeMove(ns, pm.snake, pm.move);
    }
  }
  // remove tails and reduce health
  ns.board.snakes = ns.board.snakes.map((s) => {
    const isHazard = ns.board.hazards.some(isCoordEqual(s.head));
    const turnDamage = isHazard ? 16 : 1;
    return {
      ...s,
      health: s.health - turnDamage,
      body: s.body.slice(0, -1),
    };
  });

  // handle food spawning
  //placeFoodAutomatically(ns);

  // detect eliminations
  let snakesLeft = ns.board.snakes.filter((s) => s.health > 0);
  // remove out of bounds snakes
  snakesLeft = snakesLeft.filter(
    (s) =>
      !s.body.some(
        (b) =>
          b.x > ns.board.width - 1 ||
          b.x < 0 ||
          b.y > ns.board.height - 1 ||
          b.y < 0
      )
  );

  // snakes that ate themselves
  snakesLeft = snakesLeft.filter((s) => {
    const [head, ...body] = s.body;

    if (body.some((b) => isCoordEqual(b)(head))) {
      return false;
    }
    return true;
  });

  // collided with another snake
  const snakeBodies = ns.board.snakes
    .map(prop("body"))
    .flatMap(([h, ...b]) => b); // removing heads for later
  snakesLeft = snakesLeft.filter(
    (s) => !snakeBodies.some(isCoordEqual(s.head))
  );

  // collided head to head and lost
  snakesLeft = snakesLeft.filter((s) => {
    const collisions = snakesLeft.filter((sb) => isCoordEqual(s.head)(sb.head));
    if (collisions.length > 1) {
      return collisions.some((c) => s.length > c.length);
    }
    return true;
  });
  ns.board.snakes = snakesLeft;

  // consume food
  for (const s of ns.board.snakes) {
    const isSnakeHead = isCoordEqual(s.head);
    if (ns.board.food.find(isSnakeHead)) {
      s.body = [...s.body, s.body[s.body.length - 1]]; // add body segment to end since the snake ate
      s.health = 100;
      ns.board.food = ns.board.food.filter(isSnakeHead);
    }
  }

  const updatedYou = ns.board.snakes.find((s) => s.id === ns.you.id);
  if (updatedYou) {
    ns.you = updatedYou;
  }

  console.log(`resolveTurn time ${Date.now() - time}`);
  return ns;
};

export const addMove = (
  gs: GameStateSim,
  snake: Battlesnake,
  move: Coord
): void => {
  if (!gs.pendingMoves) {
    gs.pendingMoves = [];
  }
  gs.pendingMoves.push({ snake, move });
};

export const makeMove = (
  gs: GameStateSim,
  snake: Battlesnake,
  move: Coord
): void => {
  const newSnake = cloneSnake({
    ...snake,
    head: move,
    body: [move, ...snake.body],
  });
  const otherSnakes = gs.board.snakes.filter((s) => s.id !== snake.id);
  if (gs.you.id === newSnake.id) {
    gs.you = newSnake;
  }

  gs.board.snakes = [newSnake, ...otherSnakes];
};

export const didWeWinBoys = (gs: GameStateSim, you: Battlesnake): boolean => {
  if (gs.board.snakes.length === 1 && gs.game.ruleset.name !== "solo") {
    const [lastSnake] = gs.board.snakes;
    if (lastSnake?.id === you.id) {
      return true;
    }
  }

  return false;
};

export const didWeLoseSadBoys = (
  gs: GameStateSim,
  you: Battlesnake
): boolean => {
  return !gs.board.snakes.some((s) => s.id === you.id);
};

export const isGameOver = (gs: GameStateSim): boolean =>
  (gs.board.snakes.length === 1 && gs.game.ruleset.name !== "solo") ||
  gs.board.snakes.length < 1;

export const cloneGameState = (gs: GameStateSim): GameStateSim => {
  const { you, game, turn, board } = gs;
  const clonedState: GameStateSim = {
    you: cloneSnake(you),
    turn,
    board: cloneBoard(board),
    game: cloneGame(game),
    pendingMoves: gs.pendingMoves ? clonePendingMoves(gs.pendingMoves) : [],
  };

  return clonedState;
};

const clonePendingMoves = (
  possibleMoves: { snake: Battlesnake; move: Coord }[]
) => {
  return possibleMoves.map((pm) => ({
    snake: cloneSnake(pm.snake),
    move: pm.move,
  }));
};

const cloneGame = ({ id, ruleset, timeout }: Game): Game => {
  return {
    id,
    ruleset: cloneRuleset(ruleset),
    timeout,
  };
};

const cloneRuleset = ({ name, version, settings }: Ruleset): Ruleset => {
  return {
    name,
    version,
    settings,
  };
};

const cloneSnake = ({
  head,
  body,
  id = uuid(),
  name = "defaultName",
  health = 100,
  latency = "0",
  length,
  squad = "",
}: Battlesnake): Battlesnake => {
  return {
    head,
    body: [...body],
    id,
    name,
    health,
    latency,
    length,
    squad,
    shout: "",
  };
};

const cloneBoard = ({
  height,
  width,
  food = [],
  snakes = [],
  hazards = [],
}: Board): Board => {
  return {
    height,
    width,
    food: [...food],
    snakes: snakes.map(cloneSnake),
    hazards: [...hazards],
  };
};

const defaultSnake = (body: Coord[]): Battlesnake => {
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
  };
};
