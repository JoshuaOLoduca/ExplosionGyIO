import { Scene } from "phaser";
import { Room, Client, getStateCallbacks } from "colyseus.js";
import { getUserName } from "../utils/discordSDK";

export class Game extends Scene {
  room: Room;

  constructor() {
    super("Game");
  }

  async create() {
    this.scene.launch("background");

    await this.connect();

    const $ = getStateCallbacks(this.room);

    $(this.room.state).tiles.onAdd((draggable: any, tileId: string) => {
      if (draggable.imageId === "crate") {
        const image = this.add
          .sprite(draggable.x, draggable.y, "gameSprites", "grass")
          .setInteractive();
        image.setScale(draggable?.scale || 6.225);
        const image2 = this.add
          .sprite(draggable.x, draggable.y, "gameSprites", "crate")
          .setInteractive();
        image2.setScale((draggable?.scale || 6.225) * 0.95);
      } else {
        const image = this.add
          .sprite(draggable.x, draggable.y, "gameSprites", draggable.imageId)
          .setInteractive();
        image.setScale(draggable?.scale || 6.225);
      }
    });

    this.add
      .text(
        this.cameras.main.width * 0.5,
        this.cameras.main.height * 0.95,
        `Connected as: ${getUserName()}`,
        {
          font: "14px Arial",
          color: "#000000",
        }
      )
      .setOrigin(0.5);
  }

  async connect() {
    const url =
      location.host === "localhost:3000"
        ? `ws://localhost:3001`
        : `wss://${location.host}/.proxy/api/colyseus`;

    const client = new Client(`${url}`);

    try {
      this.room = await client.joinOrCreate("game", {
        // Let's send our client screen dimensions to the server for initial positioning
        screenWidth: this.game.config.width,
        screenHeight: this.game.config.height,
      });

      this.room.onMessage("move", (message) => {
        //console.log("Move message received:", message);
      });

      console.log("Successfully connected!");
    } catch (e) {
      console.log(`Could not connect with the server: ${e}`);
    }
  }
}
