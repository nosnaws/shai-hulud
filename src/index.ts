// @ts-ignore
import newrelic from "newrelic";
// @ts-ignore
import getCustomAttributes from "../utils/getCustomAttributes.js";
import express, { Request, Response } from "express";
import { info, start, move, end } from "./logic";
import getLogger from "./logger";

const logger = getLogger();
const app = express();
app.use(express.json());

const port = process.env.PORT || 8080;

app.get("/", (req: Request, res: Response) => {
  res.send(info());
});

app.post("/start", (req: Request, res: Response) => {
  logger.info(`starting game: ${req.body.game.id}`);
  res.send(start(req.body));
});

app.post("/move", (req: Request, res: Response) => {
  logger.info(`move request: ${req.body.game.id}`);
  newrelic.addCustomAttributes(getCustomAttributes(req.body));
  res.send(move(req.body));
});

app.post("/end", (req: Request, res: Response) => {
  logger.info(`ending game: ${req.body.game.id}`);
  res.send(end(req.body));
});

// Start the Express server
app.listen(port, () => {
  console.log(`Starting Battlesnake Server at http://0.0.0.0:${port}...`);
});
