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
  setPlayerModelColor,
  setPlayerFlashlightVisible
} from './playerModel';

import {
  getPlayerColor,
  type PlayerColor
} from '../game/playerColor';

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

  private playerColor:
    PlayerColor;

  private trappedAt:
    number | null =
    null;

  private trapEndAt:
    number | null =
    null;

  getYaw(): number {
    return this.controls.yaw;
  }

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

    // Load the saved color.
    // If the player has never selected
    // a color, this returns DEFAULT.
    this.playerColor =
      getPlayerColor();

    this.model =
      createPlayerModel();

    setPlayerModelColor(
      this.model,
      this.playerColor.hex
    );

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
  // COLOR
  // ==============================

  setColor(
    color: PlayerColor
  ): void {

    this.playerColor =
      color;

    setPlayerModelColor(
      this.model,
      color.hex
    );
  }

  getColor():
    PlayerColor {

    return this.playerColor;
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

    const bubble =
      this.cameraSystem.getTrappedBubble();

    if (!bubble) {
      return;
    }

    this.model.position.copy(
      bubble.position
    );

    this.model.position.y -=
      0.15;

    this.model.rotation.set(
      this.controls.pitch,
      this.controls.yaw,
      0,
      'YXZ'
    );
  }

  setTrapped(
    trapped: boolean,
    bubble: THREE.Mesh | null = null
  ): void {

    this.isFrozen =
      trapped;

    if (trapped) {

      this.model.visible =
        true;

      setPlayerFlashlightVisible(
        this.model,
        false
      );

      if (
        this.trappedAt === null
      ) {

        this.trappedAt =
          Date.now();
      }

      this.cameraSystem.setTrapped(
        bubble
      );

      this.updateTrappedPlayer();

    } else {

      this.trappedAt =
        null;

      this.trapEndAt =
        null;

      setPlayerFlashlightVisible(
        this.model,
        true
      );

      this.cameraSystem.clearTrapped();

      this.model.visible =
        false;
    }
  }

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

      // Send the currently selected
      // local color with the player state.
      color:
        this.playerColor.id,

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
        this.trappedAt,

      trapEndAt:
        this.trapEndAt,
    };
  }
}