import { MapSchema, Schema, type } from "@colyseus/schema";
import type { tGameStateTimeAttack, tScoreStats } from "explosion-gyio";
import { GameState } from "./GameState";

class PlayerScore extends Schema implements tScoreStats {
  @type("number")
  kills = 0;
  @type("number")
  hits = 0;
  @type("number")
  missfires = 0;
}

export class GameStateTimeAttack
  extends GameState
  implements tGameStateTimeAttack
{
  constructor(private gameLength: number) {
    super();
    this.timeStart = Date.now() / 1000;
    this.countdown = 0;
    this.updateCountdown();
  }

  updateCountdown = () => {
    this.countdown =
      this.gameLength - Math.trunc(this.timeStart - Date.now() * 0.001);
  };

  @type("number")
  countdown: number;

  @type({ map: PlayerScore })
  score = new MapSchema<PlayerScore>();

  timeStart: number;
}
