import { Game } from "../../scenes/Game";

export function renderBaseTile(this: Game, tile) {
  const image = this.add
    .sprite(tile.x, tile.y, "gameSprites", tile.imageId)
    .setInteractive();
  image.setScale(tile?.scale || 6.225);
  return image;
}
