import { tPlayer } from "./tPlayer";
import { tPowerUp } from "./tPowerUp";
import { tTile } from "./tTile";

export type tGameState = {
  tiles: Map<string, tTile>;
  players: Map<string, tPlayer>;
  powerUps: Map<string, tPowerUp>;
};
