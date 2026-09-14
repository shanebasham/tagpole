import * as THREE from 'three';

import { gameState } from '../game/gameState';

import type {
  MultiplayerClient
} from './multiplayerClient';

import type {
  MultiplayerGame,
  MultiplayerState
} from './multiplayerGame';

import type {
  RemotePlayerManager
} from './remotePlayerManager';

import type {
  PlayerController
} from '../player/playerController';

import type {
  MainMenu
} from '../menu/mainMenu';

import type {
  createGameHud
} from '../ui/gameHud';

import type {
  createDeathScreen
} from '../ui/gameOverScreen';

import type {
  LocalTrapBubble
} from '../player/combat/localTrapBubble';

import {
  createLocalTrapBubble
} from '../player/combat/localTrapBubble';

import type {
  AIManager
} from '../player/ai/aiManager';

export interface MultiplayerController {

  start(): void;

  stop(): void;

  createRoom(): void;

  joinRoom(
    roomCode: string
  ): void;

  startGame(): void;

  update(): void;
}

export interface MultiplayerControllerDependencies {

  scene: THREE.Scene;

  multiplayer: MultiplayerClient;

  multiplayerGame: MultiplayerGame;

  remotePlayerManager: RemotePlayerManager;

  playerController: PlayerController;

  mainMenu: MainMenu;

  hud: ReturnType<
    typeof createGameHud
  >;

  deathScreen: ReturnType<
    typeof createDeathScreen
  >;

  pointerLock: {
    lock(): void;
    unlock(): void;
  };

  aiManager: AIManager;

  getLocalTrapBubble: () =>
    LocalTrapBubble | null;

  setLocalTrapBubble: (
    bubble: LocalTrapBubble | null
  ) => void;

  updateCombatTargets: () => void;
}

