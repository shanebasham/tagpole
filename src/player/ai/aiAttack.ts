import * as THREE from 'three';
import { AIBubbles } from './aiBubbles';

export class AIAttack {
  private model: THREE.Group;
  private bubbles: AIBubbles;

  // AI can begin the attack from farther away.
  private attackRange = 12;

  private attackCooldown = 0;
  private attackCooldownDuration = 3;

  private attackTimer = 0;
  private attackDuration = 1.2;

  private attacking = false;

  private bubbleSpawnTimer = 0;
  private bubbleSpawnInterval = 0.12;

  // The AI must naturally be facing
  // close to the player before attacking.
  //
  // The AI does NOT snap toward
  // the player.
  private facingThreshold = 0.95;

  // Side-to-side head movement.
  private headShakeStrength =
    THREE.MathUtils.degToRad(18);

  private headShakeSpeed = 24;

  private head:
    THREE.Group | null = null;

  constructor(
    model: THREE.Group,
    bubbles: AIBubbles
  ) {
    this.model = model;

    this.bubbles = bubbles;

    this.head =
      this.model.getObjectByName(
        'aiHead'
      ) as THREE.Group | null;
  }

  // ==============================
  // FACING CHECK
  // ==============================

  private isFacingPlayer(
    target: THREE.PerspectiveCamera
  ) {
    const toPlayer =
      new THREE.Vector3()
        .subVectors(
          target.position,
          this.model.position
        );

    // Only compare horizontal
    // facing direction.
    toPlayer.y = 0;

    if (
      toPlayer.lengthSq() <
      0.001
    ) {
      return true;
    }

    toPlayer.normalize();

    const forward =
      new THREE.Vector3(
        0,
        0,
        -1
      );

    forward.applyQuaternion(
      this.model.quaternion
    );

    forward.y = 0;

    if (
      forward.lengthSq() <
      0.001
    ) {
      return false;
    }

    forward.normalize();

    const dot =
      forward.dot(
        toPlayer
      );

    return (
      dot >=
      this.facingThreshold
    );
  }

  // ==============================
  // START ATTACK
  // ==============================

  tryAttack(
    target: THREE.PerspectiveCamera
  ) {
    if (
      this.attackCooldown > 0 ||
      this.attacking ||
      this.bubbles.isPlayerTrapped
    ) {
      return;
    }

    const distance =
      this.model.position.distanceTo(
        target.position
      );

    // The AI can shoot from 12m away.
    if (
      distance >
      this.attackRange
    ) {
      return;
    }

    // The AI must naturally be
    // facing the player.
    //
    // It never snaps toward them.
    if (
      !this.isFacingPlayer(
        target
      )
    ) {
      return;
    }

    this.attacking = true;

    this.attackTimer = 0;

    this.bubbleSpawnTimer = 0;
  }

  // ==============================
  // ATTACK UPDATE
  // ==============================

  update(
    delta: number,
    scene: THREE.Scene,
  ) {
    if (
      this.attackCooldown > 0
    ) {
      this.attackCooldown -=
        delta;
    }

    if (!this.attacking) {
      return;
    }

    this.attackTimer +=
      delta;

    this.bubbleSpawnTimer +=
      delta;

    // ==============================
    // HEAD SHAKE
    // ==============================

    if (this.head) {
      this.head.rotation.y =
        Math.sin(
          this.attackTimer *
            this.headShakeSpeed
        ) *
        this.headShakeStrength;
    }

    // ==============================
    // SHOOT BUBBLES
    // ==============================

    while (
      this.bubbleSpawnTimer >=
      this.bubbleSpawnInterval
    ) {
      this.bubbleSpawnTimer -=
        this.bubbleSpawnInterval;

      this.bubbles.createSmallBubble(
        scene,
        this.model
      );
    }

    // ==============================
    // FINISH ATTACK
    // ==============================

    if (
      this.attackTimer >=
      this.attackDuration
    ) {
      this.attacking = false;

      this.attackCooldown =
        this.attackCooldownDuration;

      if (this.head) {
        this.head.rotation.y = 0;
      }
    }
  }

  get isAttacking() {
    return this.attacking;
  }
}