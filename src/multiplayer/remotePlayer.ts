import * as THREE from 'three';

import type {
  NetworkPlayer
} from './gameState';

import {
  createPlayerModel
} from '../player/playerModel';

import type {
  CombatTarget
} from '../player/combat/bubbles';

export class RemotePlayer
  implements CombatTarget {

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

  private multiplayer: {
    sendTrapPlayer(
      targetId: string
    ): void;
  };

  private trapped =
    false;

  private trapBubble:
    THREE.Mesh | null = null;

  private scene:
    THREE.Scene;

  private trappedAt:
    number | null = null;

  private trapEndAt:
    number | null = null;

  constructor(
    scene: THREE.Scene,
    player: NetworkPlayer,
    multiplayer: {
      sendTrapPlayer(
        targetId: string
      ): void;
    }
  ) {

    this.scene =
      scene;

    this.multiplayer =
      multiplayer;

    this.id =
      player.id;

    this.model =
      createPlayerModel();

    this.model.visible =
      player.alive;

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

    this.updateFromNetwork(
      player
    );
  }

  // ==============================
  // COMBAT TARGET
  // ==============================

  getPosition(): THREE.Vector3 {
    return this.model.position;
  }

  isAlive(): boolean {
    return this.model.visible;
  }

  isTrapped(): boolean {
    return this.trapped;
  }

  trap(
    bubble: THREE.Mesh
  ): boolean {

    if (
      this.trapped ||
      !this.model.visible
    ) {
      return false;
    }

    // Tell the server first.
    this.multiplayer.sendTrapPlayer(
      this.id
    );

    // Local visual response.
    this.setTrapped(
      true,
      bubble
    );

    return true;
  }

  updateTrappedPosition(
    position: THREE.Vector3
  ) {

    if (!this.trapped) {
      return;
    }

    this.model.position.copy(
      position
    );

    this.model.position.y -=
      0.15;
  }

  onBubbleReachedSurface() {
    this.setTrapped(
      false,
      null
    );

    this.model.visible =
      false;
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

    if (
      player.trapped &&
      !this.trapped
    ) {

      this.trappedAt =
        player.trappedAt;

      this.trapEndAt =
        player.trapEndAt;

      this.createRemoteTrapBubble();

      this.trapped =
        true;
    }

    if (
      !player.trapped &&
      this.trapped
    ) {

      this.setTrapped(
        false,
        null
      );
    }
  }

  // ==============================
  // TRAP BUBBLE
  // ==============================

  private createRemoteTrapBubble() {

    if (
      this.trapBubble
    ) {
      return;
    }

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

    this.trapBubble =
      new THREE.Mesh(
        geometry,
        material
      );

    this.trapBubble.position.copy(
      this.model.position
    );

    this.scene.add(
      this.trapBubble
    );
  }

  private removeTrapBubble() {

    if (
      !this.trapBubble
    ) {
      return;
    }

    this.trapBubble.removeFromParent();

    this.trapBubble.geometry.dispose();

    const material =
      this.trapBubble.material;

    if (
      Array.isArray(material)
    ) {

      material.forEach(
        (m) => m.dispose()
      );

    } else {

      material.dispose();
    }

    this.trapBubble =
      null;
  }

  setTrapped(
    trapped: boolean,
    bubble:
      THREE.Mesh | null = null
  ) {

    this.trapped =
      trapped;

    if (trapped) {

      if (bubble) {

        this.trapBubble =
          bubble;

      } else {

        this.createRemoteTrapBubble();
      }

      this.model.visible =
        true;

    } else {

      this.removeTrapBubble();

      this.trappedAt =
        null;

      this.trapEndAt =
        null;
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

    if (
      this.trapped &&
      this.trapBubble
    ) {

      const now =
        Date.now();

      let progress = 0;

      if (
        this.trappedAt !== null &&
        this.trapEndAt !== null &&
        this.trapEndAt >
          this.trappedAt
      ) {

        progress =
          THREE.MathUtils.clamp(
            (
              now -
              this.trappedAt
            ) /
            (
              this.trapEndAt -
              this.trappedAt
            ),
            0,
            1
          );
      }

      const startY =
        this.targetPosition.y;

      const endY =
        30;

      this.trapBubble.position.x =
        this.targetPosition.x;

      this.trapBubble.position.z =
        this.targetPosition.z;

      this.trapBubble.position.y =
        THREE.MathUtils.lerp(
          startY,
          endY,
          progress
        );

      this.model.position.copy(
        this.trapBubble.position
      );

      this.model.position.y -=
        0.15;

      return;
    }

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

    this.removeTrapBubble();

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