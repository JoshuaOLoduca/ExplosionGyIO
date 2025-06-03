const eGameEvents = [
  "bomb--explosion__damage-player",
  "player--bomb__place",
  "player--death__bomb",
] as const;

export type tGameEvents = (typeof eGameEvents)[number];
