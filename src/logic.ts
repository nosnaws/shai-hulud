import { InfoResponse, GameState, MoveResponse, Game, Coord } from "./types";
import { aStar, manhattanDistance, areCoordsEqual } from "./a-star";

export function info(): InfoResponse {
  console.log("INFO");
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
  console.log(`${gameState.game.id} START`);
}

export function end(gameState: GameState): void {
  console.log(`${gameState.game.id} END\n`);
}

export function move(gameState: GameState): MoveResponse {
  let possibleMoves: { [key: string]: string } = {
    up: "up",
    down: "down",
    left: "left",
    right: "right",
  };

  const getMove = (move: Coord, gameState: GameState) => {
    const head = gameState.you.head;

    // head: x: 7, y: 10
    // move: x: 7, y: 0
    const possibleMoves = [
      { x: head.x - 1, y: head.y, dir: "left" },
      { x: head.x + 1, y: head.y, dir: "right" },
      { x: head.x, y: head.y - 1, dir: "down" },
      { x: head.x, y: head.y + 1, dir: "up" },
    ].map((m) => {
      const gameMode = gameState.game.ruleset.name;
      const width = gameState.board.width;
      const height = gameState.board.height;

      if (gameMode === "wrapped") {
        return { x: m.x % width, y: m.y % height, dir: m.dir };
      }
      return m;
    });

    const safeMove = possibleMoves.find(
      (m) => m.x === move.x && m.y === move.y
    );

    if (!safeMove) {
      console.log("move not found, going left");
      return "left";
    }

    return safeMove.dir;
  };

  const safeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key]
  );
  //const response: MoveResponse = {
  //move: safeMoves[Math.floor(Math.random() * safeMoves.length)],
  //}

  const foods = gameState.board.food
    .map((f) => ({
      x: f.x,
      y: f.y,
      distance: manhattanDistance(gameState.you.head, f),
    }))
    .sort((a, b) => a.distance - b.distance);

  for (const food of foods) {
    const [move] = aStar(gameState, food);

    if (areCoordsEqual(move.coords, gameState.you.head)) {
      console.log(`food at ${move.id} unreachable`);
      continue;
    }
    const response: MoveResponse = {
      move: getMove(move.coords, gameState),
    };

    console.log(
      `${gameState.game.id} MOVE ${gameState.turn}: ${response.move}`
    );
    return response;
  }

  return { move: "left" };
}
