import { Battlesnake, Coord, GameState } from "./types";
import { prop } from "./utils/general";
import {
  BFS,
  Grid,
  Node,
  isCoordEqual,
  createGrid,
  getMoves,
  getNeighbors,
  printGrid,
  hasDuplicates,
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

import { log } from "./utils/general";
import { createQueue, Queue } from "./utils/queue";

export const voronoi = (gs: GameStateSim): number => {
  interface Pair {
    snakeHead: Coord;
    coord: Coord;
  }

  const getId = (coord: Coord) => `${coord.x}${coord.y}`;
  let depth = 0;
  const counts: { [key: string]: number } = {};
  const DEPTH_MARK: Pair = {
    snakeHead: { x: -1, y: -1 },
    coord: { x: -1, y: -1 },
  };
  const MARK = -1;
  const q: Queue<Pair> = createQueue();
  const visited = new Map();
  const snakes = new Map();

  // get all snake heads
  // add them to a counts object
  // add them to visited set
  for (const snake of gs.board.snakes) {
    const snakeId = getId(snake.head);
    snakes.set(snakeId, snake);
    q.enqueue({ snakeHead: snake.head, coord: snake.head });
    visited.set(snakeId, snake.head);
  }
  q.enqueue(DEPTH_MARK);

  // while queue not empty
  while (q.size() > 0) {
    const pair = q.dequeue();

    if (pair === DEPTH_MARK) {
      //console.log("found depth mark");
      depth++;
      q.enqueue(DEPTH_MARK);
      if (q.front() === DEPTH_MARK) {
        //console.log("done");
        break; // we've reach the end
      }
    } else {
      const { snakeHead, coord } = pair;
      const snakeId = getId(snakeHead);

      for (const n of getNeighbors(gs.grid, gs.isWrapped)(coord)) {
        const currentId = getId(n.coord);
        if (visited.has(currentId)) {
          const other = visited.get(currentId);
          if (other !== MARK && !isCoordEqual(other)(snakeHead)) {
            const otherId = getId(other);
            if (!counts[otherId]) {
              counts[otherId] = 0;
            }
            counts[otherId]--;
            //console.log(
            //`subtracting count for coord:${currentId} snake:${otherId} total:${counts[otherId]}`
            //);
            visited.set(currentId, MARK);
          }
        } else {
          if (!counts[snakeId]) {
            counts[snakeId] = 0;
          }
          counts[snakeId]++;
          //console.log(
          //`adding count for coord:${currentId} snake:${snakeId} total:${counts[snakeId]}`
          //);

          visited.set(currentId, snakeHead);
          q.enqueue({ snakeHead, coord: n.coord });
        }
      }
    }
  }
  log(counts);
  return counts[getId(gs.you.head)] ?? 0;
  // if visited
  // get visited by
  // if not my snake
  // reduce count for snake
  // add visited mark
  // else
  // get neighbors
  // loop through neighbors
  // add to count
  // add to visited
  // add to queue
};

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

export const voronoriCountsCrowFlies = (
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
        .map((r) => ({
          root: r,
          distance: Math.sqrt(
            Math.pow(r.x - node.coord.x, 2) + Math.pow(r.y - node.coord.y, 2)
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
      const [p1, p2] = pathsAsc;

      const isOwner = isCoordEqual(p1.root);
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
  node: Node,
  runVoronoi: boolean = true
): number => {
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

  if (isPossibleKillMove) {
    total += 1000;
  }

  if (isPossibleDeathMove) {
    total += -10000;
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
    total += a * Math.atan(you.health - foodDistance / b);
  });

  if (runVoronoi) {
    const voronoiScores = voronoriCountsCrowFlies(grid, [
      node.coord,
      ...enemySnakes.map(prop("head")),
    ]);
    const voronoiScore = voronoiScores.find((s) => isCurrent(s.root));

    if (voronoiScore) {
      total += voronoiScore.score * 1; // should be a hyper parameter
    }
  }

  if (node.hasHazard) {
    total = total / 26;
  }

  return total;
};

const stateHeuristic = (gs: GameStateSim): number => {
  const { you, board, turn, grid } = gs;
  const headNode = grid[you.head.y][you.head.x];
  const otherSnakes = gs.board.snakes.filter((s) => s.id !== gs.you.id);

  let total = 0;
  const isHead = isCoordEqual(you.head);
  const snakesWithMoves: {
    snake: Battlesnake;
    possibleMoves: Node[];
  }[] = otherSnakes.map((s) => ({
    snake: s,
    possibleMoves: getMoves(grid, s.body, gs.isWrapped),
  }));

  if (didWeWinBoys(gs, you)) {
    printGrid(gs.grid);
    log("we win");
    return Infinity;
  }

  if (didWeLoseSadBoys(gs, you)) {
    printGrid(gs.grid);
    log("we lose");
    return -Infinity;
  }

  total += 10000 / board.snakes.length ?? 1;
  const foodPaths = board.food.map((f) => BFS(grid, you.head, f));
  const a = 40; // much hungrier in the beginning
  const b = 2;
  foodPaths.forEach((foodPath) => {
    // TODO: handle hazards when there isn't food, could also factor in the number of hazard spaces on the path
    const foodDistanceCost = headNode.hasHazard ? 16 : 1;
    total +=
      a * Math.atan(you.health - (foodPath.length * foodDistanceCost) / b);
  });
  //if (headNode.hasFood) {
  //total += 100;
  //}

  const voronoiScore = voronoi(gs);

  log(`voronoi for ${you.head.x},${you.head.y} score:${voronoiScore}`);
  if (voronoiScore) {
    total += voronoiScore * 60; // should be a hyper parameter
  }

  for (const pm of snakesWithMoves) {
    if (pm.possibleMoves.map(prop("coord")).some(isHead)) {
      if (pm.snake.length >= you.length) {
        log(`possible death move:${you.head.x},${you.head.y}`);
        total = -10000;
      }
      if (pm.snake.length < you.length) {
        total = total * 1000;
      }
    }
  }

  if (headNode.hasHazard) {
    total += -Math.atan(you.health / 16);
  }

  if (headNode.hasSnakeTail && hasDuplicates(headNode.snake?.body ?? [])) {
    total = -Infinity;
  }

  log(`head:${you.head.x},${you.head.y} total:${total}`);
  return total;
};

export const alphabeta = (
  gs: GameStateSim,
  move: Coord,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): { score: number; move: Coord } => {
  const printState = (s: GameStateSim, value: number) =>
    log(`depth:${depth} head:${s.you.head.x},${s.you.head.y} value:${value}`);

  const { you, grid, board, isWrapped } = gs;

  //if (isGameOver(gs)) {
  //log("game over");
  //if (didWeWinBoys(gs, gs.you)) {
  //printGrid(gs.grid);
  //log("we win");
  //log({ score: Infinity, move: you.head });
  //return { score: Infinity, move: you.head };
  //}
  //if (didWeLoseSadBoys(gs, gs.you)) {
  //printGrid(gs.grid);
  //log("we lost");
  //log({ score: -Infinity, move: you.head });
  //return { score: -Infinity, move: you.head };
  //}
  //log("wat");
  //}

  if (depth < 1 || isGameOver(gs)) {
    //const h = nodeHeuristic(ns.grid, ns, ns.grid[ns.you.head.y][ns.you.head.x]);
    const h = stateHeuristic(gs);
    //log({ score: h, move });
    return { score: h, move };
  }

  if (maximizingPlayer) {
    let value = -Infinity;

    for (const pm of getMoves(grid, you.body, isWrapped)) {
      const ns = cloneGameState(gs);
      log(`testing move:${pm.coord.x},${pm.coord.y}`);
      addMove(ns, you, pm.coord);

      const moveH = stateHeuristic(ns);
      const min = alphabeta(ns, pm.coord, depth - 1, alpha, beta, false);
      //const = moveH + Math.max(value, next.score);
      if (moveH < 0) {
        value = moveH;
      }
      if (min.score > value) {
        value = min.score;
        move = pm.coord;
      }
      if (value >= beta) {
        log("max pruning");
        break;
      }
      alpha = Math.max(alpha, value);
    }
    //log({ score: value, move });
    return { score: value, move };
  } else {
    let value = Infinity;

    const enemy = board.snakes.find((s) => s.id !== you.id);
    if (enemy) {
      const enemyMove = getMoves(grid, enemy.body, isWrapped);
      for (const pm of enemyMove) {
        const ns = cloneGameState(gs);
        addMove(ns, enemy, pm.coord);

        const nextTurn = resolveTurn(ns);
        const max = alphabeta(nextTurn, pm.coord, depth - 1, alpha, beta, true);
        //value = Math.min(value, max.score);
        if (max.score < value) {
          value = max.score;
          move = pm.coord;
        }
        if (value <= alpha) {
          log(`min prunning`);
          break;
        }
        beta = Math.min(beta, value);
      }
    } else {
      // for solo
      const ns = cloneGameState(gs);
      const nextTurn = resolveTurn(ns);
      const max = alphabeta(nextTurn, move, depth - 1, alpha, beta, true);
      //value = Math.min(value, max.score);
      if (max.score < value) {
        value = max.score;
        move = move;
      }
      beta = Math.min(beta, value);
    }

    return { score: value, move };
  }
};

export const determineMove = (state: GameState, depth: number = 2): Coord => {
  const board = state.board;
  const isWrapped = state.game.ruleset.name === "wrapped";
  const grid = createGrid(board);
  const ns = cloneGameState({ ...state, pendingMoves: [], isWrapped, grid });

  //const perms = createGameStatePermutations(ns);

  //const [bestMove, ...rest] = perms
  //.map((p) => {
  //return {
  //move: p.move,
  //score: alphabeta(resolveTurn(p.gs), depth, -Infinity, Infinity, true),
  //};
  //})
  //.sort((a, b) => b.score - a.score);

  const move = alphabeta(ns, ns.you.head, depth, -Infinity, Infinity, true);
  return move.move;
};
