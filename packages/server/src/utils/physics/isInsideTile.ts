import { BaseTile } from "../../schemas/GameState";

export function isInsideTile(
  x: number,
  y: number,
  tile: BaseTile,
  playerSize = 0,
  TILE_SIZE = 16
) {
  const tilePixelSizeFromCentre = (tile.scale || 1) * (TILE_SIZE / 2);
  /**
   * Ok, so top left of map/tile is negative.
   * That means top and left walls are smaller then origin
   * bottom and right are positive.
   */
  const leftWall = tile.x - tilePixelSizeFromCentre;
  const rightWall = tile.x + tilePixelSizeFromCentre;
  const topWall = tile.y - tilePixelSizeFromCentre;
  const bottomWall = tile.y + tilePixelSizeFromCentre;
  if (leftWall <= x && rightWall >= x) return true;
  if (topWall <= y && bottomWall >= y) return true;
  return false;
}
