import * as THREE from 'three';

import './style.css';
import './debug/errorCatcher';

import { gameState } from './game/gameState';
import { GameFlow } from './game/gameFlow';
import { GameLoop } from './game/gameLoop';
import { getRandomSpawnPositions } from './game/spawnPositions';

import { createCombatController } from './player/combat/combatController';
import { createGameWorldController } from './game/gameWorldController';
import { WorldManager } from './world/worldManager';

import { MultiplayerClient } from './multiplayer/multiplayerClient';
import { MultiplayerGame } from './multiplayer/multiplayerGame';
import { RemotePlayerManager } from './multiplayer/remotePlayerManager';
import { createMultiplayerController } from './multiplayer/multiplayerController';

import { Player } from './player/player';
import { createPlayerController } from './player/playerController';
import { createControls } from './player/controls';
import { createFlashlight } from './player/flashlight';

import { AIManager } from './player/ai/aiManager';

import {
  clearLocalTrapBubble,
  updateLocalTrapBubble,
} from './player/combat/localTrapBubble';

import type {
  LocalTrapBubble,
} from './player/combat/localTrapBubble';

import { createDeathScreen } from './ui/gameOverScreen';
import { createGameHud } from './ui/gameHud';
import { createHudController } from './ui/hudController';
import { createInputManager } from './ui/inputManager';
import { createPointerLock } from './ui/pointerLock';
import { createPauseMenu } from './ui/pauseMenu';

import { MainMenu } from './menu/mainMenu';

import type {
  MultiplayerController,
} from './multiplayer/multiplayerController';

import type {
  PlayerColor,
} from './game/playerColor';

// ==============================
// SCENE
// ==============================

const scene =
  new THREE.Scene();

const underwaterColor =
  new THREE.Color(
    0x03131d
  );

scene.background =
  underwaterColor;

scene.fog =
  new THREE.FogExp2(
    underwaterColor,
    0.035
  );

// ==============================
// CAMERA
// ==============================

const camera =
  new THREE.PerspectiveCamera(
    75,
    window.innerWidth /
      window.innerHeight,
    0.1,
    500
  );

camera.position.set(
  0,
  0,
  10
);

camera.rotation.order =
  'YXZ';

// ==============================
// RENDERER
// ==============================

const renderer =
  new THREE.WebGLRenderer({
    antialias: true,
  });

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

renderer.setPixelRatio(
  Math.min(
    window.devicePixelRatio,
    2
  )
);

document.body.appendChild(
  renderer.domElement
);

renderer.domElement.style.position =
  'fixed';

renderer.domElement.style.left =
  '0';

renderer.domElement.style.top =
  '0';

renderer.domElement.style.width =
  '100vw';

renderer.domElement.style.height =
  '100vh';

renderer.domElement.style.zIndex =
  '1';

renderer.domElement.style.touchAction =
  'none';

// ==============================
// POINTER LOCK
// ==============================

const pointerLock =
  createPointerLock(
    renderer.domElement
  );

// ==============================
// CONTROLS
// ==============================

const controls =
  createControls(
    renderer.domElement
  );

// ==============================
// PLAYER
// ==============================

const player =
  new Player(
    scene,
    camera,
    controls
  );

// ==============================
// WORLD
// ==============================

const worldManager =
  new WorldManager(
    scene
  );

worldManager.create();

// ==============================
// FLASHLIGHT
// ==============================

const flashlightSystem =
  createFlashlight(
    scene
  );

// ==============================
// MULTIPLAYER
// ==============================

const multiplayer =
  new MultiplayerClient();

multiplayer.setStatusListener(
  status => {
    console.log(
      'Multiplayer status:',
      status
    );
  }
);

// ========================================
// WORLD SEED SYNCHRONIZATION
// ========================================

let loadedWorldSeed =
  worldManager.getWorldSeed();

multiplayer.setStateListener(
  state => {

    if (
      state.worldSeed !== 0 &&
      state.worldSeed !==
        loadedWorldSeed
    ) {

      console.log(
        'Loading multiplayer world seed:',
        state.worldSeed
      );

      loadedWorldSeed =
        state.worldSeed;

      worldManager.reset(
        state.worldSeed
      );
    }
  }
);

