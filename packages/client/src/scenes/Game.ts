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
    const colyseusRoom = this;

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

    const bigTest = [
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    ];

    bigTest.forEach((phaserKey, index) =>
      phaserKey?.on("down", function (event) {
        colyseusRoom.room.send(0, index);
      })
    );

    $(this.room.state).players.onAdd((player, playerId) => {
      const playerSprite = this.add.circle(player.x, player.y, 32, 0xff0000);
      this.data.set(playerId, playerSprite);

      $(player).onChange(() => {
        const playerSprite = this.data.get(playerId);
        if (!playerSprite) return;
        playerSprite.x = player.x;
        playerSprite.y = player.y;
      });
    });

    $(this.room.state).players.onRemove((player, playerId) => {
      this.data.get(playerId)?.destroy();
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

      this.room.onMessage("", (message) => {
        console.log("Move message received:", message);
      });

      console.log("Successfully connected!");
    } catch (e) {
      console.log(`Could not connect with the server: ${e}`);
    }
  }
}
