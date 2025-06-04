import { Schema } from "@colyseus/schema";
import { tPlayer, tScoreStats } from "explosion-gyio";
import { EventEmitter } from "stream";
import Phaser from "phaser";

const pContainer = Phaser.GameObjects.Container;
type tPContainerConstructor = ConstructorParameters<typeof pContainer>;
type tPartialScore = Partial<tScoreStats>;

type tScoreUpdateEvents = {
  "player--add": [{ playerId: string; score: tScoreStats; icon?: string }];
  "player--remove": [playerId: string];
  "score--update": [
    { playerId: string; score?: tPartialScore; icon?: string | null }
  ];
};

export class ScoreBoard extends pContainer {
  constructor(
    scoreBoardEvents: EventEmitter<tScoreUpdateEvents>,
    ...superArgs: tPContainerConstructor
  ) {
    super(...superArgs);

    scoreBoardEvents.on("player--add", ({ playerId, score, icon }) => {
      this.#addScoreTile(playerId, score, icon);
    });

    scoreBoardEvents.on("score--update", ({ playerId, score, icon }) => {
      const scoreTile = this.getByName(playerId);
      if (!(scoreTile instanceof ScoreTile)) return;
      if (score) scoreTile.updateScore(score);
      if (icon || icon === null) scoreTile.updateIcon(icon);
    });

    scoreBoardEvents.on("player--remove", (playerId) => {
      this.#removeScoreTile(playerId);
    });
  }

  #addScoreTile(playerId: string, score: tScoreStats, icon?: string) {
    const scoreTile = new ScoreTile(playerId, score, this.scene);
    if (icon || icon === null) scoreTile.updateIcon(icon);
    this.add(scoreTile);
  }

  #removeScoreTile(playerId: string) {
    const scoreTile = this.getByName(playerId);
    if (!scoreTile) return;

    this.remove(scoreTile, true);
  }
}

class ScoreTile extends pContainer {
  #iconElm: Phaser.GameObjects.Image;

  // TODO: replace GameObjects.Text with bitmapText for better rendering
  #scores: { [k in keyof tScoreStats]?: Phaser.GameObjects.Text }[] = [];

  constructor(
    public tileName: string,
    initialScore: tScoreStats = { hits: 0, kills: 0, missfires: 0 },
    ...superArgs: tPContainerConstructor
  ) {
    super(...superArgs);
    this.name = tileName;

    this.updateScore(initialScore);
    return this;
  }

  updateIcon(icon: string | null) {
    if (icon)
      this.#iconElm = new Phaser.GameObjects.Image(this.scene, 0, 0, icon);
    else if (icon === null) this.#iconElm?.destroy();

    return this;
  }

  updateScore(newScores: tPartialScore) {}
}
