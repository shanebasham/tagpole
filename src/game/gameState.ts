export type GamePhase =
  | 'lobby'
  | 'playing'
  | 'ended';

export interface NetworkPlayer {
  id: string;

  x: number;
  y: number;
  z: number;

  yaw: number;
  pitch: number;

  vx: number;
  vy: number;
  vz: number;

  alive: boolean;
  trapped: boolean;
  isDrowned: boolean;

  trappedAt: number | null;
  trapEndAt: number | null;

  color: string;
}

export interface GameState {
  phase: GamePhase;

  players: NetworkPlayer[];

  maxPlayers: number;

  hostId: string;

  worldSeed: number;
}

export function createGameState(): GameState {
  return {
    phase: 'lobby',

    players: [],

    maxPlayers: 12,

    hostId: '',

    worldSeed: Math.floor(
      Math.random() * 2147483647
    ),
  };
}

export const gameState = {
  started: false,

  multiplayer: false,

  playerTrapped: false,

  playerDead: false,

  aiRoundOver: false,
};