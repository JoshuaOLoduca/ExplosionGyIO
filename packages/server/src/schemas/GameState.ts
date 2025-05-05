import { Schema, type, MapSchema } from "@colyseus/schema";
import { Player } from "./Player";
import { PowerUp } from "./PowerUp";
import { Tile } from "./Tile";

export class GameState extends Schema {
  @type({ map: Tile })
  tiles = new MapSchema<Tile>();

  @type({ map: Player })
  players = new MapSchema<Player>();

  @type({ map: PowerUp })
  powerUps = new MapSchema<PowerUp>();
}
