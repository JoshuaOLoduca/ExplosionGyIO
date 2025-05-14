export type tBaseTile<T={}> = {
  x: number;
  y: number;
  scale?: number;
  imageId: string;
  angle: number;
} & T;