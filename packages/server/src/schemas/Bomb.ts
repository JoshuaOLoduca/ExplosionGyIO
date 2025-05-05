import { type, ArraySchema } from "@colyseus/schema";
import { BaseTile } from "./BaseTile";
import { Explosion } from "./Explosion";
import { Player } from "./Player";

export class Bomb extends BaseTile {
  /**
   * Once it hits 0, it will explode. Currently assuming its miliseconds
   */
  @type("uint16")
  fuse = 10;

  @type({ array: Explosion })
  explosions = new ArraySchema<Explosion>();

  @type(Player)
  owner?: Player = undefined;
}
