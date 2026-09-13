import type { NetworkPlayer } from '../game/gameState';
import type { MultiplayerClient } from './multiplayerClient';

export type MultiplayerState =
  NonNullable<
    ReturnType<MultiplayerClient['getGameState']>
  >;

export interface MultiplayerGameCallbacks {
  onLobby: (
    state: MultiplayerState,
    roomCode: string,
    playerId: string | null
  ) => void;

  onPlaying: (
    state: MultiplayerState
  ) => void;

  onEnded: (
    state: MultiplayerState,
    isHost: boolean
  ) => void;

  onPlayersUpdated: (
    players: NetworkPlayer[],
    playerId: string | null
  ) => void;

  onLocalPlayerUpdated: (
    player: NetworkPlayer | null
  ) => void;
}

export class MultiplayerGame {
  private readonly multiplayer: MultiplayerClient;

  private callbacks:
    MultiplayerGameCallbacks | null =
      null;

  private active =
    false;

  constructor(
    multiplayer: MultiplayerClient
  ) {
    this.multiplayer =
      multiplayer;

    this.multiplayer.setStateListener(
      (state) => {
        this.handleState(
          state
        );
      }
    );
  }

  setCallbacks(
    callbacks: MultiplayerGameCallbacks
  ): void {
    this.callbacks =
      callbacks;
  }

  start(): void {
    this.active =
      true;
  }

  stop(): void {
    this.active =
      false;
  }

  isActive(): boolean {
    return this.active;
  }

  update(): void {
    if (
      !this.active
    ) {
      return;
    }

    const state =
      this.multiplayer.getGameState();

    if (
      !state
    ) {
      return;
    }

    this.handleState(
      state
    );
  }

  private handleState(
    state: MultiplayerState
  ): void {
    if (
      !this.active ||
      !this.callbacks
    ) {
      return;
    }

    const roomCode =
      this.multiplayer.getRoomCode();

    const playerId =
      this.multiplayer.getPlayerId();

    this.callbacks.onPlayersUpdated(
      state.players,
      playerId
    );

    const localPlayer =
      state.players.find(
        (player) =>
          player.id === playerId
      ) ?? null;

    this.callbacks.onLocalPlayerUpdated(
      localPlayer
    );

    if (
      state.phase === 'lobby' &&
      roomCode
    ) {
      this.callbacks.onLobby(
        state,
        roomCode,
        playerId
      );

      return;
    }

    if (
      state.phase === 'playing'
    ) {
      this.callbacks.onPlaying(
        state
      );

      return;
    }

    if (
      state.phase === 'ended'
    ) {
      const isHost =
        playerId === state.hostId;

      this.callbacks.onEnded(
        state,
        isHost
      );
    }
  }
}