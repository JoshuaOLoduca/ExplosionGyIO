import { type } from "@colyseus/schema";
import { Bomb } from "./Bomb";
import { BaseTile } from "./BaseTile";
import { tTile } from "explosion-gyio";

export class Tile extends BaseTile implements tTile {
  /**
   * each tile can only have a single bomb.
   */
  @type(Bomb)
  bomb?: Bomb = undefined;
}
