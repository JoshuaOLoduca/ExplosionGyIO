import { BLOCKS_IN_WIDTH } from "../../rooms/GameRoom";
import { Tile, Player } from "../../schemas";
import math from "../math";
import { checkCollision, getTileUnderCoord, isInsideTile } from "../physics";

const logBase2 = math.createBaseLog(2);

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
      logBase2(player.powerups.get("speed") + 1)) /
    5;

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
    undefined,
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
    undefined,
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
    undefined,
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
    undefined,
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
