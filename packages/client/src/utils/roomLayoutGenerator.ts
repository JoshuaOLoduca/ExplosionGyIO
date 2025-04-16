/**
 * ' ' = floor
 * 'x' = indestructable wall
 * 'c' = destructable wall
 */
type roomSlice = (" " | "x" | "c")[];

function roomLayoutGenerator(
  height = 30,
  width = 30,
  destructableBlocks = true
) {
  const room: roomSlice[] = [];
  for (let i = 0; i < height; i++) {
    if (i === 0 || i === height - 1) room.push(new Array(width).fill("x"));
    else if (room[i - 1].slice(1, -1).includes("x"))
      room.push(["x", ...new Array(width - 2).fill(" "), "x"]);
    else if (!room[i]) room.push(widthGenerator(width));

    if (destructableBlocks) {
      room[i] = addDestructableBlocks(room[i], 0.33);
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
