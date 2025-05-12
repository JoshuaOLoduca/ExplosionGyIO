import { tBaseTile } from "./tBaseTile";

export type tExplosion = {
  damage: number;
  lingerMs: number;
} & tBaseTile;
