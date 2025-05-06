import { BLOCKS_IN_WIDTH, TILE_SIZE } from "../../rooms/GameRoom";
import { Tile, Player } from "../../schemas";
import math from "../math";
import {
  checkBoxCollision,
  checkCollision,
  getTileUnderCoord,
  isInsideTile,
} from "../physics";

const speedLogScaling = math.createBaseLog(1.5);

export function managePlayerMovement(
  options: { screenWidth: number; screenHeight: number },
  arrOfGrassTiles: Tile[],
  player: Player,
  tileCollisionList: Tile[],
  message: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    placeBomb: boolean;
  }
) {
  let movementDelta =
    ((options.screenWidth / BLOCKS_IN_WIDTH / 8) *
      speedLogScaling(player.powerups.get("speed") + 1)) /
    6.25;

  const originalPlayerCoords = { x: player.x, y: player.y };
  const playerSize =
    (TILE_SIZE / 2) *
    (player?.scale || tileCollisionList.at(0)?.scale || 1) *
    0.5;

  const tileUnderPlayer = getTileUnderCoord(
    arrOfGrassTiles.filter((grassTile) => !!grassTile.bomb),
    player.x,
    player.y
  );
  const insideOfTile =
    tileUnderPlayer?.bomb ||
    tileCollisionList.find((colTile) =>
      isInsideTile(player.x, player.y, colTile)
    );
  // disable diagnal input if it would collide.
  // this retains full speed if user is walking into a wall.
  // W
  const topCollide = checkCollision(
    player.x,
    player.y - movementDelta,
    tileCollisionList,
    playerSize,
    true
  );
  if (topCollide && topCollide !== insideOfTile) {
    message.up = false;
  }
  // A
  const leftCollide = checkCollision(
    player.x - movementDelta,
    player.y,
    tileCollisionList,
    playerSize,
    true
  );
  if (leftCollide && leftCollide !== insideOfTile) {
    message.left = false;
  }
  // S
  const downCollide = checkCollision(
    player.x,
    player.y + movementDelta,
    tileCollisionList,
    playerSize,
    true
  );
  if (downCollide && downCollide !== insideOfTile) {
    message.down = false;
  }
  // D
  const rightCollide = checkCollision(
    player.x + movementDelta,
    player.y,
    tileCollisionList,
    playerSize,
    true
  );
  if (rightCollide && rightCollide !== insideOfTile) message.right = false;

  // Normalize input
  const MOVING_DIAGNAL =
    (message.up || message.down) && (message.left || message.right);
  if (MOVING_DIAGNAL) movementDelta = movementDelta / 2;

  // W
  if (message.up) player.y -= movementDelta;
  // A
  if (message.left) player.x -= movementDelta;
  // S
  if (message.down) player.y += movementDelta;
  // D
  if (message.right) player.x += movementDelta;
}
