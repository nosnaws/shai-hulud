import nr from "newrelic";
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
  getClosestSnake,
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
import { HAZARD_DAMAGE } from "./constants";
const coordStr = (c: Coord) => `${c?.x},${c?.y}`;

const LOG_MINMAX = true;
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
  log(counts, LOG_MINMAX);
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

const stateHeuristic = (gs: GameStateSim): number => {
  const { you, board, turn, grid } = gs;
  const otherSnakes = gs.board.snakes.filter((s) => s.id !== gs.you.id);

  let total = 0;

  if (isGameOver(gs)) {
    if (didWeWinBoys(gs, you)) {
      //printGrid(gs.grid);
      log("we win", LOG_MINMAX);
      return Infinity;
    }

    if (didWeLoseSadBoys(gs, you)) {
      //printGrid(gs.grid);
      log("we lose", LOG_MINMAX);
      return -Infinity;
    }
  }

  total += 10000 / otherSnakes.length ?? 1;
  const foodPaths = board.food
    .map((f) => BFS(grid, you.head, f))
    .sort((a, b) => a.length - b.length);
  const a = 55;
  const b = 2;
  for (let i = 0; i < foodPaths.length; i++) {
    const foodPath = foodPaths[i];

    if (foodPath) {
      const hazardsInPath = foodPath.reduce((total, n) => {
        if (n.hasHazard) {
          return total + 1;
        }
        return total;
      }, 0);

      const pathCost =
        hazardsInPath > 0 ? hazardsInPath * HAZARD_DAMAGE + 1 : 1;

      total += a * Math.atan(you.health - (foodPath.length * pathCost) / b);
    }
  }

  const voronoiScore = voronoi(gs);

  //log(`voronoi for ${you.head.x},${you.head.y} score:${voronoiScore}`);
  if (voronoiScore) {
    total += voronoiScore * 1; // should be a hyper parameter
  }

  //log(`head:${you.head.x},${you.head.y} total:${total}`);
  return total;
};

const pathHeuristic = (gs: GameStateSim, move: Coord): number => {
  const { you, grid } = gs;
  const otherSnakes = gs.board.snakes.filter((s) => s.id !== gs.you.id);
  const moveNode = grid[move.y][move.x];

  let total = 0;
  const isMove = isCoordEqual(move);
  const snakesWithMoves: {
    snake: Battlesnake;
    possibleMoves: Node[];
  }[] = otherSnakes.map((s) => ({
    snake: s,
    possibleMoves: getMoves(grid, s.body, gs.isWrapped),
  }));

  for (const pm of snakesWithMoves) {
    if (pm.possibleMoves.map(prop("coord")).some(isMove)) {
      if (pm.snake.length >= you.length) {
        log(`possible death move:${coordStr(move)}`, LOG_MINMAX);
        total += -Number.MAX_VALUE;
      }
    }
  }

  //if (moveNode.hasHazard) {
  //total += -Math.atan(you.health / 5);
  //}

  if (moveNode.hasSnakeTail && hasDuplicates(moveNode.snake?.body ?? [])) {
    log(
      `snake at coord:${coordStr(moveNode.coord)} ate last turn, AVOID TAIL`,
      LOG_MINMAX
    );
    total = -Infinity;
  }
  return total;
};

