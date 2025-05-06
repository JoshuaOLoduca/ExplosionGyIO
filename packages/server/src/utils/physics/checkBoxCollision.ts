import { Tile } from "../../schemas";
import { isInsideTile } from "./isInsideTile";

export type tCoord = { x: number; y: number };
export type tBox = {
  top: tCoord;
  right: tCoord;
  bottom: tCoord;
  left: tCoord;
};

/**
 *
 * @param box
 * @param collisionTiles
 * @returns false if array is length 0, otherwise return array of which sides have collisions
 */
export function checkBoxCollision(box: tBox, collisionTiles: Tile[]) {
  const loopObj = Object.entries(box) as [keyof typeof box, tCoord][];
  const foundCollisions: [keyof typeof box, tCoord][] = [];

  for (const tile of collisionTiles) {
    const collisions = loopObj.filter(([_, coord]) =>
      isInsideTile(coord.x, coord.y, tile)
    );
    if (collisions.length) foundCollisions.push(...collisions);
  }

  return foundCollisions.length ? foundCollisions : false;
}
