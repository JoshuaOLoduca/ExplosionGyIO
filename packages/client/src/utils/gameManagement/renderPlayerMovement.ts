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
    const usernameHud = this.data.get(sessionId + "usernameHud") as
      | Phaser.GameObjects.Text
      | undefined;

    const movementAmount = 0.2;

    if (serverX !== entity.serverX) {
      const newX = Phaser.Math.Linear(entity.x, serverX, movementAmount);
      entity.x = newX;
      if (entity.data.has("image")) entity.data.get("image").x = newX;
      if (healthHud) healthHud.setX(newX - healthHud.data.get("paddingX"));
      if (usernameHud)
        usernameHud.setX(newX - usernameHud.data.get("paddingX"));
    }
    if (serverY !== entity.serverY) {
      const newY = Phaser.Math.Linear(entity.y, serverY, movementAmount);
      entity.y = newY;
      if (entity.data.has("image")) entity.data.get("image").y = newY;
      if (healthHud) healthHud.setY(newY + healthHud.data.get("paddingY"));
      if (usernameHud)
        usernameHud.setY(newY - usernameHud.data.get("paddingY"));
    }
  }
}
