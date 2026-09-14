import type {
  GameState,
  NetworkPlayer
} from '../game/gameState';

export type MultiplayerStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected';

export class MultiplayerClient {

  private socket:
    WebSocket | null =
    null;

  private status:
    MultiplayerStatus =
    'disconnected';

  private gameState:
    GameState | null =
    null;

  private playerId:
    string | null =
    null;

  private roomCode:
    string | null =
    null;

  private onStateUpdate:
    ((
      state: GameState
    ) => void) | null =
    null;

  private stateListeners:
    Array<
      (state: GameState) => void
    > = [];

  private onStatusChange:
    ((
      status:
        MultiplayerStatus
    ) => void) | null =
    null;

  connect(serverUrl: string): void {

    if (
      this.socket &&
      (
        this.socket.readyState ===
          WebSocket.OPEN ||
        this.socket.readyState ===
          WebSocket.CONNECTING
      )
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

        console.log(
          'Multiplayer connected.'
        );

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

        console.log(
          'Multiplayer disconnected.'
        );

        this.socket = null;

        this.setStatus(
          'disconnected'
        );
      }
    );

    this.socket.addEventListener(
      'error',
      (error) => {

        console.error(
          'Multiplayer WebSocket error:',
          error
        );

        this.setStatus(
          'disconnected'
        );
      }
    );
  }

  disconnect(): void {

    if (
      this.socket
    ) {
      this.socket.close();
      this.socket = null;
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

  createRoom(): void {

    this.send({
      type:
        'create-room'
    });
  }

  joinRoom(
    roomCode: string
  ): void {

    this.send({
      type:
        'join-room',

      roomCode:
        roomCode
          .trim()
          .toUpperCase()
    });
  }

  sendPlayerState(
    player: NetworkPlayer
  ): void {

    if (!this.playerId) {
      return;
    }

    this.send({
      type:
        'player-state',

      player: {
        ...player,
        id: this.playerId
      }
    });
  }

  sendTrapPlayer(
    targetId: string
  ): void {

    console.log(
      'Sending trap-player:',
      targetId
    );

    this.send({
      type:
        'trap-player',

      targetId
    });
  }

  startGame(): void {

    this.send({
      type:
        'start-game'
    });
  }

  playAgain(): void {

    this.send({
      type:
        'play-again'
    });
  }

  leaveRoom(): void {

    this.send({
      type:
        'leave-room'
    });

    this.roomCode =
      null;
  }

  setStateListener(
    callback:
      (state: GameState) => void
  ): void {

    this.onStateUpdate =
      callback;
  }

  addStateListener(
    callback:
      (state: GameState) => void
  ): void {

    this.stateListeners.push(
      callback
    );
  }

  setStatusListener(
    callback:
      (
        status:
          MultiplayerStatus
      ) => void
  ): void {

    this.onStatusChange =
      callback;
  }

  getStatus():
    MultiplayerStatus {

    return this.status;
  }

  getGameState():
    GameState | null {

    return this.gameState;
  }

  getPlayerId():
    string | null {

    return this.playerId;
  }

  getRoomCode():
    string | null {

    return this.roomCode;
  }

  private handleMessage(
    rawMessage: string
  ): void {

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

        console.log(
          'Assigned player ID:',
          this.playerId
        );

        break;

      case 'room-created':

        this.roomCode =
          message.roomCode;

        console.log(
          'Created room:',
          this.roomCode
        );

        break;

      case 'room-joined':

        this.roomCode =
          message.roomCode;

        console.log(
          'Joined room:',
          this.roomCode
        );

        break;

        case 'game-state':
          this.gameState = message.state;

          if (this.gameState) {

            console.log(
              '[NETWORK GAME STATE]',
              'client:',
              this.playerId,
              'phase:',
              this.gameState.phase,
              'players:',
              this.gameState.players.length,
              this.gameState.players.map(
                player => player.id
              )
            );

            if (this.onStateUpdate) {
              this.onStateUpdate(
                this.gameState
              );
            }

            for (
              const listener of
                this.stateListeners
            ) {
              listener(
                this.gameState
              );
            }
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

        break;
    }
  }

  private send(
    message: unknown
  ): void {

    if (
      !this.socket ||
      this.socket.readyState !==
        WebSocket.OPEN
    ) {

      console.warn(
        'Cannot send multiplayer message; socket is not connected.'
      );

      return;
    }

    this.socket.send(
      JSON.stringify(
        message
      )
    );
  }

  private setStatus(
    status:
      MultiplayerStatus
  ): void {

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