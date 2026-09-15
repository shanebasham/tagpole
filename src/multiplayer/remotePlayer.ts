import * as THREE from 'three';

import type {
  NetworkPlayer
} from '../game/gameState';

import {
  createPlayerModel,
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

    /*
     * Remote players normally have
     * their flashlight beams enabled.
     */

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

    /*
     * Do NOT permanently make the
     * remote player trapped here.
     *
     * The server must confirm it.
     */

    return true;
  }

  /*
   * Kept for compatibility with
   * existing Bubbles.ts code.
   *
   * The network/server state is now
   * authoritative, so this does not
   * override the server position.
   */

  updateTrappedPosition(
    position: THREE.Vector3
  ): void {

    if (
      !this.trapped
    ) {
      return;
    }

    /*
     * Only use this as a visual hint
     * until the next network state.
     */

    this.model.position.lerp(
      position,
      0.35
    );
  }

  onBubbleReachedSurface(): void {

    /*
     * Server controls drowning.
     */
  }

  // ========================================
  // NETWORK STATE
  // ========================================

  updateFromNetwork(
    player: NetworkPlayer
  ): void {

    const wasTrapped =
      this.trapped;

    /*
     * NORMAL MOVEMENT
     */

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

    /*
     * Rotation is always networked.
     *
     * Both pitch and yaw are used so
     * the entire tadpole follows the
     * player's look direction.
     */

    this.targetRotation.set(
      player.pitch,
      player.yaw,
      0
    );

    /*
     * DROWNED
     */

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

    /*
     * ALIVE / VISIBLE
     */

    this.model.visible =
      player.alive;

    /*
     * ======================================
     * NEW TRAP
     * ======================================
     */

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
       * Turn off the flashlight beams
       * while trapped.
       */

      setPlayerFlashlightVisible(
        this.model,
        false
      );

      /*
       * The server sends the exact position
       * where the trap started.
       */

      this.trapStartPosition.set(
        player.x,
        player.y,
        player.z
      );

      /*
       * Server's BUBBLE_POP_Y is:
       *
       * SURFACE_Y 30
       * + POP_HEIGHT 2.5
       * - CENTER_OFFSET 1.5
       * = 31
       */

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

    /*
     * ======================================
     * ALREADY TRAPPED
     * ======================================
     */

    if (
      player.trapped
    ) {

      this.trapped =
        true;

      this.trappedAt =
        player.trappedAt;

      this.trapEndAt =
        player.trapEndAt;

      /*
       * Make sure the flashlight stays
       * disabled even if another network
       * update arrives while trapped.
       */

      setPlayerFlashlightVisible(
        this.model,
        false
      );

      return;
    }

    /*
     * ======================================
     * RELEASED / DROWNED
     * ======================================
     */

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

      /*
       * Turn the flashlight beams back
       * on after the player is released.
       */

      setPlayerFlashlightVisible(
        this.model,
        true
      );

      this.removeTrapBubble();

      /*
       * If the player is alive again,
       * resume normal network movement.
       */

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
        const item
        of material
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

    /*
     * The tadpole faces -Z.
     *
     * Its tail is positioned toward +Z.
     *
     * Move the entire tadpole forward
     * so the tail sits farther inside
     * the trapping bubble.
     */

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

    /*
     * ======================================
     * TRAPPED
     * ======================================
     *
     * Calculate the position directly from
     * server timestamps.
     *
     * This means every client sees the
     * player rising on the same timeline.
     */

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

    /*
     * ======================================
     * NORMAL MOVEMENT
     * ======================================
     */

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

    /*
     * Interpolate from the exact server
     * trap position to the surface.
     */

    const y =
      THREE.MathUtils.lerp(
        this.trapStartPosition.y,
        this.trapTargetPosition.y,
        progress
      );

    /*
     * Keep the bubble centered on the
     * server's trap position.
     */

    if (
      this.trapBubble
    ) {

      this.trapBubble.position.set(
        this.trapStartPosition.x,
        y,
        this.trapStartPosition.z
      );
    }

    /*
     * Move the tadpole slightly forward
     * inside the bubble.
     *
     * The -0.15 vertical offset keeps the
     * tadpole centered slightly below the
     * bubble's center.
     */

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

          for (
            const item
            of material
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