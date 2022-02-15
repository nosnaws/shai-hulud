/**
 * @typedef {Object} Battlesnake
 * @property {string} id
 * @property {string} name
 * @property {number} health
 * @property {number} length
 * @property {Object[]} body
 * @property {Object} head
 * @property {{ color: string }} customizations
 */

/**
 * @typedef {Object} Board
 * @property {Battlesnake[]} snakes
 * @property {number} width
 * @property {number} height
 * @property {Object[]} food
 * @property {Object[]} hazards
 */

/**
 * Turns an object into a base64 encoded JSON string for easier transport to
 * New Relic.
 *
 * @param {Object} obj
 * @returns {string}
 */
const encodeObject = (obj) =>
  Buffer.from(JSON.stringify(obj), "utf8").toString("base64");

/**
 * Gets some useful information about a snake and encodes it. This is necessary to
 * keep the custom attribute size under 255bytes.
 *
 * @param {Battlesnake} snake
 * @returns {string} base64 encoded JSON string
 */
const getSnakeData = ({ body, head, customizations }) =>
  encodeObject({
    body,
    head,
    color: customizations.color,
  }).slice(0, 255);

/**
 * @param {Object} data - The game state provided in the POST request
 * @param {Object} data.game
 * @param {string} data.game.id
 * @param {{ name: string }} data.game.ruleset
 * @param {number} data.turn
 * @param {Board} data.board
 * @param {Battlesnake} data.you
 */
const getCustomAttributes = ({ game, board, turn, you }) => {
  const opponents = board.snakes
    .filter((snake) => snake.id !== you.id)
    .reduce(
      (snakes, snake, i) => ({
        ...snakes,
        [`snakeOpponent_${i + 1}_Name`]: snake.name,
        [`snakeOpponent_${i + 1}_Id`]: snake.id,
        [`snakeOpponent_${i + 1}_Health`]: snake.health,
        [`snakeOpponent_${i + 1}_Length`]: snake.length,
        [`snakeOpponent_${i + 1}_Data`]: getSnakeData(snake),
      }),
      {}
    );

  return {
    snakeGameId: game.id,
    snakeRules: game.ruleset.name,
    snakeTurn: turn,

    snakeBoardHeight: board.height,
    snakeBoardWidth: board.width,
    snakeBoardFood: encodeObject(board.food),
    snakeBoardHazards: encodeObject(board.hazards),

    snakeName: you.name,
    snakeId: you.id,
    snakeHealth: you.health,
    snakeLength: you.length,
    snakeData: getSnakeData(you),

    ...opponents,
  };
};

module.exports = getCustomAttributes;
