import * as THREE from 'three';

import type {
  NetworkPlayer
} from './gameState';

import {
  createPlayerModel
} from '../player/playerModel';

export class RemotePlayer {

  readonly id: string;

  readonly model: THREE.Group;

  private targetPosition =
    new THREE.Vector3();

  private targetRotation =
    new THREE.Euler(
      0,
      0,
      0,
      'YXZ'
    );

  constructor(
    scene: THREE.Scene,
    player: NetworkPlayer
  ) {
    this.id =
      player.id;

    this.model =
      createPlayerModel();

    this.model.visible =
      true;

    this.model.position.set(
      player.x,
      player.y,
      player.z
    );

    this.targetPosition.copy(
      this.model.position
    );

    this.model.rotation.set(
      0,
      player.yaw,
      0
    );

    this.targetRotation.set(
      0,
      player.yaw,
      0
    );

    scene.add(
      this.model
    );
  }

  // ==============================
  // APPLY NETWORK STATE
  // ==============================

  updateFromNetwork(
    player: NetworkPlayer
  ) {
    this.targetPosition.set(
      player.x,
      player.y,
      player.z
    );

    this.targetRotation.set(
      0,
      player.yaw,
      0
    );

    this.model.visible =
      player.alive;

    if (player.isDrowned) {
      this.model.scale.setScalar(
        1.15
      );
    } else {
      this.model.scale.setScalar(
        1
      );
    }
  }

  // ==============================
  // SMOOTH MOVEMENT
  // ==============================

  update(
    delta: number
  ) {
    const smoothing =
      1 -
      Math.pow(
        0.001,
        delta
      );

    this.model.position.lerp(
      this.targetPosition,
      smoothing
    );

    this.model.rotation.y =
      THREE.MathUtils.lerp(
        this.model.rotation.y,
        this.targetRotation.y,
        smoothing
      );
  }

  // ==============================
  // REMOVE
  // ==============================

  destroy() {
    this.model.removeFromParent();

    this.model.traverse(
      (object) => {
        const mesh =
          object as THREE.Mesh;

        if (
          mesh.geometry
        ) {
          mesh.geometry.dispose();
        }
      }
    );
  }
}