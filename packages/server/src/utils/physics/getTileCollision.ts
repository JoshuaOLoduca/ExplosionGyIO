import { BaseTile } from "../../schemas/GameState";

// TODO: make alternative that finds the closest available x/y that doesnt collide
export function getTileCollision(
  x: number,
  y: number,
  tiles: BaseTile[],
  playerSize = 0,
  TILE_SIZE = 16
): BaseTile | undefined {
  return tiles.find((tile) => {
    const top = tile.y - (TILE_SIZE / 2) * (tile?.scale || 1);
    const bottom = tile.y + (TILE_SIZE / 2) * (tile?.scale || 1);
    const left = tile.x - (TILE_SIZE / 2) * (tile?.scale || 1);
    const right = tile.x + (TILE_SIZE / 2) * (tile?.scale || 1);

    if (!playerSize) {
      playerSize = (TILE_SIZE / 2) * (tile?.scale || 1) * 0.5;
    }

    if (
      tile.x - (TILE_SIZE / 2) * (tile.scale || 1) < x + playerSize &&
      tile.x + (TILE_SIZE / 2) * (tile.scale || 1) > x - playerSize
    ) {
      const collideTop = y < top && y + playerSize > top;
      const collideBottom = y > bottom && y - playerSize < bottom;

      if (collideTop || collideBottom) return true;
    }
    if (
      tile.y - (TILE_SIZE / 2) * (tile.scale || 1) < y + playerSize &&
      tile.y + (TILE_SIZE / 2) * (tile.scale || 1) > y - playerSize
    ) {
      const collideLeft = x < left && x + playerSize > left;
      const collideRight = x > right && x - playerSize < right;

      if (collideLeft || collideRight) return true;
    }

    return false;
  });
}
