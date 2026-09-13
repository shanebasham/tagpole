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
    THREE.Mesh | null =
    null;

  private scene:
    THREE.Scene;

  // Server-authoritative trap timing
  private trappedAt:
    number | null =
    null;

  private trapEndAt:
    number | null =
    null;

  // IMPORTANT:
  // This never changes while trapped.
  private trapStartPosition =
    new THREE.Vector3();

  // True when THIS client fired
  // the bubble that trapped this player.
  private localTrapPending =
    false;

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

    // Tell server.
    this.multiplayer.sendTrapPlayer(
      this.id
    );

    // Mark immediately so another
    // projectile cannot hit the same player.
    this.trapped =
      true;

    this.localTrapPending =
      true;

    return true;
  }

  updateTrappedPosition(
    position: THREE.Vector3
  ) {

    // While THIS client owns the bubble,
    // Bubbles.ts controls the remote model.
    if (
      !this.trapped ||
      !this.localTrapPending
    ) {

      return;
    }

    this.model.position.copy(
      position
    );

    this.model.position.y -=
      0.15;
  }

  onBubbleReachedSurface() {

    // Do NOT release the trap here.
    //
    // The server decides when the player
    // actually drowns. This prevents the
    // local bubble animation and network
    // state from fighting each other.

    this.localTrapPending =
      true;
  }

  // ==============================
  // NETWORK STATE
  // ==============================

  updateFromNetwork(
    player: NetworkPlayer
  ) {

    const wasTrapped =
      this.trapped;

    // IMPORTANT:
    //
    // While trapped, do NOT replace the
    // trap's starting position with the
    // player's continuously changing
    // network position.
    if (
      !this.trapped
    ) {

      this.targetPosition.set(
        player.x,
        player.y,
        player.z
      );

    } else if (
      !this.localTrapPending
    ) {

      // For remote observers, keep X/Z
      // synchronized while allowing the
      // vertical trap animation to control Y.
      this.targetPosition.x =
        player.x;

      this.targetPosition.z =
        player.z;
    }

    this.targetRotation.set(
      0,
      player.yaw,
      0
    );

    this.model.visible =
      player.alive;

    if (
      player.isDrowned
    ) {

      this.model.scale.setScalar(
        1.15
      );

    } else {

      this.model.scale.setScalar(
        1
      );
    }

    // ==========================
    // NEW TRAP
    // ==========================

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

      // THIS is the critical fix.
      //
      // Store the position ONCE.
      this.trapStartPosition.set(
        player.x,
        player.y,
        player.z
      );

      // If this was not the player who
      // fired the bubble, create our own
      // synchronized visual bubble.
      if (
        !this.localTrapPending
      ) {

        this.createRemoteTrapBubble();
      }

      // Make sure the model is visible
      // while trapped.
      this.model.visible =
        true;
    }

    // ==========================
    // ALREADY TRAPPED
    // ==========================

    if (
      player.trapped &&
      wasTrapped
    ) {

      // Server may provide timestamps
      // again, but the starting position
      // must NEVER be reset.

      this.trappedAt =
        player.trappedAt;

      this.trapEndAt =
        player.trapEndAt;
    }

    // ==========================
    // NO LONGER TRAPPED
    // ==========================

    if (
      !player.trapped &&
      wasTrapped
    ) {

      this.trapped =
        false;

      this.localTrapPending =
        false;

      this.removeTrapBubble();

      this.trappedAt =
        null;

      this.trapEndAt =
        null;

      if (
        player.isDrowned
      ) {

        this.model.visible =
          false;
      }
    }

    // ==========================
    // DROWNED
    // ==========================

    if (
      player.isDrowned
    ) {

      this.trapped =
        false;

      this.localTrapPending =
        false;

      this.removeTrapBubble();

      this.model.visible =
        false;
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
      this.trapStartPosition
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
        (item) => {
          item.dispose();
        }
      );

    } else {

      material.dispose();
    }

    this.trapBubble =
      null;
  }

  // ==============================
  // MOVEMENT
  // ==============================

  update(
    delta: number
  ) {

    // The shooter client's actual
    // Bubbles object controls this player.
    if (
      this.trapped &&
      this.localTrapPending
    ) {

      return;
    }

    // ==========================
    // SYNCHRONIZED TRAP
    // ==========================

    if (
      this.trapped &&
      this.trapBubble
    ) {

      const now =
        Date.now();

      let progress =
        0;

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

      // ALWAYS use the original
      // trap position.
      this.trapBubble.position.x =
        this.trapStartPosition.x;

      this.trapBubble.position.z =
        this.trapStartPosition.z;

      this.trapBubble.position.y =
        THREE.MathUtils.lerp(
          this.trapStartPosition.y,
          31,
          progress
        );

      this.model.position.copy(
        this.trapBubble.position
      );

      this.model.position.y -=
        0.15;

      return;
    }

    // ==========================
    // NORMAL MOVEMENT
    // ==========================

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

        const material =
          mesh.material;

        if (
          Array.isArray(material)
        ) {

          material.forEach(
            (item) => {
              item.dispose();
            }
          );

        } else if (
          material
        ) {

          material.dispose();
        }
      }
    );
  }
}