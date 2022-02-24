import { Battlesnake, Coord, GameState } from "./types";
import { prop } from "./utils/general";
import {
  BFS,
  Grid,
  Node,
  isCoordEqual,
  createGrid,
  getMoves,
} from "./utils/board";
import {
  cloneGameState,
  didWeLoseSadBoys,
  didWeWinBoys,
  GameStateSim,
  isGameOver,
  resolveTurn,
  addMove,
} from "./utils/game_sim";
import { createQueue } from "./utils/queue";

/**
 * Counts a node as 'owned' if a root can reach it before any other roots.
 * returns each root with the total number of owned nodes for that root.
 * Does not factor in moving backward (illegal in battlesnake), which may cause some issues with snakes of length 2.
 **/
export const voronoriCounts = (
  grid: Grid,
  roots: Coord[]
): { root: Coord; score: number }[] => {
  const height = grid.length;
  const width = grid[0].length;
  const scores = roots.map((root) => ({ root, score: 0 }));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const node = grid[y][x];
      if (node.hasSnake && !node.hasSnakeTail) {
        continue;
      }

      const pathsAsc = roots
        .map((r) => BFS(grid, r, node.coord))
        .filter((p) => p.length > 0)
        .sort((a, b) => a.length - b.length);
      const [p1, p2] = pathsAsc;

      if (!p1 || (p2 && p1.length === p2.length)) {
        // space unreachable or is unowned
        continue;
      }

      const isOwner = isCoordEqual(p1[0].coord);
      const ownerScore = scores.find((s) => isOwner(s.root));
      if (ownerScore) {
        ownerScore.score += 1;
      }
    }
  }

  return scores;
};

const nodeHeuristic = (
  grid: Grid,
  { board, you, game, turn }: GameState,
  node: Node
): number => {
  const time = Date.now();
  const isWrapped = game.ruleset.name === "wrapped";
  let total = 0;
  const snakes = board.snakes;
  const food = board.food;
  const isCurrent = isCoordEqual(node.coord);
  const enemySnakes = snakes.filter((s) => s.id !== you.id);
  const snakesWithMoves: {
    snake: Battlesnake;
    possibleMoves: Node[];
  }[] = enemySnakes.map((s) => ({
    snake: s,
    possibleMoves: getMoves(grid, s.body, isWrapped),
  }));
  const smallerSnakes = snakesWithMoves.filter(
    ({ snake }) => snake.length < you.length
  );
  const largerSnakes = snakesWithMoves.filter(
    ({ snake }) => snake.length >= you.length
  );
  const isPossibleKillMove =
    smallerSnakes
      .flatMap(prop("possibleMoves"))
      .map(prop("coord"))
      .filter(isCurrent).length > 0;

  const isPossibleDeathMove =
    largerSnakes
      .flatMap(prop("possibleMoves"))
      .map(prop("coord"))
      .filter(isCurrent).length > 0;

  if (node.hasFood) {
    total += 100;
  }

  if (isPossibleKillMove) {
    total += 1000;
  }

  if (isPossibleDeathMove) {
    total += -10000;
  }

  if (node.hasSnakeTail) {
    const s = findSnake(snakes, node.coord);
    if (s && didSnakeEat(s.body)) {
      total += -10000;
    }
  }

  // Factor in distance to food
  const orderedFood = food
    .map((f) => BFS(grid, node.coord, f))
    .sort((a, b) => a.length - b.length);
  const a = 60; // much hungrier in the beginning
  const b = turn < 60 ? 1 : 5;
  orderedFood.forEach((foodPath) => {
    // TODO: handle hazards when there isn't food, could also factor in the number of hazard spaces on the path
    const foodDistance = foodPath.length;
    total += Math.atan(you.health - foodDistance);
  });

  const voronoiScores = voronoriCounts(grid, [
    node.coord,
    ...enemySnakes.map(prop("head")),
  ]);
  const voronoiScore = voronoiScores.find((s) => isCurrent(s.root));

  if (voronoiScore) {
    total += voronoiScore.score * 1; // should be a hyper parameter
  }

  if (node.hasHazard) {
    total = total / 26;
  }

  return total;
};

const didSnakeEat = (body: Coord[]): boolean => {
  const last = body[body.length - 1];
  const secondToLast = body[body.length - 2];
  return last && secondToLast && isCoordEqual(last)(secondToLast);
};

