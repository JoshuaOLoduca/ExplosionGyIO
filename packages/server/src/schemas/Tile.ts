import { type } from "@colyseus/schema";
import { Bomb } from "./Bomb";
import { BaseTile } from "./BaseTile";

export class Tile extends BaseTile {
  /**
   * each tile can only have a single bomb.
   */
  @type(Bomb)
  bomb?: Bomb = undefined;
}
