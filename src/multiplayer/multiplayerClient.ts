import type {
  GameState,
  NetworkPlayer
} from './gameState';

export type MultiplayerStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected';

export class MultiplayerClient {

  private socket:
    WebSocket | null = null;

  private status:
    MultiplayerStatus =
      'disconnected';

  private gameState:
    GameState | null = null;

  private playerId:
    string | null = null;

  private roomCode:
    string | null = null;

  private onStateUpdate:
    ((state: GameState) => void) | null =
    null;

  private onStatusChange:
    ((status: MultiplayerStatus) => void) | null =
    null;

  // ==============================
  // CONNECT
  // ==============================

  connect(
    serverUrl: string
  ) {
    if (
      this.socket &&
      this.socket.readyState ===
        WebSocket.OPEN
    ) {
      return;
    }

    this.setStatus(
      'connecting'
    );

    this.socket =
      new WebSocket(
        serverUrl
      );

    this.socket.addEventListener(
      'open',
      () => {
        this.setStatus(
          'connected'
        );
      }
    );

    this.socket.addEventListener(
      'message',
      (event) => {
        this.handleMessage(
          event.data
        );
      }
    );

    this.socket.addEventListener(
      'close',
      () => {
        this.socket =
          null;

        this.setStatus(
          'disconnected'
        );
      }
    );

    this.socket.addEventListener(
      'error',
      () => {
        this.setStatus(
          'disconnected'
        );
      }
    );
  }

  // ==============================
  // DISCONNECT
  // ==============================

  disconnect() {
    if (
      this.socket
    ) {
      this.socket.close();

      this.socket =
        null;
    }

    this.playerId =
      null;

    this.roomCode =
      null;

    this.gameState =
      null;

    this.setStatus(
      'disconnected'
    );
  }

  // ==============================
  // CREATE ROOM
  // ==============================

  createRoom() {
    this.send({
      type: 'create-room'
    });
  }

  // ==============================
  // JOIN ROOM
  // ==============================

  joinRoom(
    roomCode: string
  ) {
    this.send({
      type: 'join-room',
      roomCode:
        roomCode
          .trim()
          .toUpperCase()
    });
  }

  // ==============================
  // SEND PLAYER STATE
  // ==============================

  sendPlayerState(
    player: NetworkPlayer
  ) {
    this.send({
      type: 'player-state',
      player
    });
  }

  // ==============================
  // LEAVE ROOM
  // ==============================

  leaveRoom() {
    this.send({
      type: 'leave-room'
    });

    this.roomCode =
      null;
  }

  // ==============================
  // STATE CALLBACK
  // ==============================

  setStateListener(
    callback:
      (state: GameState) => void
  ) {
    this.onStateUpdate =
      callback;
  }

  // ==============================
  // STATUS CALLBACK
  // ==============================

  setStatusListener(
    callback:
      (
        status: MultiplayerStatus
      ) => void
  ) {
    this.onStatusChange =
      callback;
  }

  // ==============================
  // GETTERS
  // ==============================

  getStatus() {
    return this.status;
  }

  getGameState() {
    return this.gameState;
  }

  getPlayerId() {
    return this.playerId;
  }

  getRoomCode() {
    return this.roomCode;
  }

  // ==============================
  // MESSAGE HANDLING
  // ==============================

  private handleMessage(
    rawMessage: string
  ) {
    let message: any;

    try {
      message =
        JSON.parse(
          rawMessage
        );
    } catch {
      console.error(
        'Invalid multiplayer message:',
        rawMessage
      );

      return;
    }

    switch (
      message.type
    ) {

      case 'connected':
        this.playerId =
          message.playerId;

        break;

      case 'room-created':
        this.roomCode =
          message.roomCode;

        break;

      case 'room-joined':
        this.roomCode =
          message.roomCode;

        break;

      case 'game-state':
        this.gameState =
          message.state;

        if (
          this.onStateUpdate &&
          this.gameState
        ) {
          this.onStateUpdate(
            this.gameState
          );
        }

        break;

      case 'error':
        console.error(
          'Multiplayer error:',
          message.message
        );

        break;

      default:
        console.warn(
          'Unknown multiplayer message:',
          message
        );
    }
  }

  // ==============================
  // SEND
  // ==============================

  private send(
    message: unknown
  ) {
    if (
      !this.socket ||
      this.socket.readyState !==
        WebSocket.OPEN
    ) {
      console.warn(
        'Multiplayer socket is not connected.'
      );

      return;
    }

    this.socket.send(
      JSON.stringify(
        message
      )
    );
  }

  // ==============================
  // STATUS
  // ==============================

  private setStatus(
    status: MultiplayerStatus
  ) {
    this.status =
      status;

    if (
      this.onStatusChange
    ) {
      this.onStatusChange(
        status
      );
    }
  }
}