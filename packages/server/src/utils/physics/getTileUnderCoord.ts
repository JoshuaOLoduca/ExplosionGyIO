import { Tile } from "../../schemas";

export function getTileUnderCoord(
  tiles: Tile[],
  x: number,
  y: number,
  TILE_SIZE = 16
) {
  const tileUnderCoord = tiles.find((tile) => {
    const sizeInPixelsFromCentre = (tile.scale || 1) * (TILE_SIZE / 2);
    const distanceFromX = Math.abs(tile.x - x);
    const distanceFromY = Math.abs(tile.y - y);
    const isTileUnderCoord =
      distanceFromX <= sizeInPixelsFromCentre &&
      distanceFromY <= sizeInPixelsFromCentre;

    return isTileUnderCoord;
  });
  return tileUnderCoord;
}
