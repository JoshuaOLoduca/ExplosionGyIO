import { GameRoom } from "../../rooms/GameRoom";
import { BaseTile, Bomb, Explosion } from "../../schemas";
import { isInsideTile } from "../physics";
import { managePowerUpPlacement } from "./managePowerUpPlacement";

export function manageBombDamageToCrate(
  this: GameRoom,
  crateList: BaseTile[],
  explosionTiles: Explosion[]
) {
  const cratesHit = crateList
    .map(
      (crate) =>
        [
          crate,
          explosionTiles.find(
            (explTile) =>
              explTile.parent !== crate &&
              isInsideTile(crate.x, crate.y, explTile)
          )!,
        ] as const
    )
    .filter(([crate, explTile]) => crate && explTile);
  cratesHit.forEach(([crate, explod]) => {
    const stateId = crate.data.get("stateId");
    crate.imageId = "grass";

    managePowerUpPlacement.call(this, [crate], 0.5);
  });
}
