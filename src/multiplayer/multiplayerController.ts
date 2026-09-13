import * as THREE from 'three';

import { gameState } from '../game/gameState';
import type { MultiplayerClient } from './multiplayerClient';
import type { MultiplayerGame, MultiplayerState } from './multiplayerGame';
import type { RemotePlayerManager } from './remotePlayerManager';
import type { PlayerController } from '../player/playerController';
import type { MainMenu } from '../menu/mainMenu';
import type { createGameHud } from '../ui/gameHud';
import type { createDeathScreen } from '../ui/gameOverScreen';
import type { LocalTrapBubble } from '../player/combat/localTrapBubble';
import { createLocalTrapBubble } from '../player/combat/localTrapBubble';
import type { AIManager } from '../player/ai/aiManager';

export interface MultiplayerController {
  start(): void;
  stop(): void;
  createRoom(): void;
  joinRoom(roomCode: string): void;
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
  hud: ReturnType<typeof createGameHud>;
  deathScreen: ReturnType<typeof createDeathScreen>;
  pointerLock: {
    lock(): void;
    unlock(): void;
  };
  aiManager: AIManager;
  getLocalTrapBubble: () => LocalTrapBubble | null;
  setLocalTrapBubble: (bubble: LocalTrapBubble | null) => void;
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

  let startRequested = false;

  const start = (): void => {
    multiplayerGame.start();
  };

  const stop = (): void => {
    multiplayerGame.stop();
    startRequested = false;
  };

  const createRoom = (): void => {
    startRequested = false;

    playerController.clearTrap();
    aiManager.clear();
    remotePlayerManager.clear();

    multiplayerGame.start();
    multiplayer.createRoom();
  };

  const joinRoom = (
    roomCode: string
  ): void => {
    startRequested = false;

    playerController.clearTrap();
    aiManager.clear();
    remotePlayerManager.clear();

    multiplayerGame.start();
    multiplayer.joinRoom(roomCode);
  };

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

    startRequested = true;

    multiplayerGame.start();

    gameState.multiplayer =
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

  const updatePlayers = (
    players: MultiplayerState['players'],
    playerId: string | null
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

    if (
      networkPlayer.isDrowned
    ) {
      if (
        !gameState.playerDead
      ) {
        playerController.die();
      }

      return;
    }

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

    if (
      !networkPlayer.trapped &&
      gameState.playerTrapped &&
      !gameState.playerDead
    ) {
      playerController.clearTrap();
    }
  };

  const handleLobby = (
    state: MultiplayerState,
    roomCode: string,
    playerId: string | null
  ): void => {
    pointerLock.unlock();

    gameState.multiplayer =
      true;

    gameState.playerDead =
      false;

    gameState.playerTrapped =
      false;

    gameState.aiRoundOver =
      false;

    if (
      !startRequested
    ) {
      gameState.started =
        false;

      playerController.clearTrap();
      playerController.reset();

      aiManager.clear();

      remotePlayerManager.clear();

      deathScreen.hide();

      const isHost =
        playerId === state.hostId;

      mainMenu.showLobby(
        roomCode,
        state.players.length,
        state.maxPlayers,
        isHost
      );
    }
  };

  const handlePlaying = (
    state: MultiplayerState
  ): void => {
    startRequested = false;

    gameState.started =
      true;

    gameState.multiplayer =
      true;

    gameState.playerDead =
      false;

    gameState.playerTrapped =
      false;

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

  const handleEnded = (
    state: MultiplayerState,
    isHost: boolean
  ): void => {
    startRequested = false;

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