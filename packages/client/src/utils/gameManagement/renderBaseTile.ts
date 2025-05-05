import { Game } from "../../scenes/Game";

export enum eRenderDepth {
  BACKGROUND,
  PLAYER,
  WALL,
  BOMB,
  HUD,
}

export function renderBaseTile(this: Game, tile) {
  const { imageId } = tile;
  const notInAtlas = this.textures.exists(imageId);
  const image = this.add
    .sprite(
      tile.x,
      tile.y,
      notInAtlas ? imageId : "gameSprites",
      notInAtlas ? undefined : imageId
    )
    .setInteractive();
  image.setScale(tile?.scale || 6.225);
  if (tile.angle) image.setAngle(tile.angle);

  if (imageId.includes("bomb")) {
    image.setDepth(eRenderDepth.BOMB);
  } else if (imageId.includes("explosion")) {
    image.setDepth(eRenderDepth.HUD);
  } else if (imageId.includes("grass")) {
    image.setDepth(eRenderDepth.BACKGROUND);
  } else if (imageId.includes("wall")) {
    image.setDepth(eRenderDepth.WALL);
  } else image.setDepth(eRenderDepth.PLAYER);
  return image;
}
