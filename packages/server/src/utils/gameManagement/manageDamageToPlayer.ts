import { Player, Explosion } from "../../schemas";
import { checkCollision, isInsideTile } from "../physics";

/**
 * Returns explosionEntity if player was damaged.
 * @param player
 * @param explosionTiles
 * @returns
 */
export function manageDamageToPlayer(
  player: Player,
  explosionTiles: Explosion[]
) {
  const damaged =
    checkCollision(player.x, player.y, explosionTiles, undefined, true) ||
    explosionTiles.find((expTile) => isInsideTile(player.x, player.y, expTile));

  if (damaged instanceof Explosion && damaged.lingerMs > 0) {
    if (player.addDamage(damaged.damage)) return damaged;
  }

  return false;
}
