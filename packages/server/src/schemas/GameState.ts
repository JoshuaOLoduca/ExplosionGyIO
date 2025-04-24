import { Schema, type, MapSchema } from "@colyseus/schema";

export class Tile extends Schema {
  @type("string")
  imageId = "";

  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  scale?: number = undefined;
}

export class Player extends Schema {

  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("string")
  sprite = "p";

  @type("string")
  clientId = "";
}

export class GameState extends Schema {
  @type({ map: Tile })
  tiles = new MapSchema<Tile>();

  @type({ map: Player })
  players = new MapSchema<Player>();
}
