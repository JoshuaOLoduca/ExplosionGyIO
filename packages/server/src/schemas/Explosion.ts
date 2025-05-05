import { type } from "@colyseus/schema";
import { BaseTile } from "./BaseTile";

export class Explosion extends BaseTile {
  @type("uint8")
  damage = 1;

  @type("uint16")
  lingerMs = 500;
}
