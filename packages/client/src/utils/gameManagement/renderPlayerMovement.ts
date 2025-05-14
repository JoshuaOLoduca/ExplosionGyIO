import { Game } from "../../scenes/Game";

export function renderPlayerMovement(this: Game) {
  for (let sessionId of this.sessionIds.values()) {
    // interpolate all player entities
    const entity = this.data.get(sessionId);
    if (!entity) continue;
    const { serverX, serverY } = entity.data.values;
    const healthHud = this.data.get(sessionId + "healthHud") as
      | Phaser.GameObjects.Text
      | undefined;

    if (serverX !== entity.serverX) {
      const newX = Phaser.Math.Linear(entity.x, serverX, 0.2);
      entity.x = newX;
      if (healthHud) healthHud.setX(newX - healthHud.data.get("paddingX"));
    }
    if (serverY !== entity.serverY) {
      const newY = Phaser.Math.Linear(entity.y, serverY, 0.2);
      entity.y = newY;
      if (healthHud) healthHud.setY(newY + healthHud.data.get("paddingY"));
    }
  }
}
