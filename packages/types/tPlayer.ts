import { tPowerUps } from "../server/src/schemas";
import { tBaseTile } from "./tBaseTile";

/**
 * Defines variables shared between both client and server
 */
export type tPlayer<T = {}, MapT = Map<tPowerUps, number>> = {
  sprite: string;
  clientId: string;
  health: number;
  invincible: number;
  /**
   * Optional because only the player can see their own powerups
   */
  powerUps?: Map<tPowerUps, number> & MapT;
  username: string;
} & tBaseTile<T>;
