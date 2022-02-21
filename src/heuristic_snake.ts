import { Coord, GameState } from "./types";
import { prop } from "./utils/general";
import {
  BFS,
  getAllPossibleMoves,
  Grid,
  Node,
  isCoordEqual,
  createGrid,
  getNeighbors,
} from "./utils/board";

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
      if (node.hasSnake) {
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

// TODO: should I subtract the end of each snake when evaluating moves?
// * i think so
// * unless they could eat a food
const nodeHeuristic = (
  grid: Grid,
  { board, you, game, turn }: GameState,
  node: Node
): number => {
  const isWrapped = game.ruleset.name === "wrapped";
  let total = 0;
  const snakes = board.snakes;
  const food = board.food;
  const isCurrent = isCoordEqual(node.coord);
  const enemySnakes = snakes.filter((s) => s.id !== you.id);
  const smallerSnakes = enemySnakes.filter((s) => s.length < you.length);
  const largerSnakes = enemySnakes.filter((s) => s.length >= you.length);
  const isPossibleKillMove =
    getAllPossibleMoves(grid, smallerSnakes.map(prop("head")), isWrapped)
      .map(prop("coord"))
      .filter(isCurrent).length > 0;

  const isPossibleDeathMove =
    getAllPossibleMoves(grid, largerSnakes.map(prop("head")), isWrapped)
      .map(prop("coord"))
      .filter(isCurrent).length > 0;

  if (isPossibleKillMove) {
    total += 10;
  }

  if (isPossibleDeathMove) {
    total += -1000;
  }

  if (node.hasHazard) {
    total -= 16 / you.health;
  }
  // TODO: eval possible snake tail, maybe

  // Factor in distance to food
  const orderedFood = food.map((f) => BFS(grid, node.coord, f));
  const a = 50;
  const b = turn < 50 ? 1 : 5; // try to play hungry for the first 50 turns
  orderedFood.forEach((foodPath) => {
    total += a * Math.atan((you.health - foodPath.length) / b);
  });

  const voronoiScores = voronoriCounts(grid, [
    node.coord,
    ...enemySnakes.map(prop("head")),
  ]);
  const voronoiScore = voronoiScores.find((s) => isCurrent(s.root));

  if (voronoiScore) {
    total += voronoiScore.score * 1;
  }

  return total;
};

export const determineMove = (state: GameState): Coord => {
  const board = state.board;
  const you = state.you;
  const isWrapped = state.game.ruleset.name === "wrapped";
  const grid = createGrid(board);
  const possibleMoves = getNeighbors(grid, isWrapped)(you.head);

  const [bestMove, ...rest] = possibleMoves
    .map((move) => ({ move, score: nodeHeuristic(grid, state, move) }))
    .sort((a, b) => b.score - a.score);
  return bestMove?.move.coord;
};
