import { Client, Room } from "colyseus";
import { GameState, Player, Tile } from "../schemas/GameState";
import roomLayoutGenerator, {
  tRoomMatrix,
  tRoomTile,
} from "../utils/roomLayoutGenerator";

const TILE_SIZE = 16;
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

  onCreate(options: {
    screenWidth: number;
    screenHeight: number;
  }): void | Promise<any> {
    const ratio = (options.screenWidth / (TILE_SIZE * BLOCKS_IN_WIDTH)) * 1.01;
    console.log({ ratio });

    this.initialMap = roomLayoutGenerator(9, 7, 0);
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

    this.onMessage(
      0,
      (
        client: Client,
        message: { up: boolean; down: boolean; left: boolean; right: boolean }
      ) => {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        const MOVING_DIAGNAL =
          (message.up || message.down) && (message.left || message.right);
        let movementDelta = options.screenWidth / BLOCKS_IN_WIDTH / 15;
        if (MOVING_DIAGNAL) movementDelta = movementDelta / 2;

        // TODO: calculate/cache this array on state tile change instead
        const tileList = [...this.state.tiles.values()].filter((tile) =>
          tile.imageId.includes("wall")
        );

        // W
        if (
          message.up &&
          !willCollide(player.x, player.y - movementDelta, tileList)
        )
          player.y -= movementDelta;
        // A
        if (
          message.left &&
          !willCollide(player.x - movementDelta, player.y, tileList)
        )
          player.x -= movementDelta;
        // S
        if (
          message.down &&
          !willCollide(player.x, player.y + movementDelta, tileList)
        )
          player.y += movementDelta;
        // D
        if (
          message.right &&
          !willCollide(player.x + movementDelta, player.y, tileList)
        )
          player.x += movementDelta;
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

// TODO: make alternative that finds the closest available x/y that doesnt collide
function willCollide(x: number, y: number, tiles: Tile[]): boolean {
  return tiles.some((tile) => {
    const top = tile.y - (TILE_SIZE / 2) * (tile?.scale || 1);
    const bottom = tile.y + (TILE_SIZE / 2) * (tile?.scale || 1);
    const left = tile.x - (TILE_SIZE / 2) * (tile?.scale || 1);
    const right = tile.x + (TILE_SIZE / 2) * (tile?.scale || 1);

    const playerSize = TILE_SIZE * (tile?.scale || 1) * 0.1;

    if (
      tile.x - (TILE_SIZE / 2) * (tile.scale || 1) < x &&
      tile.x + (TILE_SIZE / 2) * (tile.scale || 1) > x
    ) {
      const collideTop = y < top && y + playerSize > top;
      const collideBottom = y > bottom && y - playerSize < bottom;

      if (collideTop || collideBottom) return true;
    }
    if (
      tile.y - (TILE_SIZE / 2) * (tile.scale || 1) < y &&
      tile.y + (TILE_SIZE / 2) * (tile.scale || 1) > y
    ) {
      const collideLeft = x < left && x + playerSize > left;
      const collideRight = x > right && x - playerSize < right;

      if (collideLeft || collideRight) return true;
    }

    return false;
  });
}
