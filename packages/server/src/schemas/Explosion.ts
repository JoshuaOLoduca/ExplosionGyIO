import { type } from "@colyseus/schema";
import { BaseTile } from "./BaseTile";
import type { tExplosion } from "explosion-gyio";

export class Explosion extends BaseTile implements tExplosion {
  @type("uint8")
  damage = 1;

  @type("uint16")
  lingerMs = 500;
}
