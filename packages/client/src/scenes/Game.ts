import { Scene } from "phaser";
import { Room, Client, getStateCallbacks } from "colyseus.js";
import { getUserName } from "../utils/discordSDK";
import {
  renderPlayerMovement,
  createBombUpdateCB,
  managePlayerInput,
  renderBaseTile,
  eRenderDepth,
} from "../utils/gameManagement";
import { tPlayer, tPowerUp, tTile } from "explosion-gyio";
import { Schema } from "@colyseus/schema";

type tPlayerSchema = tPlayer<Schema>;
type tTileSchema = tTile<Schema>;
type tPowerUpSchema = tPowerUp<Schema>;

const HEALTH_HEART = "💖";
const HEALTH_MISSING_HEART = "💙";
const DEBUG = true;

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
  HUD: { health: Phaser.GameObjects.Text };
  playerStats = {
    maxHealth: 0,
  };

  constructor() {
    super("Game");
  }

  async create() {
    this.scene.launch("background");

    await this.connect();

    const $ = getStateCallbacks(this.room);
    this.HUD = {
      health: this.add.text(
        this.cameras.main.width * 0.008,
        this.cameras.main.height * 0.01,
        HEALTH_HEART.repeat(3),
        {
          fontFamily: "Arial Black",
          fontSize: 69,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
          align: "center",
        }
      ),
    };

    this.HUD.health.setDepth(eRenderDepth.HUD);

    // /////////////////////////
    //        Power Ups
    // /////////////////////////
    $(this.room.state).powerUps.onAdd((powerUp: tPowerUpSchema, id: string) => {
      const powerUpSprite = renderBaseTile.call(this, powerUp);
      this.data.set(id, powerUpSprite);
    });

    $(this.room.state).powerUps.onRemove(
      (powerUp: tPowerUpSchema, id: string) => {
        this.data.get(id)?.destroy();
      }
    );

    // /////////////////////////
    //     Map Rendering
    // /////////////////////////
    $(this.room.state).tiles.onAdd((tile: tTileSchema, tileId: string) => {
      const initAsCrate = tile.imageId === "crate";
      let crateSprite;
      if (initAsCrate) {
        renderBaseTile.call(this, { ...tile, imageId: "grass" });
        crateSprite = renderBaseTile.call(this, {
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
        if (initAsCrate && tile.imageId !== "crate") {
          crateSprite?.destroy();
        }
      });
    });

    // /////////////////////////
    //  Player Join/Quit/Change
    // /////////////////////////
    $(this.room.state).players.onAdd(
      (player: tPlayerSchema, playerId: string) => {
        if (!this.sessionIds.has(playerId)) this.sessionIds.add(playerId);
        // resyncronizes the private variables to their typed name
        player.powerUps = (player as any)._powerUps;

        const playerSprite = this.add
          .circle(player.x, player.y, 32, 0xff0000)
          .setDepth(eRenderDepth.PLAYER);
        this.data.set(playerId, playerSprite);

        if (playerId === this.room.sessionId) {
          this.HUD.health.setText(HEALTH_HEART.repeat(player.health));
          this.playerStats.maxHealth = player.health;
        }

        $(player).onChange(() => {
          const playerSprite = this.data.get(playerId);
          if (!playerSprite) return;
          playerSprite.setData("serverX", player.x);
          playerSprite.setData("serverY", player.y);

          if (playerId === this.room.sessionId) {
            if (player.health > this.playerStats.maxHealth)
              this.playerStats.maxHealth = player.health;

            const { maxHealth } = this.playerStats;
            this.HUD.health.setText(
              HEALTH_HEART.repeat(player.health) +
                HEALTH_MISSING_HEART.repeat(maxHealth - player.health)
            );
          }
        });
      }
    );

    $(this.room.state).players.onRemove(
      (player: tPlayerSchema, playerId: string) => {
        this.data.get(playerId)?.destroy();
        this.data.remove(playerId);
        this.sessionIds.delete(playerId);
      }
    );

    // /////////////////////////
    //         Debug
    // /////////////////////////
    if (DEBUG) {
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
          .setDepth(200)
      );
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
      this.elapsedTime -= this.fixedTimeStep;
      this.fixedTick(time, this.fixedTimeStep);
      managePlayerInput.call(this);
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
