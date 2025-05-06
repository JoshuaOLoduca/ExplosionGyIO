import { Tile } from "../../schemas";
import { tBox, tCoord } from "./checkBoxCollision";
import { isInsideTile } from "./isInsideTile";

/**
 *
 * @param box
 * @param collisionTiles
 * @returns false if array is length 0, otherwise return array of which sides have collisions
 */
export function checkBoxCollisionAlongPath(
  playerSize: number,
  collisionTiles: Tile[],
  pathStart: tCoord,
  pathEnd: tCoord,
  stepSize?: number
) {
  if (typeof stepSize !== "number") stepSize = playerSize;
}
