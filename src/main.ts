import * as THREE from 'three';

import './style.css';
import './debug/errorCatcher';

import {
  MultiplayerClient
} from './multiplayer/multiplayerClient';

import {
  RemotePlayer
} from './multiplayer/remotePlayer';

import {
  Player
} from './player/player';

import {
  createDeathScreen
} from './ui/deathScreen';

import {
  createGameHud
} from './ui/gameHud';

import {
  createControls
} from './player/controls';

import {
  AITadpole
} from './player/ai/aiTadpole';

import {
  createRocks
} from './world/rocks';

import {
  updateRockCollisions
} from './world/collisions';

import {
  createOceanVegetation,
  updateSeaweed
} from './world/oceanVegetation';

import {
  createOcean
} from './world/ocean';

import {
  updateBoundaries
} from './world/boundaries';

import {
  createFlashlight,
  updateFlashlight
} from './player/flashlight';

import {
  getBoostCooldown,
} from './player/movement';

import {
  MainMenu
} from './menu/mainMenu';

import type {
  NetworkPlayer
} from './multiplayer/gameState';

// ==============================
// SCENE
// ==============================

const scene =
  new THREE.Scene();

const underwaterColor =
  new THREE.Color(
    0x03131d
  );

const aboveWaterColor =
  new THREE.Color(
    0x02050c
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
// MULTIPLAYER
// ==============================

const multiplayer =
  new MultiplayerClient();

multiplayer.setStatusListener(
  (status) => {

    console.log(
      'Multiplayer status:',
      status
    );
  }
);

const multiplayerProtocol =
  window.location.protocol ===
  'https:'
    ? 'wss:'
    : 'ws:';

multiplayer.connect(
  `${multiplayerProtocol}//${window.location.host}`
);

// ==============================
// REMOTE PLAYERS
// ==============================

const remotePlayers =
  new Map<
    string,
    RemotePlayer
  >();

let multiplayerSendTimer =
  0;

// ==============================
// GAME STATE
// ==============================

let gameStarted =
  false;

let multiplayerGame =
  false;

let playerTrapped =
  false;

let playerDead =
  false;

// ==============================
// LOCAL TRAP BUBBLE
// ==============================

let localTrapBubble:
  THREE.Mesh | null =
  null;

let localTrapStartY =
  0;

let localTrapStartedAt:
  number | null =
  null;

let localTrapEndAt:
  number | null =
  null;

// ==============================
// CLEAN TRAP BUBBLE
// ==============================

function clearLocalTrapBubble() {

  if (
    !localTrapBubble
  ) {
    return;
  }

  localTrapBubble.removeFromParent();

  localTrapBubble.geometry.dispose();

  const material =
    localTrapBubble.material;

  if (
    Array.isArray(material)
  ) {

    material.forEach(
      (item) => {
        item.dispose();
      }
    );

  } else {

    material.dispose();
  }

  localTrapBubble =
    null;

  localTrapStartedAt =
    null;

  localTrapEndAt =
    null;
}

// ==============================
// CREATE LOCAL TRAP BUBBLE
// ==============================

function createLocalTrapBubble(
  networkPlayer: NetworkPlayer
) {

  clearLocalTrapBubble();

  const geometry =
    new THREE.SphereGeometry(
      1.8,
      24,
      16
    );

  const material =
    new THREE.MeshPhysicalMaterial({
      transparent: true,
      opacity: 0.22,
      roughness: 0,
      metalness: 0,
      transmission: 0.85,
      thickness: 0.2,
    });

  localTrapBubble =
    new THREE.Mesh(
      geometry,
      material
    );

  localTrapStartY =
    networkPlayer.y;

  localTrapStartedAt =
    networkPlayer.trappedAt;

  localTrapEndAt =
    networkPlayer.trapEndAt;

  localTrapBubble.position.set(
    networkPlayer.x,
    networkPlayer.y,
    networkPlayer.z
  );

  scene.add(
    localTrapBubble
  );
}

// ==============================
// CLEAR REMOTE PLAYERS
// ==============================

function clearRemotePlayers() {

  for (
    const remote of
    remotePlayers.values()
  ) {

    remote.destroy();
  }

  remotePlayers.clear();

  player.setCombatTargets(
    multiplayerGame
      ? []
      : aiTadpoles.map(
          (ai) =>
            ai.getCombatTarget()
        )
  );
}

// ==============================
// UPDATE COMBAT TARGETS
// ==============================

function updateCombatTargets() {

  if (
    multiplayerGame
  ) {

    player.setCombatTargets(
      Array.from(
        remotePlayers.values()
      )
    );

    return;
  }

  player.setCombatTargets(
    aiTadpoles.map(
      (ai) =>
        ai.getCombatTarget()
    )
  );
}

// ==============================
// MAIN MENU
// ==============================

const mainMenu =
  new MainMenu(

    player.model,

    // VS AI
    () => {

      multiplayerGame =
        false;

      gameStarted =
        true;

      playerDead =
        false;

      playerTrapped =
        false;

      clearLocalTrapBubble();

      clearRemotePlayers();

      player.model.visible =
        false;

      updateCombatTargets();
    },

    // CREATE ROOM
    () => {

      multiplayerGame =
        true;

      gameStarted =
        false;

      playerDead =
        false;

      playerTrapped =
        false;

      clearLocalTrapBubble();

      multiplayer.createRoom();
    },

    // JOIN ROOM
    (roomCode) => {

      multiplayerGame =
        true;

      gameStarted =
        false;

      playerDead =
        false;

      playerTrapped =
        false;

      clearLocalTrapBubble();

      multiplayer.joinRoom(
        roomCode
      );
    },

    // LEAVE ROOM
    () => {

      multiplayerGame =
        false;

      gameStarted =
        false;

      playerDead =
        false;

      playerTrapped =
        false;

      clearLocalTrapBubble();

      player.model.visible =
        false;

      clearRemotePlayers();

      multiplayer.leaveRoom();
    },

    // START GAME
    () => {

      multiplayer.startGame();
    }
  );

// ==============================
// MULTIPLAYER STATE
// ==============================

multiplayer.setStateListener(
  (state) => {

    console.log(
      'Multiplayer game state:',
      state
    );

    const roomCode =
      multiplayer.getRoomCode();

    const playerId =
      multiplayer.getPlayerId();

    // ==========================
    // REMOTE PLAYERS
    // ==========================

    if (
      multiplayerGame
    ) {

      const currentRemoteIds =
        new Set<string>();

      for (
        const networkPlayer of
        state.players
      ) {

        if (
          networkPlayer.id ===
          playerId
        ) {
          continue;
        }

        currentRemoteIds.add(
          networkPlayer.id
        );

        let remote =
          remotePlayers.get(
            networkPlayer.id
          );

        if (
          !remote
        ) {

          remote =
            new RemotePlayer(
              scene,
              networkPlayer,
              multiplayer
            );

          remotePlayers.set(
            networkPlayer.id,
            remote
          );

        } else {

          remote.updateFromNetwork(
            networkPlayer
          );
        }
      }

      for (
        const [
          id,
          remote
        ] of remotePlayers
      ) {

        if (
          !currentRemoteIds.has(
            id
          )
        ) {

          remote.destroy();

          remotePlayers.delete(
            id
          );
        }
      }

      updateCombatTargets();
    }

    // ==========================
    // LOCAL PLAYER STATE
    // ==========================

    const localNetworkPlayer =
      state.players.find(
        (networkPlayer) =>
          networkPlayer.id ===
          playerId
      );

    if (
      localNetworkPlayer
    ) {

      // --------------------------
      // SERVER TRAPPED US
      // --------------------------

      if (
        localNetworkPlayer.trapped &&
        !playerTrapped &&
        !playerDead
      ) {

        playerTrapped =
          true;

        createLocalTrapBubble(
          localNetworkPlayer
        );

        player.setTrapped(
          true,
          localTrapBubble
        );

        hud.setAlive(
          true
        );

        hud.setTrapped(
          true,
          localTrapBubble
        );

        hud.setCrosshairVisible(
          false
        );
      }

      // --------------------------
      // SERVER RELEASED US
      // --------------------------

      if (
        !localNetworkPlayer.trapped &&
        playerTrapped &&
        !localNetworkPlayer.isDrowned
      ) {

        playerTrapped =
          false;

        clearLocalTrapBubble();

        player.setTrapped(
          false
        );

        hud.setTrapped(
          false,
          null
        );

        hud.setCrosshairVisible(
          true
        );
      }

      // --------------------------
      // SERVER SAYS WE DROWNED
      // --------------------------

      if (
        localNetworkPlayer.isDrowned &&
        !playerDead
      ) {

        playerDead =
          true;

        playerTrapped =
          false;

        clearLocalTrapBubble();

        player.setTrapped(
          false
        );

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
      }
    }

    // ==========================
    // LOBBY
    // ==========================

    if (
      state.phase === 'lobby' &&
      roomCode
    ) {

      gameStarted =
        false;

      playerDead =
        false;

      playerTrapped =
        false;

      clearLocalTrapBubble();

      player.setTrapped(
        false
      );

      player.model.visible =
        false;

      deathScreen.hide();

      const isHost =
        playerId ===
        state.hostId;

      mainMenu.showLobby(
        roomCode,
        state.players.length,
        state.maxPlayers,
        isHost
      );

      return;
    }

    // ==========================
    // PLAYING
    // ==========================

    if (
      state.phase === 'playing'
    ) {

      gameStarted =
        true;

      multiplayerGame =
        true;

      // IMPORTANT:
      // Do NOT reset playerDead or
      // playerTrapped here.
      // The server owns those states.

      deathScreen.hide();

      mainMenu.hide();

      hud.setPlayersAlive(
        state.players.filter(
          (networkPlayer) =>
            networkPlayer.alive
        ).length
      );

      return;
    }

    // ==========================
    // ROUND OVER
    // ==========================

    if (
      state.phase === 'ended'
    ) {

      gameStarted =
        true;

      multiplayerGame =
        true;

      hud.setPlayersAlive(
        state.players.filter(
          (networkPlayer) =>
            networkPlayer.alive
        ).length
      );

      const isHost =
        playerId ===
        state.hostId;

      deathScreen.show(
        'round-over',
        isHost
      );
    }
  }
);

// ==============================
// SEND LOCAL PLAYER
// ==============================

function sendMultiplayerPlayerState() {

  if (
    !multiplayerGame ||
    !gameStarted
  ) {
    return;
  }

  const playerId =
    multiplayer.getPlayerId();

  if (
    !playerId
  ) {
    return;
  }

  const position =
    player.camera.position;

  const networkPlayer:
    NetworkPlayer = {

    id:
      playerId,

    x:
      position.x,

    y:
      position.y,

    z:
      position.z,

    yaw:
      player.camera.rotation.y,

    pitch:
      player.camera.rotation.x,

    vx:
      0,

    vy:
      0,

    vz:
      0,

    alive:
      !playerDead,

    trapped:
      playerTrapped,

    isDrowned:
      playerDead,

    trappedAt:
      localTrapStartedAt,

    trapEndAt:
      localTrapEndAt,
  };

  multiplayer.sendPlayerState(
    networkPlayer
  );
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
// MOBILE ATTACK BUTTON
// ==============================

const mobileAttack =
  document.getElementById(
    'mobile-attack'
  );

mobileAttack?.addEventListener(
  'pointerdown',
  (event) => {

    event.preventDefault();

    event.stopPropagation();

    if (
      !gameStarted ||
      playerDead ||
      playerTrapped
    ) {
      return;
    }

    if (
      player.getAttackCooldown() > 0
    ) {
      return;
    }

    player.startAttack();
  }
);

// ==============================
// DEATH SCREEN
// ==============================

const deathScreen =
  createDeathScreen(

    // SPECTATE
    () => {

      playerDead =
        true;

      playerTrapped =
        false;

      clearLocalTrapBubble();

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

    // RETURN TO LOBBY
    () => {

      if (
        multiplayerGame
      ) {

        playerDead =
          false;

        playerTrapped =
          false;

        gameStarted =
          false;

        clearLocalTrapBubble();

        player.setTrapped(
          false
        );

        player.model.visible =
          false;

        clearRemotePlayers();

        deathScreen.hide();

        multiplayer.leaveRoom();

        return;
      }

      playerDead =
        false;

      playerTrapped =
        false;

      gameStarted =
        false;

      clearLocalTrapBubble();

      player.setTrapped(
        false
      );

      player.model.visible =
        false;

      deathScreen.hide();

      window.location.href =
        window.location.pathname;
    },

    // PLAY AGAIN
    () => {

      if (
        !multiplayerGame
      ) {
        return;
      }

      multiplayer.playAgain();
    }
  );

// ==============================
// EXIT / PAUSE MENU
// ==============================

let exitMenuOpen =
  false;

const exitMenu =
  document.createElement(
    'div'
  );

exitMenu.id =
  'exit-menu';

exitMenu.innerHTML = `
  <div id="exit-menu-panel">

    <div id="exit-menu-title">
      PAUSED
    </div>

    <div id="exit-menu-subtitle">
      LEAVE THE HUNT?
    </div>

    <div id="exit-menu-buttons">

      <button id="resume-button">
        RESUME
      </button>

      <button id="exit-to-menu-button">
        EXIT TO MAIN MENU
      </button>

    </div>

  </div>
`;

document.body.appendChild(
  exitMenu
);

const resumeButton =
  document.getElementById(
    'resume-button'
  );

const exitToMenuButton =
  document.getElementById(
    'exit-to-menu-button'
  );

function closeExitMenu() {

  exitMenuOpen =
    false;

  exitMenu.classList.remove(
    'visible'
  );

  if (
    typeof document.exitPointerLock ===
    'function'
  ) {

    document.exitPointerLock();
  }
}

function openExitMenu() {

  if (
    !gameStarted ||
    playerDead ||
    exitMenuOpen
  ) {
    return;
  }

  exitMenuOpen =
    true;

  exitMenu.classList.add(
    'visible'
  );

  if (
    typeof document.exitPointerLock ===
    'function'
  ) {

    document.exitPointerLock();
  }
}

function exitToMainMenu() {

  closeExitMenu();

  playerDead =
    false;

  playerTrapped =
    false;

  gameStarted =
    false;

  multiplayerGame =
    false;

  clearLocalTrapBubble();

  player.setTrapped(
    false
  );

  player.model.visible =
    false;

  deathScreen.hide();

  clearRemotePlayers();

  multiplayer.leaveRoom();

  mainMenu.show();
}

resumeButton?.addEventListener(
  'click',
  () => {

    closeExitMenu();
  }
);

exitToMenuButton?.addEventListener(
  'click',
  () => {

    exitToMainMenu();
  }
);

window.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key !==
      'Escape'
    ) {
      return;
    }

    event.preventDefault();

    if (
      exitMenuOpen
    ) {

      closeExitMenu();

    } else {

      openExitMenu();
    }
  }
);

