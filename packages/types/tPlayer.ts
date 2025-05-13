import { tBaseTile } from "./tBaseTile";

/**
 * Defines variables shared between both client and server
 */
export type tPlayer<T = {}> = {
  sprite: string;
  clientId: string;
  health: number;
  invincible: number;
} & tBaseTile<T>;
