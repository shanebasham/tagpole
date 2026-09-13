import * as THREE from 'three';

import type { NetworkPlayer } from '../game/gameState';

import { createPlayerModel } from '../player/playerModel';

import type { CombatTarget } from '../player/combat/bubbles';

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

  private trappedAt:
    number | null =
    null;

  private trapEndAt:
    number | null =
    null;

  private trapStartPosition =
    new THREE.Vector3();

  /*
   * True when THIS client fired
   * the bubble that trapped this player.
   *
   * When true, Bubbles.ts owns the
   * actual trapping bubble.
   */
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

    /*
     * Tell the server.
     *
     * The Bubbles instance that called
     * this method remains responsible for
     * the actual trapping bubble.
     */
    this.multiplayer.sendTrapPlayer(
      this.id
    );

    this.trapped =
      true;

    this.localTrapPending =
      true;

    return true;
  }

  updateTrappedPosition(
    position: THREE.Vector3
  ): void {

    /*
     * Only the client that fired the
     * trapping bubble updates this remote
     * player's position from Bubbles.ts.
     */
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

  onBubbleReachedSurface(): void {

    /*
     * Do not release the player here.
     *
     * The server decides when the player
     * actually drowns.
     */
  }

  // ==============================
  // NETWORK STATE
  // ==============================

  updateFromNetwork(
    player: NetworkPlayer
  ): void {

    const wasTrapped =
      this.trapped;

    /*
     * NORMAL MOVEMENT
     *
     * Do not overwrite the local
     * trapping bubble's position.
     */
    if (
      !this.trapped
    ) {

      this.targetPosition.set(
        player.x,
        player.y,
        player.z
      );
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

      /*
       * Save the position exactly once.
       */
      this.trapStartPosition.set(
        player.x,
        player.y,
        player.z
      );

      /*
       * IMPORTANT:
       *
       * If THIS client fired the trap,
       * Bubbles.ts already created and owns
       * the trapping bubble.
       *
       * Otherwise this client needs its
       * own synchronized visual bubble.
       */
      if (
        !this.localTrapPending
      ) {

        this.createRemoteTrapBubble();
      }

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

      /*
       * Keep server timing synchronized.
       *
       * Never reset trapStartPosition.
       */
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

      this.trappedAt =
        null;

      this.trapEndAt =
        null;

      this.model.visible =
        false;
    }
  }

  // ==============================
  // REMOTE VISUAL BUBBLE
  // ==============================

  private createRemoteTrapBubble(): void {

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
  ): void {

    /*
     * ATTACKER CLIENT
     *
     * Bubbles.ts owns the bubble and
     * directly moves this RemotePlayer.
     */
    if (
      this.trapped &&
      this.localTrapPending
    ) {
      return;
    }

    // ==========================
    // REMOTE OBSERVER
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

      /*
       * Keep X/Z fixed at the server's
       * original trap position.
       */
      this.trapBubble.position.x =
        this.trapStartPosition.x;

      this.trapBubble.position.z =
        this.trapStartPosition.z;

      /*
       * Use the exact same server
       * timestamps as the victim.
       */
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

  destroy(): void {

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