import type {
  NetworkPlayer
} from '../game/gameState';

import type {
  MultiplayerClient
} from './multiplayerClient';

export type MultiplayerState =
  NonNullable<
    ReturnType<
      MultiplayerClient[
        'getGameState'
      ]
    >
  >;

export interface MultiplayerGameCallbacks {

  onLobby: (
    state:
      MultiplayerState,

    roomCode:
      string,

    playerId:
      string | null
  ) => void;

  onPlaying: (
    state:
      MultiplayerState
  ) => void;

  onEnded: (
    state:
      MultiplayerState,

    isHost:
      boolean
  ) => void;

  onPlayersUpdated: (
    players:
      NetworkPlayer[],

    playerId:
      string | null
  ) => void;

  onLocalPlayerUpdated: (
    player:
      NetworkPlayer | null
  ) => void;
}

export class MultiplayerGame {

  private readonly multiplayer:
    MultiplayerClient;

  private callbacks:
    MultiplayerGameCallbacks | null =
    null;

  private active =
    false;

  constructor(
    multiplayer:
      MultiplayerClient
  ) {

    this.multiplayer =
      multiplayer;

    /*
     * Process each incoming server state
     * exactly once.
     */
    this.multiplayer.addStateListener(
      (state) => {

        this.handleState(
          state
        );
      }
    );
  }

  setCallbacks(
    callbacks:
      MultiplayerGameCallbacks
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

    /*
     * State updates are handled by the
     * WebSocket listener.
     *
     * Do not process the same state again
     * every render frame.
     */
  }

  private handleState(
    state:
      MultiplayerState
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

    /*
     * Update all remote players.
     */
    this.callbacks.onPlayersUpdated(
      state.players,
      playerId
    );

    /*
     * Update our local player's
     * authoritative multiplayer state.
     */
    const localPlayer =
      state.players.find(
        (player) =>
          player.id ===
          playerId
      ) ?? null;

    this.callbacks.onLocalPlayerUpdated(
      localPlayer
    );

    /*
     * Lobby.
     */
    if (
      state.phase ===
        'lobby' &&
      roomCode
    ) {

      this.callbacks.onLobby(
        state,
        roomCode,
        playerId
      );

      return;
    }

    /*
     * Playing.
     */
    if (
      state.phase ===
      'playing'
    ) {

      this.callbacks.onPlaying(
        state
      );

      return;
    }

    /*
     * Round ended.
     */
    if (
      state.phase ===
      'ended'
    ) {

      const isHost =
        playerId ===
        state.hostId;

      this.callbacks.onEnded(
        state,
        isHost
      );
    }
  }
}