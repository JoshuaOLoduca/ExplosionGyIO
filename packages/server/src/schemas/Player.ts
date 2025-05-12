import { type } from "@colyseus/schema";
import { BaseTile } from "./BaseTile";
import { powerUpTypes, tPowerUps } from "./PowerUp";
import type { tPlayer, tUserInput } from "explosion-gyio";

export type tUserInputQueue = [time: number, message: tUserInput];

export class Player extends BaseTile implements tPlayer {
  private _maxInputQueue = 10;
  private _inputQueue: tUserInputQueue[] = new Array(this._maxInputQueue).fill(
    []
  );
  private _lastInputQueueIndex = 0;
  private _powerUps = new Map<tPowerUps, number>();

  constructor() {
    super();
    powerUpTypes.forEach((powerUp) => this._powerUps.set(powerUp, 1));
  }

  powerups = {
    hasExplosionPen: () => {
      return false;
    },
    change: (powerup: tPowerUps, changeAmount: number) => {
      this._powerUps.set(powerup, this.powerups.get(powerup) + changeAmount);
      return true;
    },
    set: (powerup: tPowerUps, newValue: number) => {
      this._powerUps.set(powerup, newValue);
      return true;
    },
    get: (powerup: tPowerUps) => {
      return this._powerUps.get(powerup) || 0;
    },
    debuff: (powerup: tPowerUps, debuffLengthMs: number) => {
      if (
        !Number.isFinite(debuffLengthMs) ||
        !Number.isSafeInteger(debuffLengthMs)
      ) {
        debuffLengthMs = 1000 * 3;
      }
      const currentPowerValue = this.powerups.get(powerup);
      this.powerups.set(powerup, Number.NEGATIVE_INFINITY);
      setTimeout(() => {
        this.powerups.set(powerup, currentPowerValue);
      }, debuffLengthMs);
    },
  };

  input = {
    add: (input: tUserInputQueue) => {
      if (!input) return false;
      if (this._lastInputQueueIndex >= this._maxInputQueue) {
        this._lastInputQueueIndex = 0;
      }

      this._inputQueue[this._lastInputQueueIndex++] = input;
      return true;
    },
    /**
     *
     * @param epochMs Gets the last input before, or at this epoch(in ms) time.
     * @returns
     */
    get: (epochMs: number) => {
      return this._inputQueue.find((currentInput, index, arr) => {
        if (
          currentInput[0] <= epochMs &&
          (!arr[index + 1] || arr[index + 1][0] > epochMs)
        ) {
          return true;
        }
        return false;
      });
    },
  };

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
