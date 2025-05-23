import { Client, Room } from "colyseus";
import {
  Tile,
  Bomb,
  Player,
  tUserInputQueue,
  BaseTile,
  GameState,
} from "../schemas";
import roomLayoutGenerator, {
  tRoomMatrix,
  tRoomTile,
} from "../utils/roomLayoutGenerator";
import {
  manageBombDamageToBomb,
  manageDamageToPlayers,
  managePlayerMovement,
  manageBombPlacement,
  managePowerUpPlacement,
  managePowerUpPickup,
} from "../utils/gameManagement";
import { manageBombDamageToCrate } from "../utils/gameManagement/manageBombDamageToCrates";
import { StateView } from "@colyseus/schema";

export const TILE_SIZE = 16;
export const BLOCKS_IN_WIDTH = 19;

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

type tGameOptions = {
  screenWidth: number;
  screenHeight: number;
};

export class GameRoom extends Room<GameState> {
  state = new GameState();
  maxClients = 25; // Current Discord limit is 25
  initialMap: tRoomMatrix = roomLayoutGenerator(3, 3, 0);
  COLLISION_TILES = [
    "wall",
    "crate",
    // "bomb_big_1",
    // "bomb_big_2",
    // "bomb_big_3",
    // "bomb_big_4",
    // "bomb_big_5",
    // "bomb_big_6",
  ];
  BOMBS = new Set<Bomb>();
  lastUpdate = Date.now();
  powerupDropCountdownMs = Math.round(1000 * 45);
  collisionTileSet = new Set<BaseTile>();
  grassTileSet = new Set<Tile>();

  onCreate(options: tGameOptions): void | Promise<any> {
    const ratio = (options.screenWidth / (TILE_SIZE * BLOCKS_IN_WIDTH)) * 1.01;

    this.initialMap = roomLayoutGenerator(11, 19, 0.1);
    this.initialMap.forEach((mapSlice, sliceIndex) => {
      mapSlice.forEach((tile, tileIndex) => {
        const tileObject = new Tile();

        tileObject.x = +(
          (tileIndex + 0.5) *
          (options.screenWidth / BLOCKS_IN_WIDTH)
        ).toFixed(0);
        tileObject.y = +(
          (sliceIndex + 0.5) *
          (options.screenWidth / BLOCKS_IN_WIDTH)
        ).toFixed(0);
        tileObject.imageId = getImageId(tile);
        tileObject.scale = ratio;

        const id = sliceIndex + tile + tileIndex;
        tileObject.data.set("stateId", id);
        this.state.tiles.set(id, tileObject);
      });
    });
    // TODO: calculate/cache this array on state tile change instead
    const arrOfTileState = [...this.state.tiles.values()];

    // Initialize Grass tiles Cache
    arrOfTileState
      .filter((tile) => tile.imageId.includes("grass"))
      .forEach(this.grassTileSet.add, this.grassTileSet);

    // Initialize collisions
    arrOfTileState
      .filter((tile) => this.COLLISION_TILES.includes(tile.imageId))
      .forEach(this.collisionTileSet.add, this.collisionTileSet);

    const originalPowerUpDropCountdown = this.powerupDropCountdownMs;
    const fixedTimeStep = 1000 / 60;

    let elapsedTime = 0;
    this.setSimulationInterval((deltaTime) => {
      elapsedTime += deltaTime;
      while (elapsedTime >= fixedTimeStep) {
        elapsedTime -= fixedTimeStep;
        this.powerupDropCountdownMs -= fixedTimeStep;
        this.fixedTick(
          deltaTime,
          Array.from(this.grassTileSet),
          Array.from(this.collisionTileSet),
          options
        );
        if (this.powerupDropCountdownMs <= 0)
          this.powerupDropCountdownMs = Math.round(
            (Math.random() + 0.5) * originalPowerUpDropCountdown
          );
      }
    });

    this.onMessage(
      0,
      (
        client: Client,
        message: {
          up: boolean;
          down: boolean;
          left: boolean;
          right: boolean;
          placeBomb: boolean;
        }
      ) => {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        player.input.add([Date.now(), message]);
      }
    );
  }

  fixedTick(
    deltaTime: number,
    arrOfGrassTiles: BaseTile[],
    tileCollisionListPrimary: BaseTile[],
    options: tGameOptions
  ) {
    this.lastUpdate = Date.now();
    const bombTileList = Array.from(this.BOMBS);

    const tileCollisionList = Array.from(tileCollisionListPrimary).concat(
      bombTileList.filter((bomb) => !!bomb.fuse)
    );

    // ////////////////////////////////////
    //           BOMB
    //  before movement so it places the
    //  bomb where the user IS, not where
    //  They will be.
    // ////////////////////////////////////

    // Process inputs on order we recieved it
    const allMessagesInOrder = Array.from(this.state.players.values())
      .flatMap((player) => {
        const container: [Player, tUserInputQueue][] = [];
        const input = player.input.get(this.lastUpdate);
        if (input) container.push([player, input]);

        return container;
      })
      .sort(([_, [timeA]], [__, [timeB]]) => timeA - timeB);

    allMessagesInOrder.forEach(([player, [_, message]]) => {
      if (message.placeBomb) {
        manageBombPlacement.call(this, arrOfGrassTiles, player);
      }

      // ///////////////////////////
      //         MOVEMENT
      // ///////////////////////////
      managePlayerMovement(
        options,
        arrOfGrassTiles,
        player,
        tileCollisionList,
        message
      );

      // /////////////////////////
      //    Power Up Pickup
      // /////////////////////////
      managePowerUpPickup.call(this, arrOfGrassTiles, player);

      // /////////////////////////
      //    Damage Collision
      // /////////////////////////
      const explosionTiles = Array.from(this.BOMBS).flatMap((bomb) =>
        bomb.explosions.toArray()
      );
      if (explosionTiles.length) {
        // //////////////////////
        //     Crate Damage
        // //////////////////////
        manageBombDamageToCrate.call(
          this,
          Array.from(this.state.tiles.values()).filter((tile) =>
            tile.imageId.includes("crate")
          ),
          explosionTiles
        );

        // //////////////////////
        //     Player Damage
        // //////////////////////
        manageDamageToPlayers(player, explosionTiles);

        // //////////////////////
        //     Damage To Bombs
        // //////////////////////
        manageBombDamageToBomb(bombTileList, explosionTiles);
      }
    });

    if (this.powerupDropCountdownMs <= 0)
      managePowerUpPlacement.call(this, arrOfGrassTiles);
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
    if (options.userName) player.username = options.userName;
    if (options.avatar) player.imageId = options.avatar.url;
    player.x = spawnTile.x;
    player.y = spawnTile.y;

    this.state.players.set(client.sessionId, player);

    // Allows the connected user to get their powerup state, and ONLY them.
    if (!client.view) client.view = new StateView();
    if (!client.view.has(player)) client.view.add(player);
  }

  onLeave(client: Client, consented: boolean): void | Promise<any> {
    console.log(`Client left: ${client.sessionId}`);
    this.state.players.delete(client.sessionId);
  }
}
