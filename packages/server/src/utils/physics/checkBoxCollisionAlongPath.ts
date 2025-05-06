import { Tile } from "../../schemas";
import { checkBoxCollision, tBox, tCoord } from "./checkBoxCollision";

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
  // Prevent mutation of argument
  pathStart = { ...pathStart };

  /**
   * lower number means its above, as top left is 0,0
   */
  const pathStartYAboveEndY = pathStart.y < pathEnd.y;
  /**
   * lower number means its to the left of, top left is 0,0
   */
  const pathStartXLeftEndX = pathStart.x < pathEnd.x;

  while (pathStart.x !== pathEnd.x && pathStart.y !== pathEnd.y) {
    if (pathStartYAboveEndY && pathStart.y > pathEnd.y) pathStart.y = pathEnd.y;
    else if (!pathStartYAboveEndY && pathStart.y < pathEnd.y)
      pathStart.y = pathEnd.y;
    if (pathStartXLeftEndX && pathStart.x > pathEnd.x) pathStart.x = pathEnd.x;
    else if (!pathStartXLeftEndX && pathStart.x < pathEnd.x)
      pathStart.x = pathEnd.x;

    const { x, y } = pathStart;

    const foundCollisions = checkBoxCollision(
      {
        top: { x: x, y: y - playerSize },
        right: { x: x + playerSize, y: y },
        bottom: { x: x, y: y + playerSize },
        left: { x: x - playerSize, y: y },
      },
      collisionTiles
    );
    if (foundCollisions) return [foundCollisions, pathStart] as const;

    if (pathStart.y !== pathEnd.y)
      pathStart.y += pathStartYAboveEndY ? stepSize : -stepSize;
    if (pathStart.x !== pathEnd.x)
      pathStart.x += pathStartXLeftEndX ? stepSize : -stepSize;
  }
  return false;
}
