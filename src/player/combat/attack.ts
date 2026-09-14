import * as THREE from 'three';

import {
  Bubbles
} from './bubbles';

export interface AttackOptions {
  attackRange?: number;
  facingThreshold?: number;
  cooldown?: number;
  duration?: number;
  bubbleInterval?: number;
  headShake?: boolean;
  aimTarget?: () => THREE.Vector3;
  onBubbleFired?: (
    position: THREE.Vector3,
    velocity: THREE.Vector3
  ) => void;
}

export class Attack {

  private shooter:
    THREE.Object3D;

  private bubbles:
    Bubbles;

  private attackRange:
    number;

  private facingThreshold:
    number;

  private cooldown:
    number;

  private duration:
    number;

  private bubbleInterval:
    number;

  private headShake:
    boolean;

  private aimTarget:
    (() => THREE.Vector3) |
    undefined;

  private onBubbleFired:
    ((
      position: THREE.Vector3,
      velocity: THREE.Vector3
    ) => void) |
    null;

  private attacking =
    false;

  private attackTimer =
    0;

  private bubbleSpawnTimer =
    0;

  private cooldownTimer =
    0;

  private targetPosition =
    new THREE.Vector3();

  constructor(
    shooter: THREE.Object3D,
    bubbles: Bubbles,
    options: AttackOptions = {}
  ) {

    this.shooter =
      shooter;

    this.bubbles =
      bubbles;

    this.attackRange =
      options.attackRange ??
      12;

    this.facingThreshold =
      options.facingThreshold ??
      0.95;

    this.cooldown =
      options.cooldown ??
      3;

    this.duration =
      options.duration ??
      1.2;

    this.bubbleInterval =
      options.bubbleInterval ??
      0.12;

    this.headShake =
      options.headShake ??
      false;

    this.aimTarget =
      options.aimTarget;

    this.onBubbleFired =
      options.onBubbleFired ??
      null;
  }

  get isAttacking():
    boolean {

    return this.attacking;
  }

  get cooldownRemaining():
    number {

    return Math.max(
      0,
      this.cooldownTimer
    );
  }

  setBubbleFiredListener(
    listener:
      ((
        position: THREE.Vector3,
        velocity: THREE.Vector3
      ) => void) |
      null
  ): void {

    this.onBubbleFired =
      listener;
  }

  start():
    boolean {

    if (
      this.attacking ||
      this.cooldownTimer > 0
    ) {

      return false;
    }

    this.attacking =
      true;

    this.attackTimer =
      0;

    this.bubbleSpawnTimer =
      0;

    this.cooldownTimer =
      this.cooldown;

    return true;
  }

  tryAttack(
    targetPosition: THREE.Vector3
  ):
    boolean {

    if (
      this.attacking ||
      this.cooldownTimer > 0
    ) {

      return false;
    }

    const direction =
      new THREE.Vector3()
        .subVectors(
          targetPosition,
          this.shooter.position
        );

    const distance =
      direction.length();

    if (
      this.attackRange > 0 &&
      distance >
        this.attackRange
    ) {

      return false;
    }

    if (
      this.facingThreshold > 0 &&
      distance > 0
    ) {

      direction.normalize();

      const forward =
        new THREE.Vector3(
          0,
          0,
          -1
        );

      forward.applyQuaternion(
        this.shooter.quaternion
      );

      forward.normalize();

      const facing =
        forward.dot(
          direction
        );

      if (
        facing <
        this.facingThreshold
      ) {

        return false;
      }
    }

    return this.start();
  }

  update(
    delta: number,
    scene: THREE.Scene,
    shooter: THREE.Object3D
  ): void {

    if (
      this.cooldownTimer > 0
    ) {

      this.cooldownTimer =
        Math.max(
          0,
          this.cooldownTimer -
            delta
        );
    }

    if (
      !this.attacking
    ) {

      return;
    }

    this.attackTimer +=
      delta;

    this.bubbleSpawnTimer +=
      delta;

    if (
      this.headShake
    ) {

      const head =
        shooter.getObjectByName(
          'aiHead'
        );

      if (head) {

        head.rotation.y =
          Math.sin(
            this.attackTimer *
              24
          ) *
          THREE.MathUtils.degToRad(
            18
          );
      }
    }

    if (
      this.bubbleSpawnTimer >=
      this.bubbleInterval
    ) {

      this.bubbleSpawnTimer -=
        this.bubbleInterval;

      this.fireBubble(
        scene,
        shooter
      );
    }

    if (
      this.attackTimer >=
      this.duration
    ) {

      this.stop();
    }
  }

  private fireBubble(
    scene: THREE.Scene,
    shooter: THREE.Object3D
  ): void {

    let aimPosition:
      THREE.Vector3 | null =
      null;

    if (
      this.aimTarget
    ) {

      this.targetPosition.copy(
        this.aimTarget()
      );

      aimPosition =
        this.targetPosition;
    }

    const result =
      this.bubbles.fireFromObject(
        scene,
        shooter,
        aimPosition
      );

    if (
      this.onBubbleFired
    ) {

      this.onBubbleFired(
        result.position,
        result.velocity
      );
    }
  }

  private stop():
    void {

    this.attacking =
      false;

    this.attackTimer =
      0;

    this.bubbleSpawnTimer =
      0;

    if (
      this.headShake
    ) {

      const head =
        this.shooter.getObjectByName(
          'aiHead'
        );

      if (head) {
        head.rotation.y =
          0;
      }
    }
  }

  reset():
    void {

    this.attacking =
      false;

    this.attackTimer =
      0;

    this.bubbleSpawnTimer =
      0;

    this.cooldownTimer =
      0;

    if (
      this.headShake
    ) {

      const head =
        this.shooter.getObjectByName(
          'aiHead'
        );

      if (head) {
        head.rotation.y =
          0;
      }
    }
  }
}