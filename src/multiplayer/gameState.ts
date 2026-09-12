// ==============================
// TAGPOLE GAME STATE
// ==============================

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
}

export interface GameState {
  phase: GamePhase;

  players: NetworkPlayer[];

  maxPlayers: 12;

  hostId: string;
}

export function createGameState(): GameState {
  return {
    phase: 'lobby',

    players: [],

    maxPlayers: 12,

    hostId: '',
  };
}