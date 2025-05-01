import { Game } from "../../scenes/Game";

export function managePlayerInput(this: Game) {
  this.inputPayload.up = !!this.input.keyboard?.addKey(
    Phaser.Input.Keyboard.KeyCodes.W
  ).isDown;
  this.inputPayload.left = !!this.input.keyboard?.addKey(
    Phaser.Input.Keyboard.KeyCodes.A
  ).isDown;
  this.inputPayload.down = !!this.input.keyboard?.addKey(
    Phaser.Input.Keyboard.KeyCodes.S
  ).isDown;
  this.inputPayload.right = !!this.input.keyboard?.addKey(
    Phaser.Input.Keyboard.KeyCodes.D
  ).isDown;
  this.inputPayload.placeBomb = !!this.input.keyboard?.addKey(
    Phaser.Input.Keyboard.KeyCodes.SPACE
  ).isDown;

  this.room.send(0, this.inputPayload);
}
