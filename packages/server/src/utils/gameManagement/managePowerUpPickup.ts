import { GameRoom } from "../../rooms/GameRoom";
import { PowerUp, BaseTile, Player } from "../../schemas";
import { getTileUnderCoord } from "../physics";

export function managePowerUpPickup(
  this: GameRoom,
  arrOfGrassTiles: BaseTile[],
  player: Player
) {
  const tileUnderPlayer = getTileUnderCoord(
    arrOfGrassTiles,
    player.x,
    player.y
  );
  if (!tileUnderPlayer) return false;
  const powerup = tileUnderPlayer.data.get("powerup");
  if (!powerup || !(powerup instanceof PowerUp)) return false;

  player.powerups.change(powerup.type, powerup.amount);

  this.state.powerUps.delete("powerup" + tileUnderPlayer.x + tileUnderPlayer.y);

  return true;
}
