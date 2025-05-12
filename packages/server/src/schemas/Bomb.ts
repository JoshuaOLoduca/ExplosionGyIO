import { type, ArraySchema } from "@colyseus/schema";
import { BaseTile } from "./BaseTile";
import { Explosion } from "./Explosion";
import { Player } from "./Player";
import type { tBomb } from "explosion-gyio";

export class Bomb extends BaseTile implements tBomb {
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
