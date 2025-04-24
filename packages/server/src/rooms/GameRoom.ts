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

    this.onMessage(0, (client: Client, message: 0 | 1 | 2 | 3) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      switch (message) {
        // W
        case 0:
          player.y -= 100;
          break;
        // A
        case 1:
          player.x -= 100;
          break;
        // S
        case 2:
          player.y += 100;
          break;
        // D
        case 3:
          player.x += 100;
          break;

        default:
          break;
      }
    });
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
