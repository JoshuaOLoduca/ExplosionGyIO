import { GameRoom } from "../../rooms/GameRoom";
import { PowerUp, BaseTile } from "../../schemas";

export function managePowerUpPlacement(
  this: GameRoom,
  grassTiles: BaseTile[],
  percentage = 0.05
) {
  grassTiles.forEach((grassTile) => {
    if (Math.random() > percentage) return;
    if (grassTile.data.has("powerup")) return;
    const powerUp = new PowerUp(PowerUp.random());
    powerUp.x = grassTile.x;
    powerUp.y = grassTile.y;
    powerUp.scale = ((grassTile.scale || 2) / 128) * 0.65;
    grassTile.data.set("powerup", powerUp);
    this.state.powerUps.set("powerup" + grassTile.x + grassTile.y, powerUp);
  });
}
