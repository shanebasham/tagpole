import * as THREE from 'three';

import type {
  RockCollider
} from '../../world/rocks';

import type {
  CombatTarget
} from '../combat/bubbles';

import {
  AITadpole
} from './aiTadpole';

import {
  getRandomSpawnPositions
} from '../../game/spawnPositions';

// ==============================
// CALLBACKS
// ==============================

export interface AIManagerCallbacks {

  onPlayerTrapped: (
    bubble: THREE.Mesh
  ) => void;

  onPlayerDied: () => void;

  isPlayerTrapped: () => boolean;
}

// ==============================
// AI MANAGER
// ==============================

export class AIManager {

  private scene:
    THREE.Scene;

  private camera:
    THREE.PerspectiveCamera;

  private rocks:
    RockCollider[];

  private callbacks:
    AIManagerCallbacks;

  private tadpoles:
    AITadpole[] = [];

  // ==============================
  // CONSTRUCTOR
  // ==============================

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    rocks: RockCollider[],
    callbacks: AIManagerCallbacks
  ) {

    this.scene =
      scene;

    this.camera =
      camera;

    this.rocks =
      rocks;

    this.callbacks =
      callbacks;
  }

  // ==============================
  // CREATE
  // ==============================

    create(
    count: number = 11,
    spawnPositions?: THREE.Vector3[]
    ): void {

    this.clear();

    const aiCount =
      THREE.MathUtils.clamp(
        Math.floor(count),
        1,
        11
      );

    // We need one spawn for the human
    // and one spawn for every AI.
    const positions =
      spawnPositions ??
        getRandomSpawnPositions(
            aiCount + 1
        );

    // Position 0 belongs to the human.
    // AI starts at position 1.
    for (
      let i = 1;
        i < positions.length;
        i++
        ) {

      const position =
            positions[i];

      const ai =
        new AITadpole(
          this.scene,
          this.camera,
          this.rocks,

          (
            bubble: THREE.Mesh
          ) => {

            this.callbacks
              .onPlayerTrapped(
                bubble
              );
          },

          () => {

            this.callbacks
              .onPlayerDied();
          },

          () => {

            return this.callbacks
              .isPlayerTrapped();
          }
        );

      ai.model.position.copy(
        position
      );

      this.tadpoles.push(
        ai
      );
    }
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    delta: number
  ): void {

    for (
      const ai of
        this.tadpoles
    ) {

      if (
        !ai.isAlive()
      ) {
        continue;
      }

      ai.update(
        delta,
        this.scene
      );
    }
  }

  // ==============================
  // GET ALL
  // ==============================

  getAll():
    AITadpole[] {

    return this.tadpoles;
  }

  // ==============================
  // GET ALIVE
  // ==============================

  getAlive():
    AITadpole[] {

    return this.tadpoles.filter(
      (
        ai
      ) => ai.isAlive()
    );
  }

  // ==============================
  // GET ALIVE COUNT
  // ==============================

  getAliveCount():
    number {

    return this.getAlive()
      .length;
  }

  // ==============================
  // GET COMBAT TARGETS
  // ==============================

  getCombatTargets():
    CombatTarget[] {

    return this.tadpoles.map(
      (
        ai
      ) => ai.getCombatTarget()
    );
  }

  // ==============================
  // RESET
  // ==============================

  reset(): void {

    for (
      const ai of
        this.tadpoles
    ) {

      ai.reset(
        this.scene
      );
    }
  }

  // ==============================
  // CLEAR
  // ==============================

  clear(): void {

    for (
      const ai of
        this.tadpoles
    ) {

      ai.reset(
        this.scene
      );

      ai.model.removeFromParent();
    }

    this.tadpoles.length =
      0;
  }

  // ==============================
  // DESTROY
  // ==============================

  destroy(): void {

    this.clear();
  }
}