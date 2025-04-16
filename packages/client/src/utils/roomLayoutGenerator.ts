type roomSlice = (" " | "x")[];

function roomLayoutGenerator(height = 30, width = 30) {
  const room: roomSlice[] = [];
  for (let i = 0; i < height; i++) {
    if (i === 0 || i === height - 1) room.push(new Array(width).fill("x"));
    else if (room[i - 1].slice(1,-1).includes("x"))
      room.push(["x", ...new Array(width - 2).fill(" "), "x"]);
    else if (!room[i]) room.push(widthGenerator(width));
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
roomLayoutGenerator(10, 5);

export default roomLayoutGenerator;
