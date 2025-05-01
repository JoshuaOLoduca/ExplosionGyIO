import { Game } from "../../scenes/Game";


export function renderPlayerMovement(this: Game) {
  for (let sessionId of this.sessionIds.values()) {
    // interpolate all player entities
    const entity = this.data.get(sessionId);
    if (!entity) continue;
    const { serverX, serverY } = entity.data.values;

    if (serverX !== entity.serverX)
      entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
    if (serverY !== entity.serverY)
      entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
  }
}