// ========================================
// CONNECT
// ========================================

const multiplayerServerUrl =
  window.location.protocol ===
    'https:'
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`;

multiplayer.connect(
  multiplayerServerUrl
);

// ========================================
// REMOTE PLAYERS
// ========================================

const remotePlayerManager =
  new RemotePlayerManager(
    scene,
    multiplayer
  );

// ========================================
// MULTIPLAYER GAME
// ========================================

const multiplayerGame =
  new MultiplayerGame(
    multiplayer
  );

// ==============================
// LOCAL TRAP BUBBLE
// ==============================

let localTrapBubble:
  LocalTrapBubble | null =
  null;

function clearCurrentLocalTrap(): void {

  clearLocalTrapBubble(
    localTrapBubble
  );

  localTrapBubble =
    null;
}

// ==============================
// HUD
// ==============================

const hud =
  createGameHud();

hud.setRole(
  player.isIt
);

hud.setAlive(
  true
);

hud.setPlayersAlive(
  12
);

hud.setCrosshairVisible(
  true
);

// ==============================
// FORWARD DECLARATIONS
// ==============================

let gameFlow:
  GameFlow;

let aiManager:
  AIManager;

let combatController:
  ReturnType<
    typeof createCombatController
  >;

let mainMenu:
  MainMenu;

let deathScreen:
  ReturnType<
    typeof createDeathScreen
  >;

let pauseMenu:
  ReturnType<
    typeof createPauseMenu
  >;

let multiplayerController:
  MultiplayerController;

// ==============================
// AI
// ==============================

aiManager =
  new AIManager(
    scene,
    camera,
    worldManager.getRocks(),
    {

      onPlayerTrapped: (
        bubble: THREE.Mesh
      ) => {

        if (
          gameState.multiplayer ||
          gameState.playerTrapped ||
          gameState.playerDead
        ) {
          return;
        }

        gameFlow.setTrapped(
          true
        );

        player.setTrapped(
          true,
          bubble
        );

        hud.setAlive(
          true
        );

        hud.setTrapped(
          true,
          bubble
        );

        hud.setCrosshairVisible(
          false
        );
      },

      onPlayerDied: () => {

        if (
          gameState.multiplayer ||
          gameState.playerDead
        ) {
          return;
        }

        gameFlow.playerDied();
      },

      isPlayerTrapped: () => {

        return gameState.playerTrapped;
      },
    }
  );

// ==============================
// GAME FLOW
// ==============================

gameFlow =
  new GameFlow({

    onStartAI: (
      aiCount
    ) => {

      clearCurrentLocalTrap();

      multiplayerGame.stop();

      remotePlayerManager.clear();

      player.setTrapped(
        false
      );

      player.model.visible =
        false;

      // ==============================
      // RANDOM CLOCK SPAWNS
      // ==============================

      const spawnPositions =
        getRandomSpawnPositions(
          aiCount + 1
        );

      player.model.position.copy(
        spawnPositions[0]
      );

      player.camera.position.set(
        spawnPositions[0].x,
        spawnPositions[0].y,
        spawnPositions[0].z
      );

      player.camera.rotation.set(
        0,
        0,
        0
      );

      player.camera.rotation.order =
        'YXZ';

      aiManager.create(
        aiCount,
        spawnPositions
      );

      hud.setAlive(
        true
      );

      hud.setTrapped(
        false,
        null
      );

      hud.setCrosshairVisible(
        true
      );

      hud.setPlayersAlive(
        aiManager.getAliveCount() + 1
      );

      combatController.updateCombatTargets();

      pointerLock.lock();
    },

    onCreateRoom: () => {

      multiplayerController.createRoom();
    },

    onJoinRoom: (
      roomCode
    ) => {

      multiplayerController.joinRoom(
        roomCode
      );
    },

    onStartMultiplayer: () => {

      multiplayerController.startGame();
    },

    onPlayerDeath: () => {

      if (
        gameState.multiplayer
      ) {
        return;
      }

      pointerLock.unlock();

      hud.setTrapped(
        false,
        null
      );

      hud.setAlive(
        false
      );

      hud.setCrosshairVisible(
        false
      );

      player.startDeathFloat(
        () => {

          deathScreen.show();
        }
      );
    },

    onVictory: () => {

      pointerLock.unlock();

      hud.setCrosshairVisible(
        false
      );

      deathScreen.show(
        'victory',
        true
      );
    },

    onPlayAgain: () => {

      if (
        gameState.multiplayer
      ) {

        multiplayer.playAgain();

        return;
      }

      clearCurrentLocalTrap();

      player.setTrapped(
        false
      );

      player.model.visible =
        false;

      player.camera.position.set(
        0,
        0,
        10
      );

      player.camera.rotation.set(
        0,
        0,
        0
      );

      player.camera.rotation.order =
        'YXZ';

      worldManager.reset();

      const aiCount =
        gameFlow.getAICount();

      const spawnPositions =
        getRandomSpawnPositions(
          aiCount + 1
        );

      player.model.position.copy(
        spawnPositions[0]
      );

      player.camera.position.set(
        spawnPositions[0].x,
        spawnPositions[0].y,
        spawnPositions[0].z
      );

      player.camera.rotation.set(
        0,
        0,
        0
      );

      player.camera.rotation.order =
        'YXZ';

      aiManager.create(
        aiCount,
        spawnPositions
      );

      hud.setAlive(
        true
      );

      hud.setTrapped(
        false,
        null
      );

      hud.setCrosshairVisible(
        true
      );

      hud.setPlayersAlive(
        aiManager.getAliveCount() + 1
      );

      combatController.updateCombatTargets();

      pointerLock.lock();
    },

    onReturnToMenu: () => {

      pointerLock.unlock();

      clearCurrentLocalTrap();

      player.setTrapped(
        false
      );

      player.model.visible =
        false;

      aiManager.clear();

      remotePlayerManager.clear();

      deathScreen.hide();

      pauseMenu.hide();

      if (
        multiplayer.getRoomCode()
      ) {

        multiplayer.leaveRoom();
      }

      multiplayerGame.stop();

      mainMenu.show();
    },

    onLeaveRoom: () => {

      pointerLock.unlock();

      clearCurrentLocalTrap();

      player.setTrapped(
        false
      );

      player.model.visible =
        false;

      aiManager.clear();

      remotePlayerManager.clear();

      deathScreen.hide();

      pauseMenu.hide();

      multiplayerGame.stop();

      if (
        multiplayer.getRoomCode()
      ) {

        multiplayer.leaveRoom();
      }

      mainMenu.showFriendsMenu();
    },

    onResume: () => {

      pointerLock.lock();
    },
  });

// ==============================
// MAIN MENU
// ==============================

mainMenu =
  new MainMenu(

    player.model,

    (color: PlayerColor) => {

      player.setColor(
        color
      );
    },

    (aiCount: number) => {

      gameFlow.startAI(
        aiCount
      );
    },

    () => {

      gameFlow.createRoom();
    },

    (roomCode: string) => {

      gameFlow.joinRoom(
        roomCode
      );
    },

    () => {

      gameFlow.leaveRoom();
    },

    () => {

      gameFlow.startMultiplayer();
    }
  );

// ==============================
// GAME OVER SCREEN
// ==============================

deathScreen =
  createDeathScreen(

    () => {

      gameState.playerDead =
        true;

      gameState.playerTrapped =
        false;

      clearCurrentLocalTrap();

      hud.setTrapped(
        false,
        null
      );

      hud.setAlive(
        false
      );

      hud.setCrosshairVisible(
        false
      );

      player.model.visible =
        false;
    },

    () => {

      gameFlow.returnToMenu();
    },

    () => {

      gameFlow.playAgain();
    },

    () => {

      pointerLock.lock();
    }
  );

// ==============================
// PAUSE MENU
// ==============================

pauseMenu =
  createPauseMenu({

    onResume: () => {

      if (
        !gameState.started ||
        gameState.playerDead ||
        gameState.aiRoundOver
      ) {

        return;
      }

      gameFlow.resume();

      pointerLock.lock();
    },

    onExit: () => {

      gameFlow.returnToMenu();
    },
  });

pointerLock.onUnexpectedUnlock(
  () => {

    if (
      !gameState.started ||
      gameState.playerDead ||
      gameState.aiRoundOver ||
      pauseMenu.isVisible()
    ) {

      return;
    }

    pauseMenu.show();
  }
);

// ==============================
// PLAYER CONTROLLER
// ==============================

const playerController =
  createPlayerController({

    player,

    gameFlow,

    hud,

    getLocalTrapBubble: () =>
      localTrapBubble,

    setLocalTrapBubble: (
      bubble
    ) => {

      localTrapBubble =
        bubble;
    },
  });

// ==============================
// INPUT
// ==============================

createInputManager(
  player,
  pauseMenu
);

// ==============================
// COMBAT CONTROLLER
// ==============================

combatController =
  createCombatController({

    scene,

    player,

    aiManager,

    remotePlayerManager,

    multiplayer,

    getLocalTrapBubble: () =>
      localTrapBubble,
  });

// ==============================
// HUD CONTROLLER
// ==============================

const hudController =
  createHudController({

    hud,

    player,

    aiManager,

    multiplayer,

    getLocalTrapBubble: () =>
      localTrapBubble,
  });

// ==============================
// WORLD CONTROLLER
// ==============================

const gameWorldController =
  createGameWorldController({

    scene,

    player,

    worldManager,

    flashlight:
      flashlightSystem.flashlight,

    flashlightTarget:
      flashlightSystem.target,
  });

// ==============================
// MULTIPLAYER CONTROLLER
// ==============================

multiplayerController =
  createMultiplayerController({

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

    getLocalTrapBubble: () =>
      localTrapBubble,

    setLocalTrapBubble: (
      bubble
    ) => {

      localTrapBubble =
        bubble;
    },

    updateCombatTargets:
      combatController.updateCombatTargets,
  });

// ==============================
// AUTO START
// ==============================

const shouldStartAI =
  new URLSearchParams(
    window.location.search
  ).get('start') ===
  'ai';

if (
  shouldStartAI
) {

  gameFlow.startAI(
    gameFlow.getAICount()
  );

  combatController.updateCombatTargets();
}

// ==============================
// GAME LOOP
// ==============================

const gameLoop =
  new GameLoop({

    update: (
      delta,
      now
    ) => {

      // ========================
      // MULTIPLAYER NETWORK
      // ========================

      multiplayerController.update();

      // ========================
      // LOCAL TRAP ANIMATION
      // ========================

      if (
        gameState.multiplayer &&
        gameState.playerTrapped &&
        localTrapBubble
      ) {

        updateLocalTrapBubble(
          localTrapBubble
        );
      }

      // ========================
      // MAIN MENU
      // ========================

      if (
        !gameState.started
      ) {

        mainMenu.update(
          now
        );

        return;
      }

      // ========================
      // AI
      // ========================

      if (
        !gameState.multiplayer &&
        !gameState.aiRoundOver
      ) {

        aiManager.update(
          delta
        );
      }

      // ========================
      // VS AI VICTORY
      // ========================

      if (
        !gameState.multiplayer &&
        !gameState.playerDead &&
        !gameState.aiRoundOver
      ) {

        if (
          aiManager.getAliveCount() ===
          0
        ) {

          gameFlow.victory();
        }
      }

      // ========================
      // REMOTE PLAYERS
      // ========================

      remotePlayerManager.updateMovement(
        delta
      );

      // ========================
      // COMBAT
      // ========================

      combatController.update(
        delta
      );

      // ========================
      // WORLD
      // ========================

      gameWorldController.update(
        delta
      );

      // ========================
      // SEND LOCAL PLAYER STATE
      // ========================

      if (
        gameState.multiplayer &&
        gameState.started
      ) {

        multiplayer.sendPlayerState(
          player.getNetworkState()
        );
      }

      // ========================
      // HUD
      // ========================

      hudController.update();
    },

    render: () => {

      renderer.render(
        scene,
        player.camera
      );
    },
  });

// ==============================
// RESIZE
// ==============================

window.addEventListener(
  'resize',
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    mainMenu.resize();
  }
);

// ==============================
// START
// ==============================

combatController.updateCombatTargets();

gameLoop.start();