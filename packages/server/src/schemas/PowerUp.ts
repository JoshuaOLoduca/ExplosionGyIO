import type { tPowerUp } from "explosion-gyio";
import { BaseTile } from "./BaseTile";

export const powerUpTypes = [
  "speed",
  "bombSize",
  "bombCount",
  "bombDamage",
] as const;
export type tPowerUps = (typeof powerUpTypes)[number];

export class PowerUp extends BaseTile implements tPowerUp {
  static random() {
    const randomNumber = Math.round(Math.random() * (powerUpTypes.length - 1));
    return powerUpTypes[randomNumber];
  }

  constructor(type: tPowerUps, parent?: BaseTile) {
    super(parent);
    this.type = type;
    this.imageId = type;
  }

  type: tPowerUps;

  amount = 1;
}
