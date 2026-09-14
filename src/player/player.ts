import * as THREE from 'three';

import type {
  Controls
} from './controls';

import {
  PlayerMovement
} from './playerMovement';

import {
  PlayerCamera
} from './playerCamera';

import {
  PlayerDeath
} from './playerDeath';

import {
  createPlayerModel,
  setPlayerFlashlightVisible
} from './playerModel';

import {
  Bubbles
} from './combat/bubbles';

import type {
  CombatTarget
} from './combat/bubbles';

import {
  Attack
} from './combat/attack';

import type {
  NetworkPlayer
} from '../game/gameState';

export class Player {

  camera:
    THREE.PerspectiveCamera;

  controls:
    Controls;

  id:
    string;

  isIt:
    boolean;

  isFrozen:
    boolean;

  model:
    THREE.Group;

  private movement:
    PlayerMovement;

  private cameraSystem:
    PlayerCamera;

  private death:
    PlayerDeath;

  private bubbles:
    Bubbles;

  private attack:
    Attack;

  /*
   * Multiplayer trap timing.
   *
   * These are primarily used when this
   * client is the trapped player.
   */

  private trappedAt:
    number | null =
    null;

  private trapEndAt:
    number | null =
    null;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: Controls
  ) {

    this.camera =
      camera;

    this.controls =
      controls;

    this.id =
      typeof crypto.randomUUID ===
      'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`;

    this.isIt =
      false;

    this.isFrozen =
      false;

    this.model =
      createPlayerModel();

    /*
     * The local tadpole is normally hidden
     * because the player sees through the
     * first-person camera.
     */
    this.model.visible =
      false;

    scene.add(
      this.model
    );

    this.movement =
      new PlayerMovement(
        camera,
        controls
      );

    this.cameraSystem =
      new PlayerCamera(
        camera,
        controls
      );

    this.death =
      new PlayerDeath(
        camera,
        this.model
      );

    this.bubbles =
      new Bubbles();

    this.attack =
      new Attack(
        this.camera,
        this.bubbles,
        {
          cooldown: 5,
          duration: 1.2,
          bubbleInterval: 0.12,
          headShake: false,
          attackRange: 0,
          facingThreshold: 0,
        }
      );
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    delta: number
  ): void {

    /*
     * Death takes priority over everything.
     */
    if (
      this.death.active
    ) {

      this.death.update(
        delta
      );

      this.cameraSystem.updateDeathCamera(
        this.model.position
      );

      return;
    }

    /*
     * While trapped, stop normal movement
     * and keep the tadpole inside the
     * trapping bubble.
     */
    if (
      this.isFrozen
    ) {

      this.updateTrappedPlayer();

      this.cameraSystem.updateTrapped();

      return;
    }

    /*
     * Normal first-person gameplay.
     */
    this.cameraSystem.updateFirstPerson();

    this.movement.update(
      delta
    );

    /*
     * Keep the tadpole model facing the
     * same direction as the camera.
     */
    this.model.rotation.set(
      this.controls.pitch,
      this.controls.yaw,
      0,
      'YXZ'
    );
  }

  // ==============================
  // COMBAT
  // ==============================

  updateCombat(
    delta: number,
    scene: THREE.Scene
  ): void {

    this.bubbles.update(
      delta,
      scene,
      0
    );

    this.attack.update(
      delta,
      scene,
      this.camera
    );
  }

  startAttack(): boolean {

    if (
      this.death.active ||
      this.isFrozen
    ) {
      return false;
    }

    if (
      this.attack.isAttacking
    ) {
      return false;
    }

    if (
      this.attack.cooldownRemaining >
      0
    ) {
      return false;
    }

    return this.attack.start();
  }

  setCombatTargets(
    targets: CombatTarget[]
  ): void {

    this.bubbles.setTargets(
      targets
    );
  }

  setBubbleFiredListener(
    listener:
      ((
        position: THREE.Vector3,
        velocity: THREE.Vector3
      ) => void) | null
  ): void {

    this.attack.setBubbleFiredListener(
      listener
    );
  }

  showRemoteBubble(
    scene: THREE.Scene,
    position: THREE.Vector3,
    velocity: THREE.Vector3
  ): void {

    this.bubbles.fireRemote(
      scene,
      position,
      velocity
    );
  }

  getAttackCooldown(): number {

    return this.attack.cooldownRemaining;
  }

  // ==============================
  // TRAPPED
  // ==============================

  private updateTrappedPlayer(): void {

    const bubble:
      THREE.Mesh | null =
      this.cameraSystem.getTrappedBubble();

    /*
     * There is no trapped bubble yet.
     * Keep the current model position rather
     * than hiding the player.
     */
    if (
      !bubble
    ) {
      return;
    }

    /*
     * Put the tadpole directly at the center
     * of the trapping bubble.
     *
     * This is intentionally position.copy()
     * rather than calculating the model's
     * bounding-box center every frame.
     */
    this.model.position.copy(
      bubble.position
    );

    /*
     * Keep the tadpole facing the direction
     * the player was looking when trapped.
     */
    this.model.rotation.set(
      this.controls.pitch,
      this.controls.yaw,
      0,
      'YXZ'
    );
  }

  setTrapped(
    trapped: boolean,
    bubble:
      THREE.Mesh | null = null
  ): void {

    this.isFrozen =
      trapped;

    if (
      trapped
    ) {

      /*
       * The tadpole MUST be visible while
       * trapped because the camera moves
       * outside the player.
       */
      this.model.visible =
        true;

      /*
       * Hide only the flashlight beams.
       * Do not hide the tadpole itself.
       */
      setPlayerFlashlightVisible(
        this.model,
        false
      );

      /*
       * Record the local trap start time
       * if one has not already been supplied
       * by multiplayer.
       */
      if (
        this.trappedAt === null
      ) {

        this.trappedAt =
          Date.now();
      }

      /*
       * Give PlayerCamera the actual bubble
       * so it can position the trapped camera
       * around it.
       */
      this.cameraSystem.setTrapped(
        bubble
      );

      /*
       * Immediately place the tadpole at the
       * bubble instead of waiting for the next
       * update frame.
       */
      if (
        bubble
      ) {

        this.model.position.copy(
          bubble.position
        );

        this.model.rotation.set(
          this.controls.pitch,
          this.controls.yaw,
          0,
          'YXZ'
        );
      }

    } else {

      /*
       * Clear local trap timing.
       */
      this.trappedAt =
        null;

      this.trapEndAt =
        null;

      /*
       * Restore flashlight beams.
       */
      setPlayerFlashlightVisible(
        this.model,
        true
      );

      /*
       * Remove the trapped camera state.
       */
      this.cameraSystem.clearTrapped();

      /*
       * Hide the local first-person tadpole
       * again after being released.
       */
      this.model.visible =
        false;
    }
  }

  /*
   * Allows multiplayer code to give
   * the local player the exact server
   * trap timing.
   */
  setNetworkTrapTiming(
    trappedAt:
      number | null,
    trapEndAt:
      number | null
  ): void {

    this.trappedAt =
      trappedAt;

    this.trapEndAt =
      trapEndAt;
  }

  // ==============================
  // DEATH
  // ==============================

  startDeathFloat(
    onReachedSurface: () => void
  ): void {

    this.isFrozen =
      false;

    this.cameraSystem.startDeathCamera();

    this.death.start(
      () => {

        this.cameraSystem.stopDeathCamera();

        onReachedSurface();
      }
    );
  }

  // ==============================
  // POSITION
  // ==============================

  get position():
    THREE.Vector3 {

    return this.camera.position;
  }

  // ==============================
  // NETWORK STATE
  // ==============================

  getNetworkState():
    NetworkPlayer {

    return {

      id:
        this.id,

      x:
        this.camera.position.x,

      y:
        this.camera.position.y,

      z:
        this.camera.position.z,

      yaw:
        this.controls.yaw,

      pitch:
        this.controls.pitch,

      /*
       * Movement is currently driven
       * directly by position, so these
       * remain zero.
       */
      vx:
        0,

      vy:
        0,

      vz:
        0,

      alive:
        !this.death.active,

      trapped:
        this.isFrozen,

      isDrowned:
        false,

      trappedAt:
        this.trappedAt,

      trapEndAt:
        this.trapEndAt,
    };
  }
}