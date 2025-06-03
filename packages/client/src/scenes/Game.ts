import { Scene } from "phaser";
import { Room, Client, getStateCallbacks } from "colyseus.js";
import { getProfileImage, getUserName } from "../utils/discordSDK";
import {
  renderPlayerMovement,
  createBombUpdateCB,
  managePlayerInput,
  renderBaseTile,
  eRenderDepth,
} from "../utils/gameManagement";
import { tGameState, tGameStateTimeAttack } from "explosion-gyio";
import { Schema } from "@colyseus/schema";

enum eEmitTypes {
  MOVE = "move",
}

function splitIntoMatrix(matrixSize: number) {
  return (acc, item) => {
    if (acc!.at(-1)!.length >= matrixSize) acc.push("");
    acc[acc.length - 1] += item;
    return acc;
  };
}

const HUD = {
  HEALTH_HEART: "💖",
  HEALTH_MISSING_HEART: "💙",
  BOMB: "💣",
  SPEED: "👟",
};
const DEBUG = true;

export class Game extends Scene {
  room: Room<(tGameStateTimeAttack<Schema> | tGameState<Schema>) & Schema>;

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
        if (!Object.values(this.HUD).length) return returnValue;

        const emojiPerLine = 6;
        const fixedEmojiLineLength = emojiPerLine * 2;
        switch (prop) {
          case "bombCount":
          case "bombPlaced":
            {
              this.HUD.bombCount.setText(
                HUD.BOMB.repeat(
                  // Prevent it from going below 0. Can happen due to bombPlaced being updated before bombCount.
                  Math.max(
                    this.playerStats.bombCount - this.playerStats.bombPlaced,
                    0
                  )
                )
                  .split("")
                  .reduce<string[]>(splitIntoMatrix(fixedEmojiLineLength), [""])
              );
            }
            break;
          case "maxHealth":
          case "currentHealth":
            {
              const { maxHealth, currentHealth } = this.playerStats;
              // Prevent negative values breaking repeat func.
              const missingHeartLength = Math.max(maxHealth - currentHealth, 0);
              this.HUD.health.setText(
                (
                  HUD.HEALTH_HEART.repeat(currentHealth) +
                  HUD.HEALTH_MISSING_HEART.repeat(missingHeartLength)
                )
                  .split("")
                  .reduce<string[]>(splitIntoMatrix(fixedEmojiLineLength), [""])
              );
            }
            break;
          case "speed":
            this.HUD.speed.setText(
              HUD.SPEED.repeat(value)
                .split("")
                .reduce<string[]>(splitIntoMatrix(fixedEmojiLineLength), [""])
            );
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
    const HUDPadding = this.cameras.main.width * 0.008;
    const emojiSize = 69;
    const emojiHeightSpacing = emojiSize * -0.85;
    const HUDStyleSettings = {
      fontFamily: "Arial Black",
      fontSize: emojiSize,
      align: "center",
      lineSpacing: emojiHeightSpacing,
    };
    this.HUD = {
      health: this.add.text(
        HUDPadding,
        this.cameras.main.height * 0.01,
        HUD.HEALTH_HEART.repeat(3),
        {
          ...HUDStyleSettings,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 8,
        }
      ),
      bombCount: this.add.text(
        this.cameras.main.width * (1 / 3),
        this.cameras.main.height * 0.01,
        HUD.BOMB.repeat(1),
        {
          ...HUDStyleSettings,
        }
      ),
      speed: this.add.text(
        this.cameras.main.width * (1 / 3) * 2,
        this.cameras.main.height * -0.01,
        HUD.SPEED.repeat(1),
        {
          ...HUDStyleSettings,
        }
      ),
    };

    for (const textElm of Object.values(this.HUD))
      if ("setDepth" in textElm) textElm.setDepth(eRenderDepth.HUD);

    // /////////////////////////
    //        Power Ups
    // /////////////////////////
    $(this.room.state).powerUps.onAdd((powerUp, id) => {
      const powerUpSprite = renderBaseTile.call(this, powerUp);
      this.data.set(id, powerUpSprite);
    });

    $(this.room.state).powerUps.onRemove((_powerUp, id) => {
      this.data.get(id)?.destroy();
    });

    // /////////////////////////
    //     Map Rendering
    // /////////////////////////
    $(this.room.state).tiles.onAdd((tile, tileId) => {
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
    $(this.room.state).players.onAdd((player, playerId) => {
      if (!this.sessionIds.has(playerId)) this.sessionIds.add(playerId);

      // Create visual element of player
      const playerSpriteOriginal = this.add
        .circle(player.x, player.y, 32, 0xff0000)
        .setDepth(eRenderDepth.PLAYER);

      type tMoveSubFc = (coords: { x: number; y: number }) => unknown;
      const playerSprite = new Proxy(playerSpriteOriginal, {
        set(target, p, newValue, receiver) {
          const returnVal = Reflect.set(target, p, newValue);
          try {
            if (p === "x" || p === "y") {
              const emitArgs: Parameters<tMoveSubFc>[0] = {
                x: target.x,
                y: target.y,
              };
              target.emit(eEmitTypes.MOVE, emitArgs);
            }
          } catch (error) {
          } finally {
            return returnVal;
          }
        },
      });

      this.data.set(playerId, playerSprite);

      // Load in discord image
      if (player.imageId.startsWith("http")) {
        this.load.image(playerId, player.imageId);
        this.load.once("filecomplete-image-" + playerId, () => {
          const newSprite = this.add.sprite(
            playerSprite.x,
            playerSprite.y,
            this.textures.get(playerId)
          );
          const mask = playerSprite.createGeometryMask();
          newSprite.setDisplaySize(
            playerSprite.displayWidth * 1.05,
            playerSprite.displayHeight * 1.05
          );
          newSprite.setMask(mask);
          newSprite.setDepth(eRenderDepth.PLAYER);
          playerSprite.data.set("image", newSprite);
          playerSprite.on(eEmitTypes.MOVE, function ({ y, x }) {
            newSprite.y = y;
            newSprite.x = x;
          });
        });

        this.load.start();
      }

      // if player data is the currently connected player, update UI variables.
      if (playerId === this.room.sessionId) {
        this.playerStats.maxHealth = player.health;
        this.playerStats.currentHealth = player.health;
      } else {
        // Render HUDs for other players
        const offset = (player.scale || 1) * (16 * 2);
        // Initialize player health above head
        const paddingY = offset * 1.1;
        const healthHud = this.add.text(
          player.x,
          player.y,
          HUD.HEALTH_HEART.repeat(player.health)
            .split("")
            .reduce(splitIntoMatrix(3 * 2), [""]),
          { fontSize: 24 }
        );
        healthHud.setDepth(eRenderDepth.HUD);
        healthHud.setDataEnabled();
        const paddingXHud = healthHud.displayWidth / 2;
        const paddingYHud = paddingY;

        const updateHealthPos: tMoveSubFc = function ({ x, y }) {
          healthHud.setX(x - paddingXHud);
          healthHud.setY(y + paddingYHud);
        };
        updateHealthPos(player);
        playerSprite.on(eEmitTypes.MOVE, updateHealthPos);
        this.data.set(playerId + "healthHud", healthHud);

        const usernamePaddingY = paddingY * 1.5;
        const usernameHud = this.add.text(player.x, player.y, player.username, {
          fontSize: 24,
          color: "#000",
          stroke: "#ffffff",
          strokeThickness: 8,
        });
        const usernamePaddingX = usernameHud.displayWidth * 0.5;
        usernameHud.setDataEnabled();
        usernameHud.setDepth(eRenderDepth.HUD);
        const updateHudPos: tMoveSubFc = function ({ x, y }) {
          usernameHud.setY(y - usernamePaddingY);
          usernameHud.setX(x - usernamePaddingX);
        };
        updateHudPos(player);
        playerSprite.on("moved", updateHudPos);
        this.data.set(playerId + "usernameHud", usernameHud);
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

      // Assign user input once, as its a reference, and will get updates from colosyeus.
      if (player.userInput) {
        this.inputPayload = player.userInput;
      }

      $(player).onChange(() => {
        const playerSprite = this.data.get(playerId) as Phaser.GameObjects.Arc;
        if (!playerSprite) return;

        playerSprite.setData("serverX", player.x);
        playerSprite.setData("serverY", player.y);

        if (playerId === this.room.sessionId) {
          if (player.health > this.playerStats.maxHealth)
            this.playerStats.maxHealth = player.health;
          if (player.health !== this.playerStats.currentHealth)
            this.playerStats.currentHealth = player.health;
        } else {
          const textOb = this.data.get(
            playerId + "healthHud"
          ) as Phaser.GameObjects.Text;
          if (player.health * 2 !== textOb.text.length) {
            textOb.setText(
              HUD.HEALTH_HEART.repeat(player.health)
                .split("")
                .reduce(splitIntoMatrix(3 * 2), [""])
            );
          }
        }
      });
    });

    $(this.room.state).players.onRemove((_player, playerId) => {
      this.data.get(playerId)?.destroy();
      this.data.get(playerId + "healthHud")?.destroy();
      this.data.get(playerId + "usernameHud")?.destroy();
      this.data.remove(playerId);
      this.data.remove(playerId + "healthHud");
      this.data.remove(playerId + "usernameHud");
      this.sessionIds.delete(playerId);
    });

    // /////////////////////////
    //         Debug
    // /////////////////////////
    if (DEBUG) {
      const debugStyle: Parameters<typeof this.add.text>["3"] = {
        font: "24px Arial",
        color: "#000000",
        strokeThickness: 14,
        stroke: "#fff",
      };
      const userName = getUserName();
      this.add
        .text(
          this.cameras.main.width * 0.5,
          this.cameras.main.height * 0.95,
          `Connected as: ${userName}`,
          debugStyle
        )
        .setOrigin(0.5)
        .setDepth(eRenderDepth.HUD);
      this.data.set(
        "DEBUG-mouse",
        this.add
          .text(
            this.cameras.main.width * 0.5,
            this.cameras.main.height * 0.05,
            `X: ${this.input.mousePointer.x} || Y: ${this.input.mousePointer.y}`,
            debugStyle
          )
          .setOrigin(0.5)
          .setDepth(200)
      );
    }
  }

  /**
   * Things we want to send to the server.
   * Its at a fixed rate so we dont DDoS ourselves with our own players
   */
  fixedTick() {
    if (!this.room) return;

    // Send player Input to the server
    managePlayerInput.call(this);

    if (DEBUG) {
      this.data
        .get("DEBUG-mouse")
        ?.setText(
          `X: ${this.input.mousePointer.x.toFixed(
            2
          )} || Y: ${this.input.mousePointer.y.toFixed(2)}`
        );
    }
  }
  elapsedTime = 0;
  /**
   * How many updates to send per second
   */
  fixedTimeStep = 1000 / (60 * 20);
  update(time: number, delta: number): void {
    // skip loop if not connected yet.
    if (!this.room) {
      return;
    }

    /**
     * // //////////////////////////
     * / /  Render Player Movement
     * // //////////////////////////
     *
     * Always sync it every update, as the timestep is taken care of by the server.
     * This decreases percieved latency for the users.
     */
    renderPlayerMovement.call(this);

    this.elapsedTime += delta;
    while (this.elapsedTime >= this.fixedTimeStep) {
      this.elapsedTime -= this.fixedTimeStep;
      this.fixedTick();
    }
  }

  async connect() {
    const url =
      location.host === "localhost:3000"
        ? `ws://localhost:3001`
        : `wss://${location.host}/.proxy/api/colyseus`;

    const client = new Client(`${url}`);

    try {
      this.room = await client.joinOrCreate("timeAttack", {
        // Let's send our client screen dimensions to the server for initial positioning
        screenWidth: this.game.config.width,
        screenHeight: this.game.config.height,
        userName: getUserName(),
        avatar: getProfileImage(),
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
