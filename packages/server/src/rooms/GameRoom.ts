import { Client, Room } from "colyseus";
import { Bomb, GameState, Player, Tile } from "../schemas/GameState";
import roomLayoutGenerator, {
  tRoomMatrix,
  tRoomTile,
} from "../utils/roomLayoutGenerator";
import { isInsideTile, willCollide, getTileUnderCoord } from "../utils/physics";

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

        const tileCollisionList = [...tileCollisionListPrimary, ...this.BOMBS];

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

            const bombFuse = setInterval(() => {
              bomb.fuse -= 1;
              if (bomb.fuse <= 0) {
                clearInterval(bombFuse);
                bombTile.bomb = undefined;
                this.BOMBS.delete(bomb);
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
        const playerInsideCollisionTile =
          !!tileUnderPlayer &&
          isInsideTile(player.x, player.y, tileUnderPlayer);

        // disable diagnal input if it would collide.
        // this retains full speed if user is walking into a wall.
        // W

        const topCollide = willCollide(
          player.x,
          player.y - movementDelta,
          tileCollisionList,
          undefined,
          true
        );
        if (topCollide && topCollide !== tileUnderPlayer?.bomb) {
          message.up = false;
        }
        // A
        const leftCollide = willCollide(
          player.x - movementDelta,
          player.y,
          tileCollisionList,
          undefined,
          true
        );
        if (leftCollide && leftCollide !== tileUnderPlayer?.bomb)
          message.left = false;
        // S
        const downCollide = willCollide(
          player.x,
          player.y + movementDelta,
          tileCollisionList,
          undefined,
          true
        );
        if (downCollide && downCollide !== tileUnderPlayer?.bomb)
          message.down = false;
        // D
        const rightCollide = willCollide(
          player.x + movementDelta,
          player.y,
          tileCollisionList,
          undefined,
          true
        );
        if (rightCollide && rightCollide !== tileUnderPlayer?.bomb)
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
