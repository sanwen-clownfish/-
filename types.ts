export enum ShapeType {
  HEART = 'HEART',
  FLOWER = 'FLOWER',
  BUDDHA = 'BUDDHA',
  FIREWORKS = 'FIREWORKS'
}

export type GestureState = 'OPEN' | 'CLOSED';

export interface ParticleConfig {
  shape: ShapeType;
  color: string;
  expansion: number; // 0.0 (tight) to 1.0 (expanded)
}

export interface VisionResponse {
  state: GestureState;
}
