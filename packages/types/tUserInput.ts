export type tUserInput<T = {}> = {
  up: boolean;
  left: boolean;
  down: boolean;
  right: boolean;
  placeBomb: boolean;
} & T;
