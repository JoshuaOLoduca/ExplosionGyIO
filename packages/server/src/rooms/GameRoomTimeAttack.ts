import { GameStateTimeAttack } from "../schemas/GameStateTimeAttack";
import { GameRoom } from "./GameRoom";

export class GameRoomTimeAttack extends GameRoom {
  state = new GameStateTimeAttack(100);

  constructor() {
    super();
  }
}