// ==============================
// PC ATTACK
// ==============================

window.addEventListener(
  'mousedown',
  (event) => {

    if (
      event.button !== 0
    ) {
      return;
    }

    if (
      !gameStarted ||
      playerDead ||
      playerTrapped
    ) {
      return;
    }

    if (
      player.getAttackCooldown() > 0
    ) {
      return;
    }

    player.startAttack();
  }
);

// ==============================
// MOBILE EXIT BUTTON
// ==============================

const mobileExit =
  document.createElement(
    'button'
  );

mobileExit.id =
  'mobile-exit';

mobileExit.textContent =
  'EXIT';

document.body.appendChild(
  mobileExit
);

mobileExit.addEventListener(
  'click',
  () => {

    if (
      exitMenuOpen
    ) {

      closeExitMenu();

    } else {

      openExitMenu();
    }
  }
);

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

  multiplayerGame =
    false;

  gameStarted =
    true;

  playerDead =
    false;

  playerTrapped =
    false;

  player.model.visible =
    false;
}

// ==============================
// WORLD
// ==============================

const flashlightSystem =
  createFlashlight(
    scene
  );

const ocean =
  createOcean(
    scene
  );

const rockColliders =
  createRocks(
    scene
  );

createOceanVegetation(
  scene
);

// ==============================
// AI
// ==============================

