import { Schema, type, MapSchema } from "@colyseus/schema";

export class BaseTile extends Schema {
  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  scale?: number = undefined;
}

export class Tile extends BaseTile {
  @type("string")
  imageId = "";
}

export class Bomb extends BaseTile {}

export class Player extends BaseTile {
  @type("string")
  sprite = "p";

  @type("string")
  clientId = "";

  @type({ array: Bomb })
  bombs = [];
}

export class GameState extends Schema {
  @type({ map: Tile })
  tiles = new MapSchema<Tile>();

  @type({ map: Player })
  players = new MapSchema<Player>();
}
