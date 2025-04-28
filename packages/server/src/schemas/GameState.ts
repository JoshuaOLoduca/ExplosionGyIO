import { Schema, type, MapSchema } from "@colyseus/schema";

export class BaseTile extends Schema {
  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  scale?: number = undefined;
}

export class Explosion extends BaseTile {
  @type("uint8")
  damage = 1;
}

export class Tile extends BaseTile {
  @type("string")
  imageId = "";

  /**
   * each tile can only have a single bomb.
   */
  @type({ type: Bomb })
  bomb?: Bomb = undefined;
}

export class Player extends BaseTile {
  @type("string")
  sprite = "p";

  @type("string")
  clientId = "";
}

export class Bomb extends BaseTile {
  /**
   * Once it hits 0, it will explode. Currently assuming its miliseconds
   */
  @type("uint16")
  fuse = 10;

  @type({ array: Explosion })
  explosions = [];

  @type({ type: Player })
  owner?: Player = undefined;
}

export class GameState extends Schema {
  @type({ map: Tile })
  tiles = new MapSchema<Tile>();

  @type({ map: Player })
  players = new MapSchema<Player>();
}
