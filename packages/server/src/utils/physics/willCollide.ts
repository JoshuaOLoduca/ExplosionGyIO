import { BaseTile } from "../../schemas/GameState";
import { getTileCollision } from "./getTileCollision";

export function willCollide(
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
