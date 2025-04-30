import { Client, Room } from "colyseus";
import { Bomb, Explosion, GameState, Player, Tile } from "../schemas/GameState";
import roomLayoutGenerator, {
  tRoomMatrix,
  tRoomTile,
} from "../utils/roomLayoutGenerator";
import { checkCollision, getTileUnderCoord } from "../utils/physics";

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

        const tileCollisionList = Array.from(tileCollisionListPrimary).concat(
          Array.from(this.BOMBS)
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
                  .map((_, index, arr) => {
                    const tileSize = (bombTile.scale || 1) * TILE_SIZE;
                    const multiplier = index + 1;
                    const [xToCheck, yToCheck] = [
                      bombTile.x - tileSize * multiplier,
                      bombTile.y,
                    ];
                    const foundTile = getTileUnderCoord(
                      arrOfGrassTiles,
                      xToCheck,
                      yToCheck
                    );

                    if (!foundTile || (index - 1 !== 0 && !arr[index - 1])) {
                      return null;
                    }
                    const explosion = new Explosion();
                    explosion.x = foundTile.x;
                    explosion.y = foundTile.y;
                    explosion.imageId = "bomb_explosion_1";

                    return explosion;
                  })
                  .filter(Boolean);
                const topExplosion = new Array(bombExplosionLength)
                  .fill(2)
                  .map((_, index, arr) => {
                    const tileSize = (bombTile.scale || 1) * TILE_SIZE;
                    const multiplier = index + 1;
                    const [xToCheck, yToCheck] = [
                      bombTile.x,
                      bombTile.y - tileSize * multiplier,
                    ];
                    const foundTile = getTileUnderCoord(
                      arrOfGrassTiles,
                      xToCheck,
                      yToCheck
                    );

                    if (!foundTile || (index - 1 !== 0 && !arr[index - 1])) {
                      return null;
                    }
                    const explosion = new Explosion();
                    explosion.x = foundTile.x;
                    explosion.y = foundTile.y;
                    explosion.imageId = "bomb_explosion_1";

                    return explosion;
                  })
                  .filter(Boolean);
                const rightExplosion = new Array(bombExplosionLength)
                  .fill(2)
                  .map((_, index, arr) => {
                    const tileSize = (bombTile.scale || 1) * TILE_SIZE;
                    const multiplier = index + 1;
                    const [xToCheck, yToCheck] = [
                      bombTile.x + tileSize * multiplier,
                      bombTile.y,
                    ];
                    const foundTile = getTileUnderCoord(
                      arrOfGrassTiles,
                      xToCheck,
                      yToCheck
                    );

                    if (!foundTile || (index - 1 !== 0 && !arr[index - 1])) {
                      return null;
                    }
                    const explosion = new Explosion();
                    explosion.x = foundTile.x;
                    explosion.y = foundTile.y;
                    explosion.imageId = "bomb_explosion_1";

                    return explosion;
                  })
                  .filter(Boolean);
                const bottomExplosion = new Array(bombExplosionLength)
                  .fill(2)
                  .map((_, index, arr) => {
                    const tileSize = (bombTile.scale || 1) * TILE_SIZE;
                    const multiplier = index + 1;
                    const [xToCheck, yToCheck] = [
                      bombTile.x,
                      bombTile.y + tileSize * multiplier,
                    ];
                    const foundTile = getTileUnderCoord(
                      arrOfGrassTiles,
                      xToCheck,
                      yToCheck
                    );

                    if (!foundTile || (index - 1 !== 0 && arr[index - 1])) {
                      arr[index - 1].imageId = "bomb_explosion_2";
                    }

                    if (!foundTile || (index - 1 !== 0 && !arr[index - 1])) {
                      return null;
                    }

                    const explosion = new Explosion();
                    explosion.x = foundTile.x;
                    explosion.y = foundTile.y;
                    explosion.imageId = "bomb_explosion_1";

                    return explosion;
                  })
                  .filter(Boolean);

                const bombs = [
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
                // bombTile.bomb = undefined;
                // this.BOMBS.delete(bomb);
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
