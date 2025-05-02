import { GameRoom } from "../../rooms/GameRoom";
import { BaseTile, PowerUp } from "../../schemas/GameState";

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
    powerUp.imageId = "cp_stand_down";
    powerUp.scale = grassTile.scale || 2;
    grassTile.data.set("powerup", powerUp);
    this.state.powerUps.set("powerup" + grassTile.x + grassTile.y, powerUp);
  });
}
