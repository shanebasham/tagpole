import * as THREE from 'three';

import type {
  RockCollider
} from '../../world/rocks';

import {
  AITadpole
} from './aiTadpole';

export interface AIManagerCallbacks {
  onPlayerTrapped: (
    bubble: THREE.Mesh
  ) => void;

  onPlayerDied: () => void;
}

export class AIManager {

  private scene: THREE.Scene;

  private camera: THREE.PerspectiveCamera;

  private rocks: RockCollider[];

  private callbacks: AIManagerCallbacks;

  private tadpoles: AITadpole[] = [];

  private spawnPositions: THREE.Vector3[] = [
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

  create(): void {

    this.clear();

    for (
      const position of this.spawnPositions
    ) {

      const ai =
        new AITadpole(
          this.scene,
          this.camera,
          this.rocks,

          (bubble) => {
            this.callbacks.onPlayerTrapped(
              bubble
            );
          },

          () => {
            this.callbacks.onPlayerDied();
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

  update(
    delta: number
  ): void {

    for (
      const ai of this.tadpoles
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

  getAll(): AITadpole[] {

    return this.tadpoles;
  }

  getAlive(): AITadpole[] {

    return this.tadpoles.filter(
      (ai) =>
        ai.isAlive()
    );
  }

  getAliveCount(): number {

    return this.getAlive().length;
  }

  getCombatTargets() {

    return this.tadpoles.map(
      (ai) =>
        ai.getCombatTarget()
    );
  }

  reset(): void {

    for (
      const ai of this.tadpoles
    ) {

      ai.reset(
        this.scene
      );
    }
  }

  clear(): void {
    for (const ai of this.tadpoles) {
        ai.reset(this.scene);
        ai.model.removeFromParent();
    }

    this.tadpoles.length = 0;
    }

  destroy(): void {

    this.clear();
  }
}