import { tPlayer } from "./tPlayer";
import { tPowerUp } from "./tPowerUp";
import { tTile } from "./tTile";

export type tGameState<T = {}> = {
  tiles: Map<string, tTile> & T;
  players: Map<string, tPlayer> & T;
  powerUps: Map<string, tPowerUp> & T;
};
