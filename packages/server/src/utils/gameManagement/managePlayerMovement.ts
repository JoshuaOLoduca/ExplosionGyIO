import { BLOCKS_IN_WIDTH, TILE_SIZE } from "../../rooms/GameRoom";
import { Tile, Player, Bomb } from "../../schemas";
import math from "../math";
import {
  checkBoxCollisionAlongPath,
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
  const getPlayerSpeed = (playerSpeedPowerup: number) =>
    ((options.screenWidth / BLOCKS_IN_WIDTH / 8) *
      speedLogScaling(playerSpeedPowerup)) /
    6.25;

  let movementDelta = getPlayerSpeed(player.powerups.get("speed") + 1);
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

  const filteredCollisionList = insideOfTile
    ? tileCollisionList.filter((tile) => tile !== insideOfTile)
    : tileCollisionList;
  // disable diagnal input if it would collide.
  // this retains full speed if user is walking into a wall.
  // W
  if (message.up) {
    const topCollide = checkCollision(
      player.x,
      player.y - movementDelta,
      filteredCollisionList,
      playerSize,
      true
    );
    if (topCollide) message.up = false;
  }

  // A
  if (message.left) {
    const leftCollide = checkCollision(
      player.x - movementDelta,
      player.y,
      filteredCollisionList,
      playerSize,
      true
    );
    if (leftCollide) message.left = false;
  }

  // S
  if (message.down) {
    const downCollide = checkCollision(
      player.x,
      player.y + movementDelta,
      filteredCollisionList,
      playerSize,
      true
    );
    if (downCollide) message.down = false;
  }

  // D
  if (message.right) {
    const rightCollide = checkCollision(
      player.x + movementDelta,
      player.y,
      filteredCollisionList,
      playerSize,
      true
    );
    if (rightCollide) message.right = false;
  }

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

  const stepSize = getPlayerSpeed(2) / 2;

  const foundCollisions = checkBoxCollisionAlongPath(
    playerSize,
    filteredCollisionList,
    originalPlayerCoords,
    player,
    stepSize
  );

  if (foundCollisions) {
    const [collisions, collisionCoord] = foundCollisions;

    for (let [collisinSide] of collisions) {
      switch (collisinSide) {
        case "top":
          player.y = collisionCoord.y + stepSize;
          break;
        case "right":
          player.x = collisionCoord.x - stepSize;
          break;
        case "bottom":
          player.y = collisionCoord.y - stepSize;
          break;
        case "left":
          player.x = collisionCoord.x + stepSize;
          break;
      }
    }
  }
}
