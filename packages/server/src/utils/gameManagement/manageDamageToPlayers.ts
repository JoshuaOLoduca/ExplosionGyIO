import { Player, Explosion } from "../../schemas/GameState";
import { checkCollision, isInsideTile } from "../physics";

export function manageDamageToPlayers(
  player: Player,
  explosionTiles: Explosion[]
) {
  const damaged =
    checkCollision(player.x, player.y, explosionTiles, undefined, true) ||
    explosionTiles.find((expTile) => isInsideTile(player.x, player.y, expTile));

  if (damaged instanceof Explosion && damaged.lingerMs > 0) {
    player.addDamage(damaged.damage);
  }
}
