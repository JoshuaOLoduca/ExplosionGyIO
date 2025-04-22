/**
 * ' ' = floor
 * 'x' = indestructable wall
 * 'c' = destructable wall
 */
type roomSlice = (" " | "x" | "c")[];

type roomMatrix = roomSlice[];

/**
 * Generates a matrix for constructing levels.
 * - " " is floor/empty
 * - "x" is indestructable walls
 * - "c" is crates/destructable walls.
 * @param height How tall the grid should be
 * @param width How wide it should be, takes care of wall placement
 * @param destructableBlocksPercentage inclusive range of 0 - 1; the chance an empty floor space will be a destructable tile
 * @returns {roomMatrix} {@link roomMatrix}
 */
function roomLayoutGenerator(
  height = 30,
  width = 30,
  destructableBlocksPercentage = 0.33
): roomMatrix {
  const room: roomMatrix = [];
  for (let i = 0; i < height; i++) {
    if (i === 0 || i === height - 1) room.push(new Array(width).fill("x"));
    else if (room[i - 1].slice(1, -1).includes("x"))
      room.push(["x", ...new Array(width - 2).fill(" "), "x"]);
    else if (!room[i]) room.push(widthGenerator(width));

    if (destructableBlocksPercentage) {
      room[i] = addDestructableBlocks(room[i], destructableBlocksPercentage);
    }
  }

  return room;
}

function widthGenerator(width: number): roomSlice {
  const roomSlice: roomSlice = [];

  for (let i = 0; i < width; i++) {
    if (i % 2 === 0 || i === width - 1) roomSlice.push("x");
    else roomSlice.push(" ");
  }

  return roomSlice;
}

function addDestructableBlocks(slice: roomSlice, percentage = 0.25): roomSlice {
  return slice.map((tile) => {
    if (tile !== " ") return tile;
    if (Math.random() < percentage) return "c";
    return tile;
  });
}

export default roomLayoutGenerator;
