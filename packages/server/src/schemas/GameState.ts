import { Schema, type, MapSchema } from "@colyseus/schema";

export class Tiles extends Schema {
  @type("string")
  imageId = "";

  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  scale?: number = undefined;
}

export class GameState extends Schema {
  @type({ map: Tiles })
  tiles = new MapSchema<Tiles>();
}
