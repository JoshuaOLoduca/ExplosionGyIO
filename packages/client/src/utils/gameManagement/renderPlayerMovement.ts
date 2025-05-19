import { Game } from "../../scenes/Game";

const bigboicache = new Map<
  string,
  {
    serverPoint: number;
    moves: number[];
  }
>();

/**
 *
 * Creates a list of points to translate player movement smoothly.
 * The array is constructed in reverse, this means we can use .pop to get the latest move, which is a o(1) operation.
 */
function createMoves(
  startPoint: number,
  serverPoint: number,
  movementAmount: number,
  key: string
) {
  bigboicache.set(key, {
    serverPoint,
    moves: new Array(1 / movementAmount)
      .fill(0)
      .map((_, index, { length }) =>
        Phaser.Math.Linear(
          startPoint,
          serverPoint,
          (length - index) * movementAmount
        )
      ),
  });
}

export function renderPlayerMovement(this: Game) {
  for (let sessionId of this.sessionIds.values()) {
    // interpolate all player entities
    const entity = this.data.get(sessionId);
    if (!entity) continue;
    const { serverX, serverY } = entity.data.values;
    const healthHud = this.data.get(sessionId + "healthHud") as
      | Phaser.GameObjects.Text
      | undefined;
    const usernameHud = this.data.get(sessionId + "usernameHud") as
      | Phaser.GameObjects.Text
      | undefined;

    const movementAmount = 0.1;

    /**
     * Populate linear X movement cache if the state X changes.
     */
    if (
      Number.isFinite(serverX) &&
      serverX !== entity.x &&
      (!bigboicache.get(sessionId + "x") ||
        bigboicache.get(sessionId + "x")?.serverPoint !== serverX)
    ) {
      createMoves(entity.x, serverX, movementAmount, sessionId + "x");
    }

    /**
     * Populates linear Y moves if the state for y position changes
     */
    if (
      Number.isFinite(serverY) &&
      serverY !== entity.y &&
      (!bigboicache.get(sessionId + "y") ||
        bigboicache.get(sessionId + "y")?.serverPoint !== serverY)
    ) {
      createMoves(entity.y, serverY, movementAmount, sessionId + "y");
    }

    // If there are moves cached for our current destination, start translating the player sprite towards it.
    const xMovement = bigboicache.get(sessionId + "x");
    if (xMovement?.moves.length) {
      const newX = xMovement.moves.pop()!;

      entity.x = newX;
      if (entity.data.has("image")) entity.data.get("image").x = newX;
      if (healthHud) healthHud.setX(newX - healthHud.data.get("paddingX"));
      if (usernameHud)
        usernameHud.setX(newX - usernameHud.data.get("paddingX"));
    }

    // If there are moves cached for our current destination, start translating the player sprite towards it.
    const yMovement = bigboicache.get(sessionId + "y");
    if (yMovement?.moves.length) {
      const newY = yMovement.moves.pop()!;

      entity.y = newY;
      if (entity.data.has("image")) entity.data.get("image").y = newY;
      if (healthHud) healthHud.setY(newY + healthHud.data.get("paddingY"));
      if (usernameHud)
        usernameHud.setY(newY - usernameHud.data.get("paddingY"));
    }
  }
}
