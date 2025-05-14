import { tBaseTile } from "./tBaseTile";

export type tExplosion<T = {}> = {
  damage: number;
  lingerMs: number;
} & tBaseTile<T>;
