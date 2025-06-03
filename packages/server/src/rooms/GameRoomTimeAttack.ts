import { GameStateTimeAttack } from "../schemas/GameStateTimeAttack";
import { GameRoom } from "./GameRoom";

export class GameRoomTimeAttack extends GameRoom {
  state = new GameStateTimeAttack(100);

  constructor() {
    super();
    this.gameEvents.emit.on(
      "bomb--explosion__damage-player",
      (bomb, player) => {
        if (bomb.parent === player) {
          return this.state.updateScore(
            player.clientId,
            "missfires",
            "increment"
          );
        }

        if (!bomb.owner) return;

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
  }
}
