// PlaceFoodAutomatically initializes the array of food based on the size of the board and the number of snakes.
// Food spawning algorithm from https://github.com/BattlesnakeOfficial/rules/blob/main/board.go
// Converted to typescript

import { Coord, GameState } from "../types";
import { isCoordEqual } from "./board";
import { prop } from "./general";

export const placeFoodAutomatically = (gs: GameState) => {
  if (isKnownBoardSize(gs)) {
    return placeFoodFixed(gs);
  }
  return placeFoodRandomly(gs, gs.board.snakes.length);
};

const isKnownBoardSize = (gs: GameState): boolean => {
  if (gs.board.height === 7 && gs.board.width === 7) {
    return true;
  }
  if (gs.board.height === 11 && gs.board.width === 11) {
    return true;
  }
  if (gs.board.height === 19 && gs.board.width === 19) {
    return true;
  }
  return false;
};

const placeFoodFixed = (gs: GameState) => {
  const centerCoord = {
    x: (gs.board.width - 1) / 2,
    y: (gs.board.height - 1) / 2,
  };

  // Place 1 food within exactly 2 moves of each snake, but never towards the center
  for (const snake of gs.board.snakes) {
    const snakeHead = snake.head;
    const possibleFoodLocations = [
      { x: snakeHead.x - 1, y: snakeHead.y - 1 },
      { x: snakeHead.x - 1, y: snakeHead.y + 1 },
      { x: snakeHead.x + 1, y: snakeHead.y - 1 },
      { x: snakeHead.x + 1, y: snakeHead.y + 1 },
    ];

    // Remove any positions already occupied by food or closer to center
    const availableFoodLocations = [];
    for (const p of possibleFoodLocations) {
      let isOccupiedAlready = false;
      for (const food of gs.board.food) {
        if (isCoordEqual(p)(food)) {
          isOccupiedAlready = true;
          break;
        }
      }

      if (isOccupiedAlready) {
        continue;
      }

      // Food must be away from center on at least one axis
      let isFarFromCenter = false;
      if (p.x < snakeHead.x && snakeHead.x < centerCoord.x) {
        isFarFromCenter = true;
      } else if (centerCoord.x < snakeHead.x && snakeHead.x < p.x) {
        isFarFromCenter = true;
      } else if (p.y < snakeHead.y && snakeHead.y < centerCoord.y) {
        isFarFromCenter = true;
      } else if (centerCoord.y < snakeHead.y && snakeHead.y < p.y) {
        isFarFromCenter = true;
      }

      if (isFarFromCenter) {
        availableFoodLocations.push(p);
      }
    }

    if (availableFoodLocations.length <= 0) {
      return; // no food
    }

    // Select randomly from available locations
    const placedFood =
      availableFoodLocations[
        Math.floor(Math.random() * availableFoodLocations.length)
      ];
    gs.board.food.push(placedFood);
  }

  // Finally, always place 1 food in center of board for dramatic purposes
  let isCenterOccupied = true;
  const unoccupiedPoints = getUnoccupiedPoints(gs);
  for (const p of unoccupiedPoints) {
    if (isCoordEqual(centerCoord)(p)) {
      isCenterOccupied = false;
      break;
    }
  }
  if (isCenterOccupied) {
    return; // no room for food
  }
  gs.board.food.push(centerCoord);
  return;
};

const placeFoodRandomly = (gs: GameState, n: number) => {
  for (let i = 0; i < n; i++) {
    const unoccupiedPoints = getUnoccupiedPoints(gs);
    if (unoccupiedPoints.length > 0) {
      const newFood =
        unoccupiedPoints[Math.floor(Math.random() * unoccupiedPoints.length)];
      gs.board.food.push(newFood);
    }
  }
};

const getUnoccupiedPoints = (gs: GameState): Coord[] => {
  const unoccupiedPoints = [];
  for (let i = 0; i < gs.board.height; i++) {
    for (let j = 0; j < gs.board.width; j++) {
      const currentCoord = { x: j, y: i };
      const isCurrent = isCoordEqual(currentCoord);
      if (gs.board.snakes.flatMap(prop("body")).some(isCurrent)) {
        continue;
      }
      if (gs.board.food.some(isCurrent)) {
        continue;
      }
      unoccupiedPoints.push(currentCoord);
    }
  }
  return unoccupiedPoints;
};
