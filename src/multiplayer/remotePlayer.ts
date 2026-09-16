import * as THREE from 'three';

import type {
  NetworkPlayer
} from '../game/gameState';

import {
  PLAYER_COLORS
} from '../game/playerColor';

import {
  createPlayerModel,
  setPlayerModelColor,
  setPlayerFlashlightVisible
} from '../player/playerModel';

import type {
  CombatTarget
} from '../player/combat/bubbles';

export class RemotePlayer
  implements CombatTarget {

  readonly id:
    string;

  readonly model:
    THREE.Group;

  private readonly scene:
    THREE.Scene;

  private readonly multiplayer: {
    sendTrapPlayer(
      targetId: string
    ): void;
  };

  private targetPosition =
    new THREE.Vector3();

  private targetRotation =
    new THREE.Euler(
      0,
      0,
      0,
      'YXZ'
    );

  private trapped =
    false;

  private trappedAt:
    number | null =
    null;

  private trapEndAt:
    number | null =
    null;

  private trapStartPosition =
    new THREE.Vector3();

  private trapTargetPosition =
    new THREE.Vector3();

  private trapBubble:
    THREE.Mesh | null =
    null;

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

    this.applyNetworkColor(
      player.color
    );

    setPlayerFlashlightVisible(
      this.model,
      !player.trapped
    );

    this.model.position.set(
      player.x,
      player.y,
      player.z
    );

    this.model.rotation.set(
      player.pitch,
      player.yaw,
      0,
      'YXZ'
    );

    this.targetPosition.set(
      player.x,
      player.y,
      player.z
    );

    this.targetRotation.set(
      player.pitch,
      player.yaw,
      0
    );

    this.model.visible =
      player.alive;

    this.scene.add(
      this.model
    );

    this.updateFromNetwork(
      player
    );
  }

  // ========================================
  // COLOR
  // ========================================

  private applyNetworkColor(
    colorId: string
  ): void {

    const color =
      PLAYER_COLORS.find(
        item =>
          item.id === colorId
      );

    if (!color) {
      return;
    }

    setPlayerModelColor(
      this.model,
      color.hex
    );
  }

  // ========================================
  // COMBAT TARGET
  // ========================================

  getPosition():
    THREE.Vector3 {

    return this.model.position;
  }

  isAlive(): boolean {

    return (
      this.model.visible &&
      !this.trapped
    );
  }

  isTrapped(): boolean {

    return this.trapped;
  }

  trap(
    _bubble: THREE.Mesh
  ): boolean {

    if (
      this.trapped ||
      !this.model.visible
    ) {
      return false;
    }

    this.multiplayer.sendTrapPlayer(
      this.id
    );

    return true;
  }

  updateTrappedPosition(
    position: THREE.Vector3
  ): void {

    if (
      !this.trapped
    ) {
      return;
    }

    this.model.position.lerp(
      position,
      0.35
    );
  }

  onBubbleReachedSurface(): void {
    // Server controls drowning.
  }

  // ========================================
  // NETWORK STATE
  // ========================================

  updateFromNetwork(
    player: NetworkPlayer
  ): void {

    const wasTrapped =
      this.trapped;

    // Always update color.
    this.applyNetworkColor(
      player.color
    );

    // ======================================
    // NORMAL MOVEMENT
    // ======================================

    if (
      !player.trapped &&
      !player.isDrowned
    ) {

      this.targetPosition.set(
        player.x,
        player.y,
        player.z
      );
    }

    this.targetRotation.set(
      player.pitch,
      player.yaw,
      0
    );

    // ======================================
    // DROWNED
    // ======================================

    if (
      player.isDrowned
    ) {

      this.trapped =
        false;

      this.trappedAt =
        null;

      this.trapEndAt =
        null;

      setPlayerFlashlightVisible(
        this.model,
        false
      );

      this.removeTrapBubble();

      this.model.visible =
        false;

      return;
    }

    // ======================================
    // ALIVE / VISIBLE
    // ======================================

    this.model.visible =
      player.alive;

    // ======================================
    // NEW TRAP
    // ======================================

    if (
      player.trapped &&
      !wasTrapped
    ) {

      this.trapped =
        true;

      this.trappedAt =
        player.trappedAt;

      this.trapEndAt =
        player.trapEndAt;

      setPlayerFlashlightVisible(
        this.model,
        false
      );

      this.trapStartPosition.set(
        player.x,
        player.y,
        player.z
      );

      this.trapTargetPosition.set(
        player.x,
        31,
        player.z
      );

      this.targetPosition.copy(
        this.trapStartPosition
      );

      this.createRemoteTrapBubble();

      this.model.visible =
        true;

      return;
    }

    // ======================================
    // ALREADY TRAPPED
    // ======================================

    if (
      player.trapped
    ) {

      this.trapped =
        true;

      this.trappedAt =
        player.trappedAt;

      this.trapEndAt =
        player.trapEndAt;

      setPlayerFlashlightVisible(
        this.model,
        false
      );

      return;
    }

    // ======================================
    // RELEASED
    // ======================================

    if (
      !player.trapped &&
      wasTrapped
    ) {

      this.trapped =
        false;

      this.trappedAt =
        null;

      this.trapEndAt =
        null;

      setPlayerFlashlightVisible(
        this.model,
        true
      );

      this.removeTrapBubble();

      if (
        player.alive
      ) {

        this.targetPosition.set(
          player.x,
          player.y,
          player.z
        );

      } else {

        this.model.visible =
          false;
      }
    }
  }

  // ========================================
  // REMOTE TRAP BUBBLE
  // ========================================

  private createRemoteTrapBubble(): void {

    this.removeTrapBubble();

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
        thickness: 0.2
      });

    this.trapBubble =
      new THREE.Mesh(
        geometry,
        material
      );

    this.trapBubble.position.copy(
      this.trapStartPosition
    );

    this.scene.add(
      this.trapBubble
    );
  }

  private removeTrapBubble(): void {

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

      for (
        const item of material
      ) {

        item.dispose();
      }

    } else {

      material.dispose();
    }

    this.trapBubble =
      null;
  }

  // ========================================
  // TRAPPED MODEL OFFSET
  // ========================================

  private getTrappedModelOffset():
    THREE.Vector3 {

    const forward =
      new THREE.Vector3(
        -Math.sin(
          this.targetRotation.y
        ),
        0,
        -Math.cos(
          this.targetRotation.y
        )
      );

    return forward.multiplyScalar(
      0.5
    );
  }

  // ========================================
  // UPDATE
  // ========================================

  update(
    delta: number
  ): void {

    const smoothing =
      1 -
      Math.pow(
        0.001,
        Math.max(
          delta,
          0.001
        )
      );

    if (
      this.trapped
    ) {

      this.updateTrapAnimation();

      this.model.rotation.x =
        THREE.MathUtils.lerp(
          this.model.rotation.x,
          this.targetRotation.x,
          smoothing
        );

      this.model.rotation.y =
        THREE.MathUtils.lerp(
          this.model.rotation.y,
          this.targetRotation.y,
          smoothing
        );

      return;
    }

    this.model.position.lerp(
      this.targetPosition,
      smoothing
    );

    this.model.rotation.x =
      THREE.MathUtils.lerp(
        this.model.rotation.x,
        this.targetRotation.x,
        smoothing
      );

    this.model.rotation.y =
      THREE.MathUtils.lerp(
        this.model.rotation.y,
        this.targetRotation.y,
        smoothing
      );
  }

  // ========================================
  // TRAP ANIMATION
  // ========================================

  private updateTrapAnimation(): void {

    if (
      this.trappedAt === null ||
      this.trapEndAt === null
    ) {
      return;
    }

    const duration =
      this.trapEndAt -
      this.trappedAt;

    if (
      duration <= 0
    ) {
      return;
    }

    const now =
      Date.now();

    const progress =
      THREE.MathUtils.clamp(
        (
          now -
          this.trappedAt
        ) /
        duration,
        0,
        1
      );

    const y =
      THREE.MathUtils.lerp(
        this.trapStartPosition.y,
        this.trapTargetPosition.y,
        progress
      );

    if (
      this.trapBubble
    ) {

      this.trapBubble.position.set(
        this.trapStartPosition.x,
        y,
        this.trapStartPosition.z
      );
    }

    const offset =
      this.getTrappedModelOffset();

    this.model.position.set(
      this.trapStartPosition.x +
        offset.x,
      y - 0.15,
      this.trapStartPosition.z +
        offset.z
    );
  }

  // ========================================
  // DESTROY
  // ========================================

  destroy(): void {

    this.removeTrapBubble();

    this.model.removeFromParent();

    this.model.traverse(
      object => {

        const mesh =
          object as THREE.Mesh;

        if (
          mesh.geometry
        ) {

          mesh.geometry.dispose();
        }

        const material =
          mesh.material;

        if (
          Array.isArray(material)
        ) {

          for (
            const item of material
          ) {

            item.dispose();
          }

        } else if (
          material
        ) {

          material.dispose();
        }
      }
    );
  }
}