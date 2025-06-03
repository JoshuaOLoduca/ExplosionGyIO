import { tGameState } from "./tGameState";
import { tScoreStats } from "./tScoreStats";

export type tGameStateTimeAttack<T = {}> = {
  /**
   * In seconds. time left until the gamemode ends.
   */
  countdown: number;

  score: Map<string, tScoreStats<T>> & T;
} & tGameState<T>;
