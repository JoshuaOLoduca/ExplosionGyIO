const cGameEventsArr = [
  "bomb--explosion__damage-player",
  "player--bomb__place",
] as const;

export type tGameEvents = (typeof cGameEventsArr)[number];
