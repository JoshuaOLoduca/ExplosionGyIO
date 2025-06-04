import { Schema } from "@colyseus/schema";
import { tPlayer, tScoreStats } from "explosion-gyio";
import { EventEmitter } from "stream";

const pContainer = Phaser.GameObjects.Container;
type tPContainerConstructor = ConstructorParameters<typeof pContainer>;
type tPartialScore = Partial<tScoreStats>;

type tScoreUpdateEvents = {
  "player--add": [playerId: string, score: tScoreStats];
  "player--remove": [playerId: string];
  "score--update": [playerId: string, score: tPartialScore];
};

export class ScoreBoard extends pContainer {
  constructor(
    scoreBoardEvents: EventEmitter<tScoreUpdateEvents>,
    ...superArgs: tPContainerConstructor
  ) {
    super(...superArgs);

    scoreBoardEvents.on("player--add", (playerId, score) => {
      this.#addScoreTile(playerId, score);
    });

    scoreBoardEvents.on("score--update", (playerId, score) => {
      const scoreTile = this.getByName(playerId);
      if (!(scoreTile instanceof ScoreTile)) return;
      scoreTile.updateScore(score);
    });

    scoreBoardEvents.on("player--remove", (playerId) => {
      this.#removeScoreTile(playerId);
    });
  }

  #addScoreTile(playerId: string, score: tScoreStats) {
    this.add(new ScoreTile(playerId, score, this.scene));
  }

  #removeScoreTile(playerId: string) {
    const scoreTile = this.getByName(playerId);
    if (!scoreTile) return;

    this.remove(scoreTile, true);
  }
}

class ScoreTile extends pContainer {
  constructor(
    public tileName: string,
    initialScore: tScoreStats = { hits: 0, kills: 0, missfires: 0 },
    ...superArgs: tPContainerConstructor
  ) {
    super(...superArgs);
    this.name = tileName;
    this.update(initialScore);
  }

  updateScore(newScores: tPartialScore) {}
}
