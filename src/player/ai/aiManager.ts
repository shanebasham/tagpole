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

  private spawnPositions:
    THREE.Vector3[] = [

      new THREE.Vector3(
        15,
        -5,
        -15
      ),

      new THREE.Vector3(
        -20,
        -8,
        -20
      ),

      new THREE.Vector3(
        20,
        -10,
        15
      ),

      new THREE.Vector3(
        -25,
        -12,
        20
      ),

      new THREE.Vector3(
        0,
        -18,
        30
      ),
    ];

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

  create(): void {

    this.clear();

    for (
      const position of
        this.spawnPositions
    ) {

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