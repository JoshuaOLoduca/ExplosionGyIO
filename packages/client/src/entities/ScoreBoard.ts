import { Schema } from "@colyseus/schema";
import EventEmitter from "eventemitter3";
import { tPlayer, tScoreStats } from "explosion-gyio";
import Phaser from "phaser";

const pContainer = Phaser.GameObjects.Container;
type tPContainerConstructor = ConstructorParameters<typeof pContainer>;
type tPartialScore = Partial<tScoreStats>;

export type tScoreUpdateEvents = {
  "player--add": [{ playerId: string; score: tScoreStats; icon?: string }];
  "player--remove": [playerId: string];
  "score--update": [
    { playerId: string; score?: tPartialScore; icon?: string | null }
  ];
};

export class ScoreBoard extends pContainer {
  constructor(...superArgs: tPContainerConstructor) {
    super(...superArgs);

    this.getEmitter().on("player--add", ({ playerId, score, icon }) => {
      this.#addScoreTile(playerId, score, icon);
    });

    this.getEmitter().on("score--update", ({ playerId, score, icon }) => {
      const scoreTile = this.getByName(playerId);
      if (!(scoreTile instanceof ScoreTile)) return;
      if (score) scoreTile.updateScore(score);
      if (icon || icon === null) scoreTile.updateIcon(icon);
    });

    this.getEmitter().on("player--remove", (playerId) => {
      this.#removeScoreTile(playerId);
    });
  }

  getEmitter() {
    return this as any as EventEmitter<tScoreUpdateEvents>;
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

const tempScoreStyling = {
  fontFamily: "Arial Black",
  fontSize: 69,
  align: "center",
};

class ScoreTile extends pContainer {
  #iconElm: Phaser.GameObjects.Image;

  // TODO: replace GameObjects.Text with bitmapText for better rendering
  #scores: Array<[keyof tScoreStats, Phaser.GameObjects.Text]> = [];

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

  #createScore(x: number, y: number, score: string) {
    return new Phaser.GameObjects.Text(
      this.scene,
      x,
      y,
      score,
      tempScoreStyling
    );
  }

  #getScoreOrCreate(scoreKey: keyof tScoreStats, scoreValue: number) {
    let x = 0,
      y = 0;
    const cachedScore = this.#scores.find(([scoreType, display]) => {
      x = display.displayWidth * 0.5 + display.x;
      // y = display.displayHeight * 0.5 + display.y;
      return scoreType === scoreKey;
    });

    if (cachedScore) return cachedScore[1];

    const newScore = this.#createScore(x, y, scoreValue.toString());
    newScore.setName(scoreKey);
    this.add(newScore);
    this.#scores.push([scoreKey, newScore]);

    return newScore;
  }

  updateScore(newScores: tPartialScore) {
    for (const scoreKey in newScores) {
      const typedKey = scoreKey as keyof tScoreStats;
      const updatedScore = newScores[typedKey] || 0;
      const display = this.#getScoreOrCreate(typedKey, updatedScore);

      display.setText(updatedScore.toString());
    }
  }
}
