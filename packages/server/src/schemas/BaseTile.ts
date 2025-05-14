import { Schema, type } from "@colyseus/schema";
import type { tBaseTile } from "explosion-gyio";

export class BaseTile extends Schema implements tBaseTile {
  constructor(parent?: BaseTile) {
    super();
    this.parent = parent;
    this.id = (Math.random() * 10000).toFixed(10);
  }

  parent?: BaseTile;

  id: string;

  data = new Map();

  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  scale?: number = undefined;

  @type("string")
  imageId = "";

  @type("int16")
  angle = 0;
}
