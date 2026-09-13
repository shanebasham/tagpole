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
  createPlayerModel
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

    if (
      this.isFrozen
    ) {

      this.updateTrappedPlayer();

      this.cameraSystem.updateTrapped();

      return;
    }

    this.cameraSystem.updateFirstPerson();

    this.movement.update(
      delta
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

  getAttackCooldown(): number {

    return this.attack.cooldownRemaining;
  }

  // ==============================
  // TRAPPED
  // ==============================

  private getPlayerCenter(): THREE.Vector3 {

    this.model.updateWorldMatrix(
      true,
      true
    );

    const box: THREE.Box3 =
      new THREE.Box3();

    box.setFromObject(
      this.model
    );

    const center: THREE.Vector3 =
      new THREE.Vector3();

    box.getCenter(
      center
    );

    return center;
  }

  private setPlayerCenter(
    position: THREE.Vector3
  ): void {

    const currentCenter:
      THREE.Vector3 =
      this.getPlayerCenter();

    this.model.position.x +=
      position.x -
      currentCenter.x;

    this.model.position.y +=
      position.y -
      currentCenter.y;

    this.model.position.z +=
      position.z -
      currentCenter.z;
  }

  private updateTrappedPlayer(): void {

    const bubble:
      THREE.Mesh | null =
      this.cameraSystem.getTrappedBubble();

    if (
      !bubble
    ) {
      return;
    }

    this.setPlayerCenter(
      bubble.position
    );

    this.model.rotation.set(
      0,
      this.controls.yaw,
      0
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

      this.model.visible =
        true;

      this.cameraSystem.setTrapped(
        bubble
      );

    } else {

      this.cameraSystem.clearTrapped();

      this.model.visible =
        false;
    }
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

  get position(): THREE.Vector3 {

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
        null,

      trapEndAt:
        null,
    };
  }
}