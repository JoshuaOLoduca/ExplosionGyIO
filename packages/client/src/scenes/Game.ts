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
      const image = this.add
        .image(draggable.x, draggable.y, draggable.imageId)
        .setInteractive();
      image.name = tileId;
      image.setScale(0.8);
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
