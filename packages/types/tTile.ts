import { tBaseTile } from "./tBaseTile";
import { tBomb } from "./tBomb";

export type tTile = {
  bomb?: tBomb;
} & tBaseTile;
