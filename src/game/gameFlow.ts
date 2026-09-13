import { gameState } from './gameState';

export interface GameFlowCallbacks {
  onStartAI: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomCode: string) => void;
  onStartMultiplayer: () => void;
  onPlayerDeath: () => void;
  onVictory: () => void;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
  onLeaveRoom: () => void;
  onResume: () => void;
}

export class GameFlow {

  private readonly callbacks: GameFlowCallbacks;

  constructor(
    callbacks: GameFlowCallbacks
  ) {
    this.callbacks = callbacks;
  }

  // ==============================
  // VS AI
  // ==============================

  startAI(): void {

    gameState.multiplayer = false;
    gameState.started = true;
    gameState.playerDead = false;
    gameState.playerTrapped = false;
    gameState.aiRoundOver = false;

    this.callbacks.onStartAI();
  }

  // ==============================
  // CREATE ROOM
  // ==============================

  createRoom(): void {

    gameState.multiplayer = true;
    gameState.started = false;
    gameState.playerDead = false;
    gameState.playerTrapped = false;
    gameState.aiRoundOver = false;

    this.callbacks.onCreateRoom();
  }

  // ==============================
  // JOIN ROOM
  // ==============================

  joinRoom(
    roomCode: string
  ): void {

    gameState.multiplayer = true;
    gameState.started = false;
    gameState.playerDead = false;
    gameState.playerTrapped = false;
    gameState.aiRoundOver = false;

    this.callbacks.onJoinRoom(
      roomCode
    );
  }

  // ==============================
  // MULTIPLAYER GAME START
  // ==============================

  startMultiplayer(): void {

    gameState.multiplayer = true;
    gameState.started = true;
    gameState.playerDead = false;
    gameState.playerTrapped = false;
    gameState.aiRoundOver = false;

    this.callbacks.onStartMultiplayer();
  }

  // ==============================
  // PLAYER DEATH
  // ==============================

  playerDied(): void {

    if (gameState.playerDead) {
      return;
    }

    gameState.playerDead = true;
    gameState.playerTrapped = false;

    this.callbacks.onPlayerDeath();
  }

  // ==============================
  // VICTORY
  // ==============================

  victory(): void {

    if (gameState.aiRoundOver) {
      return;
    }

    gameState.aiRoundOver = true;

    this.callbacks.onVictory();
  }

  // ==============================
  // PLAY AGAIN
  // ==============================

  playAgain(): void {

    gameState.playerDead = false;
    gameState.playerTrapped = false;
    gameState.aiRoundOver = false;

    // VS AI can immediately restart.
    // Multiplayer waits for the server to
    // confirm the new round.
    if (!gameState.multiplayer) {
      gameState.started = true;
    }

    this.callbacks.onPlayAgain();
  }

  // ==============================
  // LEAVE ROOM
  // ==============================

  leaveRoom(): void {

    gameState.multiplayer = false;
    gameState.started = false;
    gameState.playerDead = false;
    gameState.playerTrapped = false;
    gameState.aiRoundOver = false;

    this.callbacks.onLeaveRoom();
  }

  // ==============================
  // RETURN TO MENU
  // ==============================

  returnToMenu(): void {

    gameState.multiplayer = false;
    gameState.started = false;
    gameState.playerDead = false;
    gameState.playerTrapped = false;
    gameState.aiRoundOver = false;

    this.callbacks.onReturnToMenu();
  }

  // ==============================
  // RESUME
  // ==============================

  resume(): void {

    if (
      gameState.playerDead ||
      gameState.aiRoundOver
    ) {
      return;
    }

    gameState.started = true;

    this.callbacks.onResume();
  }

  // ==============================
  // TRAP STATE
  // ==============================

  setTrapped(
    trapped: boolean
  ): void {

    gameState.playerTrapped =
      trapped;
  }

  // ==============================
  // RESET
  // ==============================

  reset(): void {

    gameState.started = false;
    gameState.multiplayer = false;
    gameState.playerTrapped = false;
    gameState.playerDead = false;
    gameState.aiRoundOver = false;
  }
}