import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class BaseTile extends Schema {
  constructor(parent?: BaseTile) {
    super();
    this.parent = parent;
    this.id = (Math.random() * 10000).toFixed(10);
  }

  parent?: BaseTile;

  id: string;

  data = new Map();

  @type("number")
  x = 0;

  @type("number")
  y = 0;

  @type("number")
  scale?: number = undefined;

  @type("string")
  imageId = "";

  @type("int16")
  angle = 0;
}

export class Explosion extends BaseTile {
  @type("uint8")
  damage = 1;

  @type("uint16")
  lingerMs = 500;
}

type tUserInput = {
  up: boolean;
  left: boolean;
  down: boolean;
  right: boolean;
  placeBomb: boolean;
};

export type tUserInputQueue = [time: number, message: tUserInput];

export class Player extends BaseTile {
  private _maxInputQueue = 10;
  private _inputQueue: tUserInputQueue[] = new Array(this._maxInputQueue).fill(
    []
  );
  private _lastInputQueueIndex = 0;

  addInputToQueue(input: tUserInputQueue) {
    if (!input) return false;
    if (this._lastInputQueueIndex >= this._maxInputQueue) {
      this._lastInputQueueIndex = 0;
    }

    this._inputQueue[this._lastInputQueueIndex++] = input;
    return true;
  }

  getLatestInput(epoch: number) {
    return this._inputQueue.find((currentInput, index, arr) => {
      if (
        currentInput[0] <= epoch &&
        (!arr[index + 1] || arr[index + 1][0] > epoch)
      ) {
        return true;
      }
      return false;
    });
  }

  @type("string")
  sprite = "p";

  @type("string")
  clientId = "";

  @type("uint8")
  health = 3;

  /**
   * miliseconds player is invincible for.
   * when at 0, can take damage
   */
  @type("uint16")
  invincible = 0;

  addDamage(
    damageAmount: number,
    invincibleLengthMs = 300,
    /**
     * How often to calculate how much active invincibility is left
     */
    invincibleUpdateRateMs = 25
  ) {
    if (this.invincible === 0 && this.health > 0) {
      this.health -= damageAmount;
      this.invincible = invincibleLengthMs;

      /**
       * lower is faster. min 1
       */
      const updateRate = invincibleUpdateRateMs;

      const invincibleCD = setInterval(() => {
        this.invincible -= updateRate;
        if (this.invincible <= 0) {
          clearInterval(invincibleCD);
          this.invincible = 0;
        }
      }, updateRate);
    }
  }
}

export class Bomb extends BaseTile {
  /**
   * Once it hits 0, it will explode. Currently assuming its miliseconds
   */
  @type("uint16")
  fuse = 10;

  @type({ array: Explosion })
  explosions = new ArraySchema<Explosion>();

  @type(Player)
  owner?: Player = undefined;
}

export class Tile extends BaseTile {
  /**
   * each tile can only have a single bomb.
   */
  @type(Bomb)
  bomb?: Bomb = undefined;
}

export class GameState extends Schema {
  @type({ map: Tile })
  tiles = new MapSchema<Tile>();

  @type({ map: Player })
  players = new MapSchema<Player>();
}
