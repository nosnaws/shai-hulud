import newrelic from "newrelic";
// @ts-ignore
import getCustomAttributes from "../utils/getCustomAttributes.js";
import express, { Request, Response } from "express";
import { info, start, move, end } from "./logic";

const app = express();
app.use(express.json());

const port = process.env.PORT || 8080;

app.get("/", (req: Request, res: Response) => {
  res.send(info());
});

app.post("/start", (req: Request, res: Response) => {
  res.send(start(req.body));
});

app.post("/move", (req: Request, res: Response) => {
  newrelic.addCustomAttributes(getCustomAttributes(req.body));
  res.send(move(req.body));
});

app.post("/end", (req: Request, res: Response) => {
  newrelic.addCustomAttributes({
    winnerId: req.body.board.snakes[0]?.id ?? null,
    winnerName: req.body.board.snakes[0]?.name ?? null,
    isWin: req.body.board.snakes[0]?.name === "shai-hulud",
    totalTurns: req.body.turn,
    gameLink: `https://play.battlesnake.com/g/${req.body.game.id}`,
    gameType: req.body.game.ruleset.name,
  });
  res.send(end(req.body));
});

// Start the Express server
app.listen(port, () => {
  console.log(`Starting Battlesnake Server at http://0.0.0.0:${port}...`);
});
