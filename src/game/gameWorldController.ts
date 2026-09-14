import * as THREE from 'three';

import { gameState } from './gameState';
import type { Player } from '../player/player';
import { updateFlashlight } from '../player/flashlight';
import type { WorldManager } from '../world/worldManager';
import { updateRockCollisions } from '../world/collisions';

export interface GameWorldController {
  update(delta: number): void;
}

export interface GameWorldControllerDependencies {
  scene: THREE.Scene;
  player: Player;
  worldManager: WorldManager;
  flashlight: THREE.SpotLight;
  flashlightTarget: THREE.Object3D;
}

export function createGameWorldController(
  dependencies: GameWorldControllerDependencies
): GameWorldController {

  const {
    scene,
    player,
    worldManager,
    flashlight,
    flashlightTarget,
  } = dependencies;

  const underwaterColor =
    new THREE.Color(
      0x03131d
    );

  const aboveWaterColor =
    new THREE.Color(
      0x02050c
    );

  const updateWaterAndSky = (
    delta: number
  ): void => {

    const ocean =
      worldManager.getOcean();

    if (
      !ocean
    ) {
      return;
    }

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

    ocean.particles.rotation.y +=
      delta *
      0.03;
  };

  return {

    update(delta: number): void {

      /*
       * Update the player first.
       *
       * This handles:
       * - normal movement
       * - first-person camera
       * - trapped player positioning
       * - trapped camera
       * - death camera
       */
      player.update(
        delta
      );

      /*
       * Keep the player from moving through
       * rocks during normal gameplay.
       */
      updateRockCollisions(
        player.camera,
        worldManager.getRocks()
      );

      /*
       * Update underwater environment,
       * water shader, fog, particles, etc.
       */
      updateWaterAndSky(
        delta
      );

      /*
       * The actual environmental flashlight
       * continues following the camera.
       *
       * This is separate from the tadpole's
       * visual flashlight beams.
       */
      if (
        !gameState.playerDead
      ) {

        updateFlashlight(
          player.camera,
          flashlight,
          flashlightTarget
        );
      }

      worldManager.update(
        player.camera
      );
    },
  };
}