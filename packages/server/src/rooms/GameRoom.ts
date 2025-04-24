import { Client, Room } from "colyseus";
import { GameState, Player, Tile } from "../schemas/GameState";
import roomLayoutGenerator, { tRoomTile } from "../utils/roomLayoutGenerator";

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

  onCreate(options: {
    screenWidth: number;
    screenHeight: number;
  }): void | Promise<any> {
    const BLOCKS_IN_WIDTH = 19;
    const TILE_SIZE = 16;
    const ratio = (options.screenWidth / (TILE_SIZE * BLOCKS_IN_WIDTH)) * 1.01;
    console.log({ ratio });

    const initialMap = roomLayoutGenerator(11, 19, 0);
    initialMap.forEach((mapSlice, sliceIndex) => {
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
