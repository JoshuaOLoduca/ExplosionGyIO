import { Bomb, Explosion } from "../../schemas";
import math from "../math";
import { isInsideTile } from "../physics";

const bombDamageScaling = math.createBaseLog(2.5);

export function manageBombDamageToBomb(
  bombTileList: Bomb[],
  explosionTiles: Explosion[]
) {
  const bombsWithLifeAndHit = bombTileList
    .map(
      (bomb) =>
        [
          bomb,
          explosionTiles.find(
            (explTile) =>
              explTile.parent !== bomb && isInsideTile(bomb.x, bomb.y, explTile)
          )!,
        ] as const
    )
    .filter(([bomb, explTile]) => bomb.fuse && explTile);
  bombsWithLifeAndHit.forEach(([bomb, explod]) => {
    if (!bomb.data.has(explod.id)) {
      bomb.data.set(explod.id, true);
      bomb.fuse = +Math.max(
        bomb.fuse - bombDamageScaling(explod.damage) * 750,
        1
      ).toFixed(0);
    }
  });
}