export function createMultiplayerController(
  dependencies: MultiplayerControllerDependencies
): MultiplayerController {

  const {
    scene,
    multiplayer,
    multiplayerGame,
    remotePlayerManager,
    playerController,
    mainMenu,
    hud,
    deathScreen,
    pointerLock,
    aiManager,
    getLocalTrapBubble,
    setLocalTrapBubble,
    updateCombatTargets,
  } = dependencies;

  let startRequested =
    false;

  let lastLobbyRoomCode:
    string | null =
    null;

  let lastLobbyPlayerCount =
    -1;

  let lastLobbyMaxPlayers =
    -1;

  let lastLobbyIsHost =
    false;

  // ==============================
  // LOBBY DISPLAY
  // ==============================

  const resetLobbyDisplay =
    (): void => {

      lastLobbyRoomCode =
        null;

      lastLobbyPlayerCount =
        -1;

      lastLobbyMaxPlayers =
        -1;

      lastLobbyIsHost =
        false;
    };

  // ==============================
  // START / STOP
  // ==============================

  const start = (): void => {

    multiplayerGame.start();
  };

  const stop = (): void => {

    multiplayerGame.stop();

    startRequested =
      false;

    resetLobbyDisplay();
  };

  // ==============================
  // CREATE ROOM
  // ==============================

  const createRoom = (): void => {

    startRequested =
      false;

    resetLobbyDisplay();

    playerController.clearTrap();

    aiManager.clear();

    remotePlayerManager.clear();

    multiplayerGame.start();

    multiplayer.createRoom();
  };

  // ==============================
  // JOIN ROOM
  // ==============================

  const joinRoom = (
    roomCode: string
  ): void => {

    startRequested =
      false;

    resetLobbyDisplay();

    playerController.clearTrap();

    aiManager.clear();

    remotePlayerManager.clear();

    multiplayerGame.start();

    multiplayer.joinRoom(
      roomCode
    );
  };

  // ==============================
  // START GAME
  // ==============================

  const startGame = (): void => {

    if (
      multiplayer.getStatus() !==
      'connected'
    ) {

      console.warn(
        'Cannot start multiplayer game; multiplayer is not connected.'
      );

      return;
    }

    if (
      startRequested
    ) {
      return;
    }

    startRequested =
      true;

    multiplayerGame.start();

    gameState.multiplayer =
      true;

    gameState.started =
      true;

    gameState.playerDead =
      false;

    gameState.playerTrapped =
      false;

    gameState.aiRoundOver =
      false;

    pointerLock.lock();

    multiplayer.startGame();
  };

  // ==============================
  // REMOTE PLAYERS
  // ==============================

  const updatePlayers = (
    players:
      MultiplayerState['players'],
    playerId:
      string | null
  ): void => {

    if (
      !gameState.multiplayer
    ) {
      return;
    }

    remotePlayerManager.update(
      players,
      playerId
    );

    updateCombatTargets();
  };

  // ==============================
  // LOCAL PLAYER
  // ==============================

  const updateLocalPlayer = (
    networkPlayer:
      MultiplayerState['players'][number] |
      null
  ): void => {

    if (
      !gameState.multiplayer ||
      !networkPlayer
    ) {
      return;
    }

    /*
     * Give Player the authoritative
     * server trap timing/state.
     */
    playerController.updateNetworkState(
      networkPlayer
    );

    // ============================
    // DROWNED
    // ============================

    if (
      networkPlayer.isDrowned
    ) {
      return;
    }

    // ============================
    // NEW TRAP
    // ============================

    if (
      networkPlayer.trapped &&
      !gameState.playerTrapped &&
      !gameState.playerDead
    ) {

      let bubble =
        getLocalTrapBubble();

      if (
        !bubble
      ) {

        bubble =
          createLocalTrapBubble(
            scene,
            networkPlayer
          );

        setLocalTrapBubble(
          bubble
        );
      }

      playerController.trap(
        bubble.mesh
      );

      return;
    }

    // ============================
    // TRAP RELEASED
    // ============================

    if (
      !networkPlayer.trapped &&
      gameState.playerTrapped &&
      !gameState.playerDead
    ) {

      playerController.clearTrap();

      return;
    }
  };

  // ==============================
  // LOBBY
  // ==============================

  const handleLobby = (
    state: MultiplayerState,
    roomCode: string,
    playerId: string | null
  ): void => {

    if (
      startRequested
    ) {
      return;
    }

    pointerLock.unlock();

    gameState.multiplayer =
      true;

    gameState.started =
      false;

    gameState.playerDead =
      false;

    gameState.playerTrapped =
      false;

    gameState.aiRoundOver =
      false;

    const isHost =
      playerId === state.hostId;

    const lobbyChanged =
      roomCode !==
        lastLobbyRoomCode ||
      state.players.length !==
        lastLobbyPlayerCount ||
      state.maxPlayers !==
        lastLobbyMaxPlayers ||
      isHost !==
        lastLobbyIsHost;

    if (
      !lobbyChanged
    ) {
      return;
    }

    lastLobbyRoomCode =
      roomCode;

    lastLobbyPlayerCount =
      state.players.length;

    lastLobbyMaxPlayers =
      state.maxPlayers;

    lastLobbyIsHost =
      isHost;

    playerController.clearTrap();

    playerController.reset();

    aiManager.clear();

    remotePlayerManager.clear();

    deathScreen.hide();

    mainMenu.showLobby(
      roomCode,
      state.players.length,
      state.maxPlayers,
      isHost
    );
  };

  // ==============================
  // PLAYING
  // ==============================

  const handlePlaying = (
    state: MultiplayerState
  ): void => {

    startRequested =
      false;

    resetLobbyDisplay();

    gameState.started =
      true;

    gameState.multiplayer =
      true;

    gameState.playerDead =
      false;

    /*
     * DO NOT reset playerTrapped here.
     *
     * updateLocalPlayer() runs immediately
     * before this function when a network
     * state arrives. If we reset it here,
     * the local trap is immediately cleared
     * from gameState even though the server
     * says the player is trapped.
     *
     * startGame(), handleLobby(), and the
     * trap-release logic are responsible for
     * resetting the trapped state.
     */

    gameState.aiRoundOver =
      false;

    aiManager.clear();

    deathScreen.hide();

    mainMenu.hide();

    hud.setPlayersAlive(
      state.players.filter(
        (player) =>
          player.alive
      ).length
    );

    updateCombatTargets();
  };

  // ==============================
  // ROUND ENDED
  // ==============================

  const handleEnded = (
    state: MultiplayerState,
    isHost: boolean
  ): void => {

    startRequested =
      false;

    resetLobbyDisplay();

    gameState.started =
      true;

    gameState.multiplayer =
      true;

    gameState.playerTrapped =
      false;

    pointerLock.unlock();

    aiManager.clear();

    playerController.clearTrap();

    hud.setPlayersAlive(
      state.players.filter(
        (player) =>
          player.alive
      ).length
    );

    deathScreen.show(
      'round-over',
      isHost
    );
  };

  // ==============================
  // CALLBACKS
  // ==============================

  multiplayerGame.setCallbacks({

    onLobby:
      handleLobby,

    onPlaying:
      handlePlaying,

    onEnded:
      handleEnded,

    onPlayersUpdated:
      updatePlayers,

    onLocalPlayerUpdated:
      updateLocalPlayer,
  });

  // ==============================
  // CONTROLLER
  // ==============================

  return {

    start,

    stop,

    createRoom,

    joinRoom,

    startGame,

    update: (): void => {

      multiplayerGame.update();
    },
  };
}