const aiSpawnPositions = [

  new THREE.Vector3(
    15,
    -5,
    -15
  ),

  new THREE.Vector3(
    -18,
    -8,
    -12
  ),

  new THREE.Vector3(
    20,
    -10,
    18
  ),

  new THREE.Vector3(
    -20,
    -3,
    20
  ),

  new THREE.Vector3(
    5,
    -12,
    -25
  ),
];

const aiTadpoles:
  AITadpole[] = [];

// ==============================
// CREATE AI
// ==============================

for (
  let i = 0;
  i <
  aiSpawnPositions.length;
  i++
) {

  const ai =
    new AITadpole(
      scene,
      camera,
      rockColliders,

      // PLAYER TRAPPED
      (bubble) => {

        if (
          multiplayerGame ||
          playerTrapped ||
          playerDead
        ) {
          return;
        }

        playerTrapped =
          true;

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

      // PLAYER DIED
      () => {

        if (
          playerDead
        ) {
          return;
        }

        playerDead =
          true;

        playerTrapped =
          false;

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
      }
    );

  ai.model.position.copy(
    aiSpawnPositions[i]
  );

  aiTadpoles.push(
    ai
  );
}

// ==============================
// TARGETS
// ==============================

updateCombatTargets();

// ==============================
// CLOCK
// ==============================

const clock =
  new THREE.Clock();

// ==============================
// ANIMATION
// ==============================

function animate() {

  requestAnimationFrame(
    animate
  );

  const delta =
    Math.min(
      clock.getDelta(),
      0.05
    );

  // ============================
  // MAIN MENU
  // ============================

  if (
    !gameStarted
  ) {

    mainMenu.update(
      performance.now()
    );

    renderer.render(
      scene,
      camera
    );

    return;
  }

  // ============================
  // REMOTE PLAYERS
  // ============================

  for (
    const remote of
    remotePlayers.values()
  ) {

    remote.update(
      delta
    );
  }

  // ============================
  // LOCAL TRAP BUBBLE
  // ============================

  if (
    multiplayerGame &&
    playerTrapped &&
    localTrapBubble &&
    localTrapStartedAt !== null &&
    localTrapEndAt !== null
  ) {

    const progress =
      THREE.MathUtils.clamp(
        (
          Date.now() -
          localTrapStartedAt
        ) /
        Math.max(
          1,
          localTrapEndAt -
          localTrapStartedAt
        ),
        0,
        1
      );

    localTrapBubble.position.x =
      player.position.x;

    localTrapBubble.position.z =
      player.position.z;

    localTrapBubble.position.y =
      THREE.MathUtils.lerp(
        localTrapStartY,
        30,
        progress
      );
  }

  // ============================
  // AI
  // ============================

  if (
    !multiplayerGame
  ) {

    for (
      const ai of
      aiTadpoles
    ) {

      ai.update(
        delta,
        scene
      );
    }
  }

  // ============================
  // PLAYER
  // ============================

  player.update(
    delta
  );

  player.updateCombat(
    delta,
    scene
  );

  // ============================
  // SEND MULTIPLAYER STATE
  // ============================

  if (
    multiplayerGame
  ) {

    multiplayerSendTimer +=
      delta;

    if (
      multiplayerSendTimer >=
      0.05
    ) {

      multiplayerSendTimer =
        0;

      sendMultiplayerPlayerState();
    }
  }

  // ============================
  // COLLISIONS
  // ============================

  updateRockCollisions(
    player.camera,
    rockColliders
  );

  updateBoundaries(
    player.camera
  );

  // ============================
  // PLAYERS ALIVE
  // ============================

  if (
    multiplayerGame
  ) {

    const state =
      multiplayer.getGameState();

    if (
      state
    ) {

      hud.setPlayersAlive(
        state.players.filter(
          (networkPlayer) =>
            networkPlayer.alive
        ).length
      );
    }

  } else {

    const aliveAITadpoles =
      aiTadpoles.filter(
        (ai) =>
          ai.isAlive()
      ).length;

    hud.setPlayersAlive(
      aliveAITadpoles +
      (
        playerDead
          ? 0
          : 1
      )
    );
  }

  // ============================
  // DEPTH
  // ============================

  hud.updateDepth(
    player.camera
  );

  // ============================
  // TRAPPED
  // ============================

  let activeBubble:
    THREE.Mesh | null =
    null;

  if (
    playerTrapped &&
    !playerDead
  ) {

    if (
      multiplayerGame
    ) {

      activeBubble =
        localTrapBubble;

    } else {

      for (
        const ai of
        aiTadpoles
      ) {

        if (
          ai.bubble
        ) {

          activeBubble =
            ai.bubble;

          break;
        }
      }
    }
  }

  hud.updateTrapped(
    activeBubble
  );

  // ============================
  // ATTACK HUD
  // ============================

  const attackCooldown =
    player.getAttackCooldown();

  const attackUsable =
    !playerTrapped &&
    !playerDead;

  hud.updateAttack(
    attackCooldown,
    attackUsable
  );

  // ============================
  // BOOST HUD
  // ============================

  const boostCooldown =
    getBoostCooldown();

  const boostUsable =
    !playerTrapped &&
    !playerDead;

  hud.updateBoost(
    boostCooldown,
    boostUsable
  );

  // ============================
  // MOBILE BOOST
  // ============================

  const mobileBoost =
    document.getElementById(
      'mobile-boost'
    );

  if (
    mobileBoost
  ) {

    if (
      !boostUsable
    ) {

      mobileBoost.textContent =
        '( / )';

      mobileBoost.classList.add(
        'locked'
      );

    } else {

      mobileBoost.classList.remove(
        'locked'
      );

      if (
        boostCooldown <= 0
      ) {

        mobileBoost.textContent =
          'BOOST';

      } else {

        mobileBoost.textContent =
          `BOOST ${boostCooldown.toFixed(1)}`;
      }
    }
  }

  // ============================
  // MOBILE ATTACK
  // ============================

  if (
    mobileAttack
  ) {

    if (
      !attackUsable
    ) {

      mobileAttack.textContent =
        '( / )';

      mobileAttack.classList.add(
        'locked'
      );

    } else {

      mobileAttack.classList.remove(
        'locked'
      );

      if (
        attackCooldown <= 0
      ) {

        mobileAttack.textContent =
          'BURST';

      } else {

        mobileAttack.textContent =
          `BURST ${attackCooldown.toFixed(1)}`;
      }
    }
  }

  // ============================
  // WATER / SKY
  // ============================

  const aboveWater =
    player.camera.position.y >
    30;

  ocean.sky.updateMoonVisibility(
    player.camera.position.y
  );

  if (
    aboveWater
  ) {

    scene.background =
      aboveWaterColor;

    scene.fog =
      null;

  } else {

    scene.background =
      underwaterColor;

    scene.fog =
      new THREE.FogExp2(
        underwaterColor,
        0.035
      );
  }

  // ============================
  // WATER SHADER
  // ============================

  const waterMaterial =
    ocean.surface.material as
      THREE.ShaderMaterial;

  waterMaterial.uniforms
    .uTime
    .value +=
    delta;

  waterMaterial.uniforms
    .uCameraPosition
    .value.copy(
      player.camera.position
    );

  waterMaterial.uniforms
    .uUnderwater
    .value =
    aboveWater
      ? 0
      : 1;

  // ============================
  // FLASHLIGHT
  // ============================

  if (
    !playerDead
  ) {

    updateFlashlight(
      player.camera,
      flashlightSystem.flashlight,
      flashlightSystem.target
    );
  }

  // ============================
  // PARTICLES
  // ============================

  ocean.particles.rotation.y +=
    delta * 0.03;

  updateSeaweed(
    performance.now()
  );

  // ============================
  // RENDER
  // ============================

  renderer.render(
    scene,
    player.camera
  );
}

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

animate();