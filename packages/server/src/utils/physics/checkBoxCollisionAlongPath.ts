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

  const movingBottomRight = pathStartYAboveEndY && pathStartXLeftEndX;
  const movingTopLeft = !pathStartYAboveEndY && !pathStartXLeftEndX;
  const movingTopRight = !pathStartYAboveEndY && pathStartXLeftEndX;
  const movingBottomLeft = pathStartYAboveEndY && !pathStartXLeftEndX;

  while (pathStart.x !== pathEnd.x || pathStart.y !== pathEnd.y) {
    if (pathStartYAboveEndY && pathStart.y > pathEnd.y) pathStart.y = pathEnd.y;
    else if (!pathStartYAboveEndY && pathStart.y < pathEnd.y)
      pathStart.y = pathEnd.y;
    if (pathStartXLeftEndX && pathStart.x > pathEnd.x) pathStart.x = pathEnd.x;
    else if (!pathStartXLeftEndX && pathStart.x < pathEnd.x)
      pathStart.x = pathEnd.x;

    const { x, y } = pathStart;

    const box: tBox = {
      top: { x: x, y: y - playerSize },
      right: { x: x + playerSize, y: y },
      bottom: { x: x, y: y + playerSize },
      left: { x: x - playerSize, y: y },
      topLeft: { x: x - playerSize, y: y - playerSize },
      topRight: { x: x + playerSize, y: y - playerSize },
      bottomRight: { x: x + playerSize, y: y + playerSize },
      bottomLeft: { x: x - playerSize, y: y + playerSize },
    };

    if (movingTopLeft) delete box.bottomRight;
    if (movingTopRight) delete box.bottomLeft;
    if (movingBottomLeft) delete box.topRight;
    if (movingBottomRight) delete box.topLeft;

    const foundCollisions = checkBoxCollision(box, collisionTiles);
    if (foundCollisions) return [foundCollisions, pathStart] as const;

    if (pathStart.y !== pathEnd.y)
      pathStart.y += pathStartYAboveEndY ? stepSize : -stepSize;
    if (pathStart.x !== pathEnd.x)
      pathStart.x += pathStartXLeftEndX ? stepSize : -stepSize;
  }
  return false;
}