export const minmax = (
  gs: GameStateSim,
  move: Coord,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean
): { score: number; move: Coord; gs: GameStateSim } => {
  const printState = (s: GameStateSim, value: number) =>
    log(
      `depth:${depth} head:${s.you.head.x},${s.you.head.y} value:${value}`,
      LOG_MINMAX
    );

  const { you, grid, board, isWrapped } = gs;

  if (depth < 1 || isGameOver(gs)) {
    //const h = nodeHeuristic(ns.grid, ns, ns.grid[ns.you.head.y][ns.you.head.x]);
    const h = nr.startSegment("stateHeuristic", true, () => stateHeuristic(gs));
    //log({ score: h, move });
    return { score: h, move, gs };
  }

  if (maximizingPlayer) {
    let value = -Infinity;
    let bestGS = gs;

    const n = getMoves(grid, you.body, isWrapped);

    log(`moves at depth:${depth}`, LOG_MINMAX);
    log(n, LOG_MINMAX);

    for (const pm of n) {
      const ns = cloneGameState(gs);
      log(`testing move:${coordStr(pm.coord)} depth:${depth}`, LOG_MINMAX);
      addMove(ns, you, pm.coord);

      const moveH = nr.startSegment("pathHeuristics", true, () =>
        pathHeuristic(ns, pm.coord)
      );
      const min = nr.startSegment("minmax", true, () =>
        minmax(ns, pm.coord, depth - 1, alpha, beta, false)
      );

      if (moveH < 0) {
        log(
          `moveH override for ${coordStr(
            pm.coord
          )} depth:${depth} move:${coordStr(move)}`,
          LOG_MINMAX
        );
        min.score = moveH;
      }

      log(
        `comparing score:${value} move:${coordStr(move)} to score:${
          min.score
        } move:${coordStr(min.move)} depth:${depth}`,
        LOG_MINMAX
      );
      if (min.score > value) {
        log(
          `taking higher score:${min.score} move:${coordStr(
            min.move
          )} depth:${depth}`,
          LOG_MINMAX
        );
        log(`setting move to parent:${coordStr(pm.coord)}`, LOG_MINMAX);
        value = min.score;
        move = pm.coord;
        bestGS = ns;
      }
      if (value >= beta) {
        log("max pruning", LOG_MINMAX);
        break;
      }
      alpha = Math.max(alpha, value);
    }
    //log({ score: value, move });
    log(
      `return max score:${value} move:${coordStr(move)} depth:${depth}`,
      LOG_MINMAX
    );
    //
    // TODO: if all the moves are terrible, it can return it's own head
    return { score: value, move, gs: bestGS };
  } else {
    let value = Infinity;

    const enemySnakes = board.snakes.filter((s) => s.id !== you.id);
    const closestSnake = getClosestSnake(grid, move, enemySnakes, isWrapped);
    if (closestSnake) {
      log(`fighting ${closestSnake.name}`);
      const enemyMove = getMoves(grid, closestSnake.body, isWrapped);
      for (const pm of enemyMove) {
        const ns = cloneGameState(gs);
        addMove(ns, closestSnake, pm.coord);

        // move other snakes
        const otherSnakes = ns.board.snakes.filter(
          ({ id }) => id !== closestSnake.id && id !== you.id
        );
        otherSnakes.forEach((s) => {
          addMove(
            ns,
            s,
            getMoves(ns.grid, s.body, isWrapped)[Math.random() * s.body.length]
              ?.coord ?? {
              x: s.head.x - 1,
              y: s.head.y,
            }
          );
        });

        const nextTurn = resolveTurn(ns);

        const max = nr.startSegment("minmax", true, () =>
          minmax(nextTurn, move, depth - 1, alpha, beta, true)
        );
        //value = Math.min(value, max.score);
        if (max.score < value) {
          log(
            `taking lower score:${max.score} move:${coordStr(
              max.move
            )} depth:${depth}`,
            LOG_MINMAX
          );
          value = max.score;
        }
        if (value <= alpha) {
          log(`min prunning`, LOG_MINMAX);
          break;
        }
        beta = Math.min(beta, value);
      }
    } else {
      // for solo
      const ns = cloneGameState(gs);
      const nextTurn = resolveTurn(ns);
      const max = nr.startSegment("minmax", true, () =>
        minmax(nextTurn, move, depth - 1, alpha, beta, true)
      );
      //value = Math.min(value, max.score);
      if (max.score < value) {
        value = max.score;
        //move = move;
      }
      beta = Math.min(beta, value);
    }

    log(
      `return max score:${value} move:${coordStr(move)} depth:${depth}`,
      LOG_MINMAX
    );
    return { score: value, move, gs };
  }
};

export const IDSMinMax = (
  gs: GameStateSim,
  currentTime: number,
  duration: number
): { score: number; move: Coord } => {
  let currentDepth = 5;

  log(`IDS start`);
  log(`start depth:${currentDepth}`);
  let lastMove = nr.startSegment("minmax", true, () =>
    minmax(gs, gs.you.head, currentDepth, -Infinity, Infinity, true)
  );
  log(`end depth:${currentDepth}`);
  currentDepth = currentDepth + 1;

  while (Date.now() - currentTime < duration) {
    log(`start IDS depth ${currentDepth}`);
    const currentMove = nr.startSegment("minmax", true, () =>
      minmax(
        lastMove.gs,
        lastMove.gs.you.head,
        currentDepth,
        -Infinity,
        Infinity,
        true
      )
    );

    log(`end IDS depth:${currentDepth}`);
    //log(
    //`comparing result coord:${coordStr(currentMove.move)} score:${
    //currentMove.score
    //} to previous best coord:${coordStr(lastMove.move)} score:${
    //lastMove.score
    //}`
    //);
    //if (currentMove.score > lastMove.score) {
    //log(
    //`taking better move coord:${coordStr(currentMove.move)} score:${
    //currentMove.score
    //} `
    //);
    //lastMove = currentMove;
    //}
    //if (currentMove.score < 0) {
    //continue;
    //}
    lastMove = currentMove;
    currentDepth = currentDepth + 1;
  }

  return lastMove;
};

export const determineMove = (state: GameState, depth: number = 2): Coord => {
  const board = state.board;
  const isWrapped = state.game.ruleset.name === "wrapped";
  const grid = createGrid(board);
  const ns = cloneGameState({ ...state, pendingMoves: [], isWrapped, grid });
  log(`starting ${state.game.ruleset.name} game`);
  //const perms = createGameStatePermutations(ns);

  //const [bestMove, ...rest] = perms
  //.map((p) => {
  //return {
  //move: p.move,
  //score: alphabeta(resolveTurn(p.gs), depth, -Infinity, Infinity, true),
  //};
  //})
  //.sort((a, b) => b.score - a.score);
  //const moves = getMoves(grid, ns.you.body, isWrapped)
  //.map((m) => {
  //log(m.coord);
  //return m;
  //})
  //.map((m) => alphabeta(ns, m.coord, depth, -Infinity, Infinity, true))
  //.sort((a, b) => b.score - a.score);
  const move = nr.startSegment("IDSMinMax", true, () =>
    IDSMinMax(ns, Date.now(), 50)
  );
  //const move = minmax(ns, ns.you.head, 3, -Infinity, Infinity, true);
  log(move.move);
  log(move.score);
  return move?.move;
};
