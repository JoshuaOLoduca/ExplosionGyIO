import { tUserInput } from "explosion-gyio";
import { Game } from "../../scenes/Game";

export function managePlayerInput(this: Game) {
  const oldPlayload = this.inputPayload;
  const newPayload: tUserInput = {
    up: !!this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W).isDown,
    left: !!this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)
      .isDown,
    down: !!this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S)
      .isDown,
    right: !!this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      .isDown,
    placeBomb: !!this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    ).isDown,
  };

  for (const key in newPayload) {
    const typedKey = key as keyof tUserInput;
    if (newPayload[typedKey] === oldPlayload[typedKey]) continue;
    this.room.send(0, newPayload);
    break;
  }
}