const findSnake = (snakes: Battlesnake[], tail: Coord) =>
  snakes.find((s) => isCoordEqual(s.body[s.length - 1])(tail));

const minimax = (
  gs: GameStateSim,
  depth: number,
  maximizingPlayer: boolean,
  firstMove: Node | undefined = undefined
): number => {
  const time = Date.now();
  let ns = cloneGameState(gs);
  const grid = createGrid(ns.board);
  const isWrapped = ns.game.ruleset.name === "wrapped";

  if (isGameOver(ns)) {
    if (didWeWinBoys(ns, ns.you)) {
      return Infinity;
    }
    if (didWeLoseSadBoys(ns, ns.you)) {
      return -Infinity;
    }
  }

  if (depth < 1) {
    const h = nodeHeuristic(grid, ns, grid[ns.you.head.y][ns.you.head.x]);
    return h;
  }

  if (maximizingPlayer) {
    let value = -Infinity;

    if (firstMove) {
      const cloned = cloneGameState(ns);
      addMove(cloned, cloned.you, firstMove.coord);
      value = Math.max(value, minimax(cloned, depth - 1, false));
    } else {
      const moves = getMoves(grid, ns.you.body, isWrapped);
      if (moves.length > 0) {
        for (const move of getMoves(grid, ns.you.body, isWrapped)) {
          const cloned = cloneGameState(ns);
          addMove(cloned, cloned.you, move.coord);
          value = Math.max(value, minimax(cloned, depth - 1, false));
        }
      } else {
        const cloned = cloneGameState(ns);
        addMove(ns, ns.you, {
          x: ns.you.head.x - 1,
          y: ns.you.head.y,
        }); //no moves, go left

        value = Math.max(value, minimax(cloned, depth - 1, false));
      }
    }
    return value;
  } else {
    let value = Infinity;

    const clonedGS = cloneGameState(ns);
    const otherSnakes = clonedGS.board.snakes.filter(
      (s) => s.id !== clonedGS.you.id
    );

    // get all enemy snakes with their moves
    // put the moves for each snake in their own queue
    // loop i < 4 (max number of moves a snake can have)
    // loop through each snake, dequeue a move, and make that move
    // call minimax
    const snakesWithMoves = otherSnakes.map((snake) => ({
      snake,
      moves: createQueue(getMoves(grid, snake.body, isWrapped)),
    }));

    // current issue: possible moves are being determined after my snake has made its move
    // so any spot my snake moves is no longer considered a valid move when evaluating enemy snakes
    for (let i = 0; i < 4; i++) {
      const ns = cloneGameState(clonedGS);
      for (const sm of snakesWithMoves) {
        const move = sm.moves.dequeue();
        if (move) {
          addMove(ns, sm.snake, move.coord);
        } else {
          addMove(ns, sm.snake, {
            x: sm.snake.head.x - 1,
            y: sm.snake.head.y,
          }); //no moves, go left
        }
      }
      value = Math.min(value, minimax(resolveTurn(ns), depth - 1, true));
    }

    //for (const snake of otherSnakes) {
    //const moves = getMoves(grid, snake.body, isWrapped);
    //if (moves.length > 0) {
    //makeMove(clonedGS, snake, moves[0].coord);
    //console.log(`enemy move`, moves[0]);
    //} else {
    //const head = snake.head;
    //console.log(`enemy going left`);
    //makeMove(clonedGS, snake, { x: head.x - 1, y: head.y }); //no moves, go left
    //}
    //}

    return value;
  }
};

export const determineMove = (state: GameState): Coord => {
  const board = state.board;
  const you = state.you;
  const isWrapped = state.game.ruleset.name === "wrapped";
  const grid = createGrid(board);
  const possibleMoves = getMoves(grid, you.body, isWrapped);
  const ns = cloneGameState({ ...state, pendingMoves: [] });

  //const [bestMove, ...rest] = possibleMoves
  //.map((move) => ({ move, score: nodeHeuristic(grid, state, move) }))
  //.sort((a, b) => b.score - a.score);
  const time = Date.now();
  const [bestMove, ...rest] = possibleMoves
    .map((move) => {
      return { move, score: minimax(ns, 2, true, move) };
    })
    .sort((a, b) => b.score - a.score);

  return bestMove?.move.coord;
};
