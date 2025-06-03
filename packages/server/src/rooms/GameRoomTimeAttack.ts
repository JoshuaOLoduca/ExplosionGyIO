import { GameStateTimeAttack } from "../schemas/GameStateTimeAttack";
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
      }
    });
  }
}
