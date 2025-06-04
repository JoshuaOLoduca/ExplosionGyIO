const pContainer = Phaser.GameObjects.Container;
type tPContainerConstructor = ConstructorParameters<typeof pContainer>;

export class ScoreBoard extends pContainer {
  constructor(...superArgs: tPContainerConstructor) {
    super(...superArgs);
    throw "not Impl";
  }
}

class PlayerScore extends pContainer {
  constructor(...superArgs: tPContainerConstructor) {
    super(...superArgs);
  }
}
