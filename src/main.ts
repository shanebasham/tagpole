import * as THREE from 'three';
import './style.css';
import './debug/errorCatcher';
import { MultiplayerClient } from './multiplayer/multiplayerClient';
import { Player } from './player/player';

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
  window.location.protocol === 'https:'
    ? 'wss:'
    : 'ws:';

multiplayer.connect(
  `${multiplayerProtocol}//${window.location.host}`
);

// ==============================
// GAME STATE
// ==============================

let gameStarted =
  false;

let playerTrapped =
  false;

let playerDead =
  false;

// ==============================
// MAIN MENU
// ==============================

const mainMenu =
  new MainMenu(
    player.model,

    // --------------------------
    // VS AI
    // --------------------------

    () => {

      gameStarted =
        true;

      playerDead =
        false;

      playerTrapped =
        false;

      player.model.visible =
        false;
    },

    // --------------------------
    // PLAY WITH FRIENDS
    // --------------------------

    () => {

      multiplayer.createRoom();

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

    if (
      state.phase === 'lobby' &&
      roomCode
    ) {

      mainMenu.showLobby(
        roomCode,
        state.players.length,
        state.maxPlayers
      );

    }
  }
);

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
// DEATH SCREEN
// ==============================

const deathScreen =
  createDeathScreen(

    // --------------------------
    // START AGAIN
    // --------------------------

    () => {

      window.location.href =
        window.location.pathname +
        '?start=ai';

    },

    // --------------------------
    // MAIN MENU
    // --------------------------

    () => {

      window.location.href =
        window.location.pathname;

    }
  );

// ==============================
// AUTO START
// ==============================

// If START AGAIN was clicked,
// automatically start a new VS AI game.

const shouldStartAI =
  new URLSearchParams(
    window.location.search
  ).get('start') === 'ai';

if (shouldStartAI) {

  gameStarted =
    true;

  playerDead =
    false;

  playerTrapped =
    false;

  player.model.visible =
    false;

  window.history.replaceState(
    {},
    '',
    window.location.pathname
  );
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

      // ==========================
      // PLAYER TRAPPED
      // ==========================

      (bubble) => {

        if (
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

      // ==========================
      // PLAYER DIED
      // ==========================

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

  if (!gameStarted) {

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
  // AI
  // ============================

  for (
    const ai of aiTadpoles
  ) {

    ai.update(
      delta,
      scene
    );

  }

  // ============================
  // PLAYER
  // ============================

  player.update(
    delta
  );

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

  for (
    const ai of aiTadpoles
  ) {

    if (ai.bubble) {

      activeBubble =
        ai.bubble;

      break;
    }
  }

  hud.updateTrapped(
    activeBubble
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

  const mobileBoost =
    document.getElementById(
      'mobile-boost'
    );

  if (mobileBoost) {

    if (!boostUsable) {

      mobileBoost.textContent =
        'BOOST';

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
  // WATER / SKY
  // ============================

  const aboveWater =
    player.camera.position.y >
    30;

  ocean.sky.updateMoonVisibility(
    player.camera.position.y
  );

  if (aboveWater) {

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

  if (!playerDead) {

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