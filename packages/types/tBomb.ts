import { tBaseTile } from "./tBaseTile";

export type tBomb<T ={}> = {
  fuse: number;
} & tBaseTile<T>;
