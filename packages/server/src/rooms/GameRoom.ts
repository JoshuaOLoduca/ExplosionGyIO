import { Client, Room } from "colyseus";
import { GameState, Draggables } from "../schemas/GameState";
import roomLayoutGenerator, { tRoomTile } from "../utils/roomLayoutGenerator";

function getImageId(tile: tRoomTile) {
  switch (tile) {
    case "x":
      return "cross" as const;
    case "c":
      return "alien" as const;
    default:
      return "grid" as const;
  }
}

export class GameRoom extends Room<GameState> {
  state = new GameState();
  maxClients = 25; // Current Discord limit is 25

  onCreate(options: any): void | Promise<any> {
    const initialMap = roomLayoutGenerator(10, 10, 0);
    initialMap.forEach((mapSlice, sliceIndex) => {
      mapSlice.forEach((tile, tileIndex) => {
        const draggableObject = new Draggables();

        draggableObject.x = (tileIndex + 1) * 100;
        draggableObject.y = (sliceIndex + 1) * 100;
        draggableObject.imageId = getImageId(tile);

        this.state.draggables.set(
          sliceIndex + tile + tileIndex,
          draggableObject
        );
      });
    });

    this.onMessage("move", (client, message) => {
      // Update image position based on data received
      const image = this.state.draggables.get(message.imageId);
      if (image) {
        image.x = message.x;
        image.y = message.y;
        this.broadcast("move", this.state.draggables);
      }
    });
  }

  onJoin(client: Client, options?: any, auth?: any): void | Promise<any> {
    console.log(`Client joined: ${client.sessionId}`);
  }

  onLeave(client: Client, consented: boolean): void | Promise<any> {
    console.log(`Client left: ${client.sessionId}`);
  }
}
