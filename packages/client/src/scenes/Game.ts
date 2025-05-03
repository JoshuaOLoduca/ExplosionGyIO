import { Scene } from "phaser";
import { Room, Client, getStateCallbacks } from "colyseus.js";
import { getUserName } from "../utils/discordSDK";
import {
  renderPlayerMovement,
  createBombUpdateCB,
  managePlayerInput,
  renderBaseTile,
} from "../utils/gameManagement";

const DEBUG = false;

export class Game extends Scene {
  room: Room;

  sessionIds: Set<string> = new Set();
  inputPayload = {
    up: false,
    left: false,
    down: false,
    right: false,
    placeBomb: false,
  };

  constructor() {
    super("Game");
  }

  async create() {
    this.scene.launch("background");

    await this.connect();

    const $ = getStateCallbacks(this.room);
    const colyseusRoom = this;

    $(this.room.state).powerUps.onAdd((powerUp: any, id: string) => {
      renderBaseTile.call(this, powerUp);
    });

    $(this.room.state).tiles.onAdd((tile: any, tileId: string) => {
      if (tile.imageId === "crate") {
        renderBaseTile.call(this, { ...tile, imageId: "grass" });
        renderBaseTile.call(this, {
          ...tile,
          imageId: "crate",
          scale: (tile.scale || 1) * 0.9,
        });
      } else {
        renderBaseTile.call(this, tile);
      }

      const updateBombState = createBombUpdateCB.call(this, $, tile, tileId);

      updateBombState();

      $(tile).onChange(() => {
        updateBombState();
      });
    });

    $(this.room.state).players.onAdd((player, playerId) => {
      if (!this.sessionIds.has(playerId)) this.sessionIds.add(playerId);
      const playerSprite = this.add.circle(player.x, player.y, 32, 0xff0000);
      this.data.set(playerId, playerSprite);

      $(player).onChange(() => {
        const playerSprite = this.data.get(playerId);
        if (!playerSprite) return;
        playerSprite.setData("serverX", player.x);
        playerSprite.setData("serverY", player.y);
      });
    });

    $(this.room.state).players.onRemove((player, playerId) => {
      this.data.get(playerId)?.destroy();
      this.sessionIds.delete(playerId);
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

    if (DEBUG) {
      setTimeout(() => {
        this.data.set(
          "DEBUG-mouse",
          this.add
            .text(
              this.cameras.main.width * 0.5,
              this.cameras.main.height * 0.05,
              `X: ${this.input.mousePointer.x} || Y: ${this.input.mousePointer.y}`,
              {
                font: "24px Arial",
                color: "#000000",
                strokeThickness: 14,
                stroke: "#fff",
              }
            )
            .setOrigin(0.5)
        );
      }, 1000 * 0.5);
    }
  }

  fixedTick(time: number, delta: number) {
    if (!this.room) return;
    if (DEBUG) {
      this.data
        .get("DEBUG-mouse")
        ?.setText(
          `X: ${this.input.mousePointer.x.toFixed(
            2
          )} || Y: ${this.input.mousePointer.y.toFixed(2)}`
        );
    }

    // //////////////////////////
    //   Render Player Movement
    // //////////////////////////
    renderPlayerMovement.call(this);
  }
  elapsedTime = 0;
  fixedTimeStep = 1000 / (60 * 1);
  update(time: number, delta: number): void {
    // skip loop if not connected yet.
    if (!this.room) {
      return;
    }

    // //////////////////////////
    //      Player Input
    // //////////////////////////
    managePlayerInput.call(this);

    this.elapsedTime += delta;
    while (this.elapsedTime >= this.fixedTimeStep) {
      managePlayerInput.call(this);
      this.elapsedTime -= this.fixedTimeStep;
      this.fixedTick(time, this.fixedTimeStep);
    }
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
