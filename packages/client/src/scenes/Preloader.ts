import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    const bg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "background"
    );
    let scaleX = this.cameras.main.width / bg.width + 0.2;
    let scaleY = this.cameras.main.height / bg.height + 0.2;
    let scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0);

    //  A simple progress bar. This is the outline of the bar.
    this.add
      .rectangle(
        Number(this.game.config.width) * 0.5,
        Number(this.game.config.height) * 0.5,
        468,
        32
      )
      .setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(
      Number(this.game.config.width) * 0.5 - 230,
      Number(this.game.config.height) * 0.5,
      4,
      28,
      0xffffff
    );

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on("progress", (progress) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath("/.proxy/assets");
    this.load.atlas(
      "gameSprites",
      "bomb_party_v4_simple.png",
      "sprites-tp-array.json"
    );

    this.load.image("logo", "logo.png");
    this.load.svg("speed", "player-speed-speedometer.svg", {
      width: 16 * 128,
      height: 16 * 128,
    });
    this.load.svg("bombSize", "bomb-size-explosion-rays.svg", {
      width: 16 * 128,
      height: 16 * 128,
    });
    this.load.svg("bombCount", "bomb-count-unlit-bomb.svg", {
      width: 16 * 128,
      height: 16 * 128,
    });
    this.load.svg("bombDamage", "bomb-damage-alt-ball-glow.svg", {
      width: 16 * 128,
      height: 16 * 128,
    });
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start("MainMenu");
  }
}
