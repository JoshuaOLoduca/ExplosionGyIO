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
import { MapSchema, Schema } from "@colyseus/schema";

type tPlayerSchema = tPlayer<Schema, Schema>;
type tTileSchema = tTile<Schema>;
type tPowerUpSchema = tPowerUp<Schema>;

const HUD = {
  HEALTH_HEART: "💖",
  HEALTH_MISSING_HEART: "💙",
  BOMB: "💣",
  SPEED: "👟",
};
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
  HUD: {
    health: Phaser.GameObjects.Text;
    bombCount: Phaser.GameObjects.Text;
    speed: Phaser.GameObjects.Text;
  };
  private _playerStats = {
    maxHealth: 0,
    currentHealth: 3,
    bombCount: 1,
    bombPlaced: 0,
    speed: 1,
  };

  playerStats: typeof this._playerStats;

  constructor() {
    super("Game");

    /**
     * Listen for updates to player stats, and update the HUD accordingly
     */
    this.playerStats = new Proxy(this._playerStats, {
      set: (obj, prop: keyof typeof this._playerStats, value) => {
        const returnValue = Reflect.set(obj, prop, value);

        switch (prop) {
          case "bombCount":
          case "bombPlaced":
            if (this.HUD.bombCount)
              this.HUD.bombCount.setText(
                HUD.BOMB.repeat(
                  // Prevent it from going below 0. Can happen due to bombPlaced being updated before bombCount.
                  Math.max(
                    this.playerStats.bombCount - this.playerStats.bombPlaced,
                    0
                  )
                )
              );
            break;
          case "maxHealth":
          case "currentHealth":
            {
              const { maxHealth, currentHealth } = this.playerStats;
              // Prevent negative values breaking repeat func.
              const missingHeartLength = Math.max(maxHealth - currentHealth, 0);
              this.HUD.health.setText(
                HUD.HEALTH_HEART.repeat(currentHealth) +
                  HUD.HEALTH_MISSING_HEART.repeat(missingHeartLength)
              );
            }
            break;
          case "speed":
            this.HUD.speed.setText(HUD.SPEED.repeat(value));
            break;
        }
        return returnValue;
      },
    });
  }

  async create() {
    this.scene.launch("background");

    await this.connect();

    const $ = getStateCallbacks(this.room);
    this.HUD = {
      health: this.add.text(
        this.cameras.main.width * 0.008,
        this.cameras.main.height * 0.01,
        HUD.HEALTH_HEART.repeat(3),
        {
          fontFamily: "Arial Black",
          fontSize: 69,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
          align: "center",
        }
      ),
      bombCount: this.add.text(
        this.cameras.main.width * 0.25,
        this.cameras.main.height * 0.01,
        HUD.BOMB.repeat(1),
        {
          fontFamily: "Arial Black",
          fontSize: 69,
          align: "center",
        }
      ),
      speed: this.add.text(
        this.cameras.main.width * 0.5,
        this.cameras.main.height * 0.01,
        HUD.SPEED.repeat(1),
        {
          fontFamily: "Arial Black",
          fontSize: 69,
          align: "center",
        }
      ),
    };

    for (const textElm of Object.values(this.HUD))
      if ("setDepth" in textElm) textElm.setDepth(eRenderDepth.HUD);

    // /////////////////////////
    //        Power Ups
    // /////////////////////////
    $(this.room.state).powerUps.onAdd((powerUp: tPowerUpSchema, id: string) => {
      const powerUpSprite = renderBaseTile.call(this, powerUp);
      this.data.set(id, powerUpSprite);
    });

    $(this.room.state).powerUps.onRemove(
      (_powerUp: tPowerUpSchema, id: string) => {
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

        const playerSprite = this.add
          .circle(player.x, player.y, 32, 0xff0000)
          .setDepth(eRenderDepth.PLAYER);
        this.data.set(playerId, playerSprite);

        if (playerId === this.room.sessionId) {
          this.playerStats.maxHealth = player.health;
          this.playerStats.currentHealth = player.health;
        }

        if (player.powerUps)
          $(player.powerUps).onChange((value, powerUp) => {
            if (playerId !== this.room.sessionId) return;
            switch (powerUp) {
              case "speed":
                this.playerStats.speed = value;
                break;
              case "bombSize":
                break;
              case "bombCount":
                this.playerStats.bombCount = value;
                break;
              case "bombDamage":
                break;
            }
          });

        $(player).onChange(() => {
          const playerSprite = this.data.get(playerId);
          if (!playerSprite) return;
          playerSprite.setData("serverX", player.x);
          playerSprite.setData("serverY", player.y);

          if (playerId === this.room.sessionId) {
            if (player.health > this.playerStats.maxHealth)
              this.playerStats.maxHealth = player.health;
            if (player.health !== this.playerStats.maxHealth)
              this.playerStats.currentHealth = player.health;
          }
        });
      }
    );

    $(this.room.state).players.onRemove(
      (_player: tPlayerSchema, playerId: string) => {
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

  fixedTick(_time: number, _delta: number) {
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
