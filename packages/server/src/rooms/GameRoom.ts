import { Client, Room } from "colyseus";
import {
  BaseTile,
  Bomb,
  Explosion,
  GameState,
  Player,
  Tile,
} from "../schemas/GameState";
import roomLayoutGenerator, {
  tRoomMatrix,
  tRoomTile,
} from "../utils/roomLayoutGenerator";
import {
  checkCollision,
  getTileUnderCoord,
  isInsideTile,
} from "../utils/physics";

export const TILE_SIZE = 16;
const BLOCKS_IN_WIDTH = 19;

function getImageId(tile: tRoomTile) {
  switch (tile) {
    case "x":
      return "wall" as const;
    case "c":
      return "crate" as const;
    default:
      return "grass" as const;
  }
}

export class GameRoom extends Room<GameState> {
  state = new GameState();
  maxClients = 25; // Current Discord limit is 25
  initialMap: tRoomMatrix = roomLayoutGenerator(3, 3, 0);
  COLLISION_TILES = [
    "wall",
    "crate",
    // "bomb_big_1",
    // "bomb_big_2",
    // "bomb_big_3",
    // "bomb_big_4",
    // "bomb_big_5",
    // "bomb_big_6",
  ];
  BOMBS = new Set<Bomb>();

  onCreate(options: {
    screenWidth: number;
    screenHeight: number;
  }): void | Promise<any> {
    const ratio = (options.screenWidth / (TILE_SIZE * BLOCKS_IN_WIDTH)) * 1.01;

    this.initialMap = roomLayoutGenerator(11, 19, 0.1);
    this.initialMap.forEach((mapSlice, sliceIndex) => {
      mapSlice.forEach((tile, tileIndex) => {
        const tileObject = new Tile();

        tileObject.x =
          (tileIndex + 0.5) * (options.screenWidth / BLOCKS_IN_WIDTH);
        tileObject.y =
          (sliceIndex + 0.5) * (options.screenWidth / BLOCKS_IN_WIDTH);
        tileObject.imageId = getImageId(tile);
        tileObject.scale = ratio;

        this.state.tiles.set(sliceIndex + tile + tileIndex, tileObject);
      });
    });
    // TODO: calculate/cache this array on state tile change instead
    const arrOfTileState = [...this.state.tiles.values()];
    const arrOfGrassTiles = arrOfTileState.filter((tile) =>
      tile.imageId.includes("grass")
    );

    const tileCollisionListPrimary = arrOfTileState.filter((tile) =>
      this.COLLISION_TILES.includes(tile.imageId)
    );

    this.onMessage(
      0,
      (
        client: Client,
        message: {
          up: boolean;
          down: boolean;
          left: boolean;
          right: boolean;
          placeBomb: boolean;
        }
      ) => {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        const bombTileList = Array.from(this.BOMBS);

        const tileCollisionList = Array.from(tileCollisionListPrimary).concat(
          bombTileList.filter((bomb) => !!bomb.fuse)
        );

        // ////////////////////////////////////
        //           BOMB
        //  before movement so it places the
        //  bomb where the user IS, not where
        //  They will be.
        // ////////////////////////////////////

        if (message.placeBomb) {
          const bombTile = getTileUnderCoord(
            arrOfGrassTiles,
            player.x,
            player.y
          );
          if (bombTile && !bombTile.bomb) {
            const bomb = new Bomb();
            bomb.owner = player;
            bomb.imageId = "bomb_big_1";

            bomb.x = bombTile.x;
            bomb.y = bombTile.y;
            bomb.fuse = 1000 * 2;
            bomb.scale = (bombTile.scale || 2) / 2;

            bombTile.bomb = bomb;

            // For collision tracking
            this.BOMBS.add(bomb);

            const reduceConstructorForExplosionPlacement = (
              coordsToCheck: (
                x: number,
                y: number,
                offset: number
              ) => [x: number, y: number]
            ) => {
              return [
                (arr: (Explosion | null)[], _: unknown, index: number) => {
                  const tileSize = (bombTile.scale || 1) * TILE_SIZE;
                  const multiplier = index + 1;
                  const [xToCheck, yToCheck] = coordsToCheck(
                    bombTile.x,
                    bombTile.y,
                    tileSize * multiplier
                  );
                  const foundTile = getTileUnderCoord(
                    arrOfGrassTiles,
                    xToCheck,
                    yToCheck
                  );

                  if (!foundTile || arr[index - 1] === null) {
                    arr.push(null);
                    return arr;
                  }

                  const explosion = new Explosion(bomb);
                  explosion.x = foundTile.x;
                  explosion.y = foundTile.y;
                  explosion.imageId = "explosion_2";
                  arr.push(explosion);

                  return arr;
                },
                [],
              ] as const;
            };

            // TODO: use date object for more reliable time change
            // SetInterval can be off by some u/n seconds due to the scheduler being busy.
            const bombFuse = setInterval(() => {
              bomb.fuse -= 1;
              if (bomb.fuse <= 0) {
                const bombExplosionLength = 2;
                const bombPower = 1;
                // Top Left is 0,0
                const leftExplosion = new Array(bombExplosionLength)
                  .fill(2)
                  .reduce(
                    ...reduceConstructorForExplosionPlacement(
                      (x, y, offset) => [x - offset, y]
                    )
                  )
                  .filter(Boolean) as Explosion[];
                const topExplosion = new Array(bombExplosionLength)
                  .fill(2)
                  .reduce(
                    ...reduceConstructorForExplosionPlacement(
                      (x, y, offset) => [x, y - offset]
                    )
                  )
                  .filter(Boolean) as Explosion[];
                const rightExplosion = new Array(bombExplosionLength)
                  .fill(2)
                  .reduce(
                    ...reduceConstructorForExplosionPlacement(
                      (x, y, offset) => [x + offset, y]
                    )
                  )
                  .filter(Boolean) as Explosion[];
                const bottomExplosion = new Array(bombExplosionLength)
                  .fill(2)
                  .reduce(
                    ...reduceConstructorForExplosionPlacement(
                      (x, y, offset) => [x, y + offset]
                    )
                  )
                  .filter(Boolean) as Explosion[];

                for (const bombExplosionArr of [
                  topExplosion,
                  rightExplosion,
                  bottomExplosion,
                  leftExplosion,
                ]) {
                  if (bombExplosionArr.length >= 1) {
                    bombExplosionArr.at(-1)!.imageId = "explosion_3";
                  }

                  switch (bombExplosionArr) {
                    case bottomExplosion:
                      bottomExplosion.forEach((bomb) => {
                        if (
                          Math.random() > 0.5 &&
                          bomb === bottomExplosion.at(-1)
                        ) {
                          bomb.imageId = "bomb_extended_explosion_1";
                          bomb.angle = -90;
                        } else bomb.angle = 0;
                      });
                      break;
                    case rightExplosion:
                      rightExplosion.forEach((bomb) => {
                        if (
                          Math.random() > 0.5 &&
                          bomb === rightExplosion.at(-1)
                        ) {
                          bomb.imageId = "bomb_extended_explosion_1";
                          bomb.angle = 180;
                        } else bomb.angle = -90;
                      });
                      break;
                    case topExplosion:
                      topExplosion.forEach((bomb) => {
                        if (
                          Math.random() > 0.5 &&
                          bomb === topExplosion.at(-1)
                        ) {
                          bomb.imageId = "bomb_extended_explosion_1";
                          bomb.angle = 90;
                        } else bomb.angle = -180;
                      });

                      break;
                    case leftExplosion:
                      leftExplosion.forEach((bomb) => {
                        if (
                          Math.random() > 0.5 &&
                          bomb === leftExplosion.at(-1)
                        ) {
                          bomb.imageId = "bomb_extended_explosion_1";
                          bomb.angle = 0;
                        } else bomb.angle = 90;
                      });
                      break;
                  }
                }
                const centerExplosion = new Explosion(bomb);
                centerExplosion.x = bombTile.x;
                centerExplosion.y = bombTile.y;
                centerExplosion.scale = bombTile.scale || 1;
                centerExplosion.imageId = "bomb_extended_explosion_core";

                const bombs = [
                  centerExplosion,
                  ...topExplosion,
                  ...rightExplosion,
                  ...bottomExplosion,
                  ...leftExplosion,
                ] as Explosion[];
                bombs.forEach((bomb) => {
                  if (bomb) bomb.damage = bombPower;
                });

                bomb.explosions.push(...bombs);
                clearInterval(bombFuse);

                const updateRate = 25;

                const bombExplosionLinger = setInterval(() => {
                  centerExplosion.lingerMs -= updateRate;
                  if (centerExplosion.lingerMs <= 0) {
                    clearInterval(bombExplosionLinger);
                    bomb.explosions.clear();
                    bombTile.bomb = undefined;
                    this.BOMBS.delete(bomb);
                  }
                }, updateRate);
              }
            }, 1);
          }
        }

        // ///////////////////////////
        //         MOVEMENT
        // ///////////////////////////
        let movementDelta = options.screenWidth / BLOCKS_IN_WIDTH / 15;

        const tileUnderPlayer = getTileUnderCoord(
          arrOfGrassTiles.filter((grassTile) => !!grassTile.bomb),
          player.x,
          player.y
        );
        const insideOfTile = tileUnderPlayer?.bomb;
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
        if (rightCollide && rightCollide !== insideOfTile)
          message.right = false;

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

        // /////////////////////////
        //    Damage Collision
        // /////////////////////////
        const explosionTiles = Array.from(this.BOMBS).flatMap((bomb) =>
          bomb.explosions.toArray()
        );
        if (explosionTiles.length) {
          // //////////////////////
          //     Player Damage
          // //////////////////////
          const damaged =
            checkCollision(
              player.x,
              player.y,
              explosionTiles,
              undefined,
              true
            ) ||
            explosionTiles.find((expTile) =>
              isInsideTile(player.x, player.y, expTile)
            );

          if (damaged instanceof Explosion && damaged.lingerMs > 0) {
            player.addDamage(damaged.damage);
          }

          // //////////////////////
          //     Damage To Bombs
          // //////////////////////
          const bombsWithLifeAndHit = bombTileList
            .map(
              (bomb) =>
                [
                  bomb,
                  explosionTiles.find(
                    (explTile) =>
                      explTile.parent !== bomb &&
                      isInsideTile(bomb.x, bomb.y, explTile)
                  )!,
                ] as const
            )
            .filter(([bomb, explTile]) => bomb.fuse && explTile);
          bombsWithLifeAndHit.forEach(([bomb, explod]) => {
            if (!bomb.data.has(explod.id)) {
              bomb.data.set(explod.id, true);
              bomb.fuse = +Math.max(bomb.fuse - explod.damage * 750, 1).toFixed(
                0
              );
            }
          });
        }
      }
    );
  }

  onJoin(client: Client, options?: any, auth?: any): void | Promise<any> {
    console.log(`Client joined: ${client.sessionId}`);
    const validSpawnTiles = [...this.state.tiles.entries()].filter(([key]) =>
      key.includes(" ")
    );

    const [, spawnTile] = validSpawnTiles.at(
      Math.floor(Math.random() * validSpawnTiles.length)
    )!;

    const player = new Player();
    player.clientId = client.sessionId;
    player.x = spawnTile.x;
    player.y = spawnTile.y;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean): void | Promise<any> {
    console.log(`Client left: ${client.sessionId}`);
    this.state.players.delete(client.sessionId);
  }
}
