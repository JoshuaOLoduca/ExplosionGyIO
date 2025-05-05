import { BaseTile } from "../../schemas";
import { getTileCollision } from "./getTileCollision";

/**
 * Doesnt seem to work if player is inside tile.
 * @param x
 * @param y
 * @param tiles
 * @param playerSize
 * @param returnTile
 * @returns
 */
export function checkCollision(
  x: number,
  y: number,
  tiles: BaseTile[],
  playerSize = 0,
  returnTile = false
): boolean | BaseTile {
  const collisionTile = getTileCollision(x, y, tiles, playerSize);

  if (!returnTile || !collisionTile) return !!collisionTile;

  return collisionTile;
}
