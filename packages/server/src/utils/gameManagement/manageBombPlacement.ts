import { Bomb, Player, Explosion, BaseTile } from "../../schemas";
import { getTileUnderCoord } from "../physics";
import { GameRoom, TILE_SIZE } from "../../rooms/GameRoom";

export function manageBombPlacement(
  this: GameRoom,
  arrOfGrassTiles: BaseTile[],
  player: Player
) {
  const bombTile = getTileUnderCoord(arrOfGrassTiles, player.x, player.y);
  if (bombTile && !bombTile.bomb) {
    // ///////////////////////
    //   Enforce Bomb Limit
    // ///////////////////////
    const bombsPlacedByPlayer = Array.from(this.BOMBS).filter(
      (bomb) => bomb.fuse && bomb.owner === player
    ).length;
    if (bombsPlacedByPlayer >= player.powerups.get("bombCount")) return;

    const bomb = new Bomb();
    bomb.owner = player;
    bomb.imageId = "bomb_big_1";

    bomb.x = bombTile.x;
    bomb.y = bombTile.y;
    bomb.fuse = 1000 * 2;
    bomb.scale = (bombTile.scale || 2) / 2;

    bombTile.bomb = bomb;

    // For collision tracking
    this.BOMBS.add(bomb);

    const reduceConstructorForExplosionPlacement = (
      coordsToCheck: (
        x: number,
        y: number,
        offset: number
      ) => [x: number, y: number]
    ) => {
      let hitCrate = false;
      return [
        (arr: (Explosion | null)[], _: unknown, index: number) => {
          const tileSize = (bombTile.scale || 1) * TILE_SIZE;
          const multiplier = index + 1;
          const [xToCheck, yToCheck] = coordsToCheck(
            bombTile.x,
            bombTile.y,
            tileSize * multiplier
          );
          const foundTile = getTileUnderCoord(
            arrOfGrassTiles.concat(
              Array.from(this.state.tiles.values()).filter((tile) =>
                tile.imageId.includes("crate")
              )
            ),
            xToCheck,
            yToCheck
          );

          if (!foundTile || arr[index - 1] === null || hitCrate) {
            arr.push(null);
            return arr;
          }
          if (foundTile.imageId.includes("crate")) hitCrate = true;

          const explosion = new Explosion(bomb);
          explosion.x = foundTile.x;
          explosion.y = foundTile.y;
          explosion.imageId = "explosion_2";
          arr.push(explosion);

          return arr;
        },
        [],
      ] as const;
    };

    // TODO: use date object for more reliable time change
    // SetInterval can be off by some u/n seconds due to the scheduler being busy.
    const bombFuse = setInterval(() => {
      bomb.fuse -= 1;
      if (bomb.fuse <= 0) {
        const bombExplosionLength = player.powerups.get("bombSize");
        const bombPower = player.powerups.get("bombDamage");
        // Top Left is 0,0
        const leftExplosion = new Array(bombExplosionLength)
          .fill(2)
          .reduce(
            ...reduceConstructorForExplosionPlacement((x, y, offset) => [
              x - offset,
              y,
            ])
          )
          .filter(Boolean) as Explosion[];
        const topExplosion = new Array(bombExplosionLength)
          .fill(2)
          .reduce(
            ...reduceConstructorForExplosionPlacement((x, y, offset) => [
              x,
              y - offset,
            ])
          )
          .filter(Boolean) as Explosion[];
        const rightExplosion = new Array(bombExplosionLength)
          .fill(2)
          .reduce(
            ...reduceConstructorForExplosionPlacement((x, y, offset) => [
              x + offset,
              y,
            ])
          )
          .filter(Boolean) as Explosion[];
        const bottomExplosion = new Array(bombExplosionLength)
          .fill(2)
          .reduce(
            ...reduceConstructorForExplosionPlacement((x, y, offset) => [
              x,
              y + offset,
            ])
          )
          .filter(Boolean) as Explosion[];

        for (const bombExplosionArr of [
          topExplosion,
          rightExplosion,
          bottomExplosion,
          leftExplosion,
        ]) {
          if (bombExplosionArr.length >= 1) {
            bombExplosionArr.at(-1)!.imageId = "explosion_3";
          }

          switch (bombExplosionArr) {
            case bottomExplosion:
              bottomExplosion.forEach((bomb) => {
                if (Math.random() > 0.5 && bomb === bottomExplosion.at(-1)) {
                  bomb.imageId = "bomb_extended_explosion_1";
                  bomb.angle = -90;
                } else bomb.angle = 0;
              });
              break;
            case rightExplosion:
              rightExplosion.forEach((bomb) => {
                if (Math.random() > 0.5 && bomb === rightExplosion.at(-1)) {
                  bomb.imageId = "bomb_extended_explosion_1";
                  bomb.angle = 180;
                } else bomb.angle = -90;
              });
              break;
            case topExplosion:
              topExplosion.forEach((bomb) => {
                if (Math.random() > 0.5 && bomb === topExplosion.at(-1)) {
                  bomb.imageId = "bomb_extended_explosion_1";
                  bomb.angle = 90;
                } else bomb.angle = -180;
              });

              break;
            case leftExplosion:
              leftExplosion.forEach((bomb) => {
                if (Math.random() > 0.5 && bomb === leftExplosion.at(-1)) {
                  bomb.imageId = "bomb_extended_explosion_1";
                  bomb.angle = 0;
                } else bomb.angle = 90;
              });
              break;
          }
        }
        const centerExplosion = new Explosion(bomb);
        centerExplosion.x = bombTile.x;
        centerExplosion.y = bombTile.y;
        centerExplosion.scale = bombTile.scale || 1;
        centerExplosion.imageId = "bomb_extended_explosion_core";

        const bombs = [
          centerExplosion,
          ...topExplosion,
          ...rightExplosion,
          ...bottomExplosion,
          ...leftExplosion,
        ] as Explosion[];
        bombs.forEach((bomb) => {
          if (bomb) bomb.damage = bombPower;
        });

        bomb.explosions.push(...bombs);
        clearInterval(bombFuse);

        const updateRate = 25;

        const bombExplosionLinger = setInterval(() => {
          centerExplosion.lingerMs -= updateRate;
          if (centerExplosion.lingerMs <= 0) {
            clearInterval(bombExplosionLinger);
            bomb.explosions.clear();
            bombTile.bomb = undefined;
            this.BOMBS.delete(bomb);
          }
        }, updateRate);
      }
    }, 1);
  }
}
