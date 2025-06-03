export type tScoreStats<T = {}> = {
  kills: number;
  hits: number;
  /**
   * how many times the player hit themselves
   */
  missfires: number;
} & T;
