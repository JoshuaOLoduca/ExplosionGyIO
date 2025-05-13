import { tBaseTile } from "./tBaseTile";
import { tBomb } from "./tBomb";

export type tTile<T = {}> = {
  bomb?: tBomb;
} & tBaseTile<T>;
