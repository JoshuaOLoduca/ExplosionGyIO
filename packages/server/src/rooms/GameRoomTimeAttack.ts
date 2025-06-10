import { Client } from "colyseus";
import { BaseTile } from "../schemas";
import { GameStateTimeAttack } from "../schemas/GameStateTimeAttack";
import { tGameOptions } from "../types";
import math from "../utils/math";
import { GameRoom } from "./GameRoom";

export class GameRoomTimeAttack extends GameRoom {
  state = new GameStateTimeAttack(100);

  constructor() {
    super();
    // Enable event emitting
    this.gameEvents.config["bomb--explosion__damage-player"] = true;

    // Update scoreboard
    this.gameEvents.emit.on(
      "bomb--explosion__damage-player",
      (bomb, player) => {
        if (!bomb.owner) return;

        if (bomb.owner === player) {
          return this.state.updateScore(
            player.clientId,
            "missfires",
            "increment"
          );
        }

        if (!player.isAlive) {
          return this.state.updateScore(
            bomb.owner?.clientId,
            "kills",
            "increment"
          );
        }

        if (player.isAlive) {
          return this.state.updateScore(
            bomb.owner.clientId,
            "hits",
            "increment"
          );
        }
      }
    );

    // Handle respawn, AFTER HANDLING SCOREBOARD UPDATE
    this.gameEvents.emit.on("bomb--explosion__damage-player", (_, player) => {
      if (!player.isAlive) {
        player.health = 3;
        player.invincible = 1000 * 5;
        this.spawnPlayer(player);
        for (const powerUpKey of player.powerUps.keys()) {
          const currentValue = player.powerUpsHelper.get(powerUpKey);
          const newValue = math.clamp(
            1,
            currentValue,
            Math.trunc(currentValue * 0.5)
          );

          player.powerUpsHelper.set(powerUpKey, newValue);
        }
      }
    });
  }

  fixedTick(...fixedTickArgs: Parameters<GameRoom["fixedTick"]>): void {
    super.fixedTick(...fixedTickArgs);

    if (this.state.countdown > 0) this.state.updateCountdown();
    else this.endGame();
  }

  endGame() {
    throw "notImpl";
  }

  onJoin(
    ...onJoinSuperArgs: Parameters<GameRoom["onJoin"]>
  ): void | Promise<any> {
    super.onJoin(...onJoinSuperArgs);
    const [client] = onJoinSuperArgs;

    // Start rendering of scoreboard entry for new player.
    this.state.addPlayer(client.sessionId);
  }

  onLeave(
    ...onLeaveSuperArgs: Parameters<GameRoom["onLeave"]>
  ): void | Promise<any> {
    super.onLeave(...onLeaveSuperArgs);

    const [client] = onLeaveSuperArgs;
    const playerScore = this.state.score.get(client.sessionId);
    if (playerScore) {
      const totalScore =
        playerScore.hits + playerScore.kills + playerScore.missfires;
      if (!totalScore) this.state.score.delete(client.sessionId);
    }
  }
}
