import { Client, Room } from "colyseus";
import { GameState, Tiles } from "../schemas/GameState";
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

  onCreate(options: any): void | Promise<any> {
    const initialMap = roomLayoutGenerator(11, 11, 0);
    initialMap.forEach((mapSlice, sliceIndex) => {
      mapSlice.forEach((tile, tileIndex) => {
        const tileObject = new Tiles();

        tileObject.x = (tileIndex + 0.5) * 100;
        tileObject.y = (sliceIndex + 0.5) * 100;
        tileObject.imageId = getImageId(tile);

        this.state.tiles.set(sliceIndex + tile + tileIndex, tileObject);
      });
    });
  }

  onJoin(client: Client, options?: any, auth?: any): void | Promise<any> {
    console.log(`Client joined: ${client.sessionId}`);
  }

  onLeave(client: Client, consented: boolean): void | Promise<any> {
    console.log(`Client left: ${client.sessionId}`);
  }
}
