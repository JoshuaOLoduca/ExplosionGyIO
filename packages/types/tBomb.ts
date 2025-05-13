import { tBaseTile } from "./tBaseTile";
import { tPlayer } from "./tPlayer";

export type tBomb<T = {}> = {
  fuse: number;
  owner?: tPlayer<T>;
} & tBaseTile<T>;
