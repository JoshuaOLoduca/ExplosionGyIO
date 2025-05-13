import { getStateCallbacks } from "colyseus.js";
import { Game } from "../../scenes/Game";
import { renderBaseTile } from "./renderBaseTile";
import { tBomb, tExplosion } from "explosion-gyio";
import { ArraySchema, Schema } from "@colyseus/schema";

export function createBombUpdateCB(
  this: Game,
  $: ReturnType<typeof getStateCallbacks>,
  tile,
  tileId: string
) {
  const keysToDestroy: string[] = [];
  const dataKey = tileId + "bomb";
  const updateBombState = () => {
    const { bomb } = tile as {
      bomb: tBomb<Schema> & {
        explosions: ArraySchema<tExplosion<Schema>> & Schema;
      };
    };
    // //////////////////////
    //   Bomb replacement
    // //////////////////////
    if (this.data.get(dataKey) !== bomb) {
      keysToDestroy.forEach((bombExpKey) => {
        if (this.data.has(bombExpKey)) {
          this.data.get(bombExpKey)?.destroy();
          this.data.remove(bombExpKey);
        }
      });

      this.data.get(dataKey)?.destroy();
      this.data.remove(dataKey);
    }

    // ////////////////////////
    //     Bomb Rendering
    // ////////////////////////
    if ((bomb && !this.data.has(dataKey)) || this.data.get(dataKey) !== bomb) {
      const spriteToAdd = renderBaseTile.call(this, bomb);

      spriteToAdd.disableInteractive;

      spriteToAdd.anims.create({
        key: "bomb",
        duration: bomb.fuse,
        frames: this.anims.generateFrameNames("gameSprites", {
          prefix: "bomb_big_",
          start: 1,
          end: 6,
        }),
      });
      spriteToAdd.anims.play("bomb");

      if (bomb.owner?.clientId === this.room.sessionId) {
        this.playerStats.bombPlaced++;
      }

      $(bomb).onChange(() => {
        if (spriteToAdd.visible && bomb?.fuse <= 0) {
          spriteToAdd.setVisible(false);
          spriteToAdd.disableInteractive(true);
          if (bomb.owner?.clientId === this.room.sessionId) {
            this.playerStats.bombPlaced--;
          }
        }
      });

      $(bomb.explosions).onAdd((item) => {
        const bombExplosionKey = (Math.random() * 1000000).toFixed(4);
        if (item?.imageId.includes("core")) {
          const originalLinger = item.lingerMs;
          $(item).listen("lingerMs", (newLinger) => {
            keysToDestroy.forEach((bombExplosionKey) => {
              const explosionSprite = this.data.get(bombExplosionKey);
              if (!explosionSprite) return;
              explosionSprite.setAlpha(
                Math.min(newLinger / originalLinger + 0.25, 1)
              );
            });
          });
        }
        if (!this.data.has(bombExplosionKey)) {
          keysToDestroy.push(bombExplosionKey);

          this.data.set(
            bombExplosionKey,
            renderBaseTile.call(this, item).setScale(tile.scale || 1)
            // .setAlpha(0.9)
          );
        }
      });

      this.data.set(dataKey, spriteToAdd);
    }
  };

  return updateBombState;
}
