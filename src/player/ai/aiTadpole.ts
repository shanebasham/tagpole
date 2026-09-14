import * as THREE from 'three';

import type {
  RockCollider
} from '../../world/rocks';

import type {
  CombatTarget
} from '../combat/bubbles';

import {
  Bubbles
} from '../combat/bubbles';

import {
  Attack
} from '../combat/attack';

import {
  AIMovement
} from './aiMovement';

export class AITadpole {

  model:
    THREE.Group;

  private target:
    THREE.PerspectiveCamera;

  private movement:
    AIMovement;

  private bubbles:
    Bubbles;

  private attack:
    Attack;

  private trapped =
    false;

  private dead =
    false;

  private isPlayerTrapped:
    () => boolean;

  constructor(
    scene: THREE.Scene,
    target: THREE.PerspectiveCamera,
    rocks: RockCollider[],
    onPlayerTrapped: (
      bubble: THREE.Mesh
    ) => void,
    onPlayerDied: () => void,
    isPlayerTrapped: () => boolean
  ) {
    this.target =
      target;

    this.isPlayerTrapped =
      isPlayerTrapped;

    this.model =
      this.createTadpole();

    this.model.position.set(
      15,
      -5,
      -15
    );

    scene.add(
      this.model
    );

    this.bubbles =
      new Bubbles();

    this.attack =
      new Attack(
        this.model,
        this.bubbles,
        {
          attackRange: 12,

          facingThreshold: 0.95,

          cooldown: 3,

          duration: 1.2,

          bubbleInterval: 0.12,

          headShake: true,

          aimTarget: () => {
            return this.target.position;
          },
        }
      );

    this.movement =
      new AIMovement(
        this.model,
        rocks
      );

    const playerTarget:
      CombatTarget = {

      getPosition: () => {
        return this.target.position;
      },

      isAlive: () => {
        return !this.dead;
      },

      isTrapped: () => {
        return this.isPlayerTrapped();
      },

      trap: (
        bubble: THREE.Mesh
      ) => {

        if (
          this.dead ||
          this.isPlayerTrapped()
        ) {
          return false;
        }

        onPlayerTrapped(
          bubble
        );

        return true;
      },

      updateTrappedPosition: (
        _position: THREE.Vector3
      ) => {
        // The player handles
        // their own trapped position.
      },

      onBubbleReachedSurface:
        () => {
          onPlayerDied();
        },
    };

    this.bubbles.setTargets([
      playerTarget
    ]);
  }

  // ==============================
  // CREATE TADPOLE
  // ==============================

  private createTadpole():
    THREE.Group {

    const group =
      new THREE.Group();

    // ==========================
    // BODY
    // ==========================

    const bodyGeometry =
      new THREE.SphereGeometry(
        0.75,
        20,
        14
      );

    const bodyMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x4f7566,
        roughness: 0.85,
      });

    const body =
      new THREE.Mesh(
        bodyGeometry,
        bodyMaterial
      );

    body.scale.set(
      1,
      0.9,
      1.15
    );

    group.add(
      body
    );

    // ==========================
    // HEAD
    // ==========================

    const head =
      new THREE.Group();

    head.name =
      'aiHead';

    group.add(
      head
    );

    // ==========================
    // EYES
    // ==========================

    const eyeGeometry =
      new THREE.SphereGeometry(
        0.2,
        16,
        12
      );

    const eyeMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x050706,
        roughness: 0.5,
      });

    const leftEye =
      new THREE.Mesh(
        eyeGeometry,
        eyeMaterial
      );

    leftEye.position.set(
      -0.4,
      0.32,
      -0.58
    );

    head.add(
      leftEye
    );

    const rightEye =
      new THREE.Mesh(
        eyeGeometry,
        eyeMaterial
      );

    rightEye.position.set(
      0.4,
      0.32,
      -0.58
    );

    head.add(
      rightEye
    );

    // ==========================
    // TAIL
    // ==========================

const tailGeometry =
      new THREE.ConeGeometry(
        0.42,
        3.0,
        8,
        8
      );

    const tailMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x35574c,
        roughness: 0.95,
      });

    const tail =
      new THREE.Mesh(
        tailGeometry,
        tailMaterial
      );

    tail.rotation.x =
      Math.PI / 2;

    tail.position.z =
      1.65;

    group.add(
      tail
    );

    // ==========================
    // BELLY
    // ==========================

    const bellyGeometry =
      new THREE.SphereGeometry(
        0.55,
        16,
        10
      );

    const bellyMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x668d79,
        roughness: 0.85,
      });

    const belly =
      new THREE.Mesh(
        bellyGeometry,
        bellyMaterial
      );

    belly.scale.set(
      0.9,
      0.45,
      0.85
    );

    belly.position.set(
      0,
      -0.3,
      -0.1
    );

    group.add(
      belly
    );

    return group;
  }

  // ==============================
  // CENTER
  // ==============================

  getTadpoleCenter():
    THREE.Vector3 {

    const box =
      new THREE.Box3()
        .setFromObject(
          this.model
        );

    return box.getCenter(
      new THREE.Vector3()
    );
  }

  setTadpoleCenter(
    center: THREE.Vector3
  ): void {

    const currentCenter =
      this.getTadpoleCenter();

    const offset =
      new THREE.Vector3()
        .subVectors(
          center,
          currentCenter
        );

    this.model.position.add(
      offset
    );
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    delta: number,
    scene: THREE.Scene
  ): void {

    if (
      this.dead
    ) {
      return;
    }

    // Always update existing bubbles first.
    //
    // This allows the large trapping bubble
    // to continue rising after the player
    // has been trapped.

    this.bubbles.update(
      delta,
      scene,
      this.movement.time
    );

    // ==========================
    // PLAYER TRAPPED
    // ==========================

    if (
      this.isPlayerTrapped()
    ) {

      // Stop the AI's current attack.

      this.attack.reset();

      // Remove small attack projectiles.
      //
      // This does NOT remove the active
      // trapping bubble.

      this.bubbles.clearProjectiles(
        scene
      );

      // IMPORTANT:
      // Do NOT call movement.stop() here.
      //
      // The AI should continue swimming
      // while the player is trapped.

      this.movement.update(
        delta,
        this.target.position
      );

      return;
    }

    // ==========================
    // AI TRAPPED
    // ==========================

    if (
      this.trapped
    ) {

      this.movement.stop();

      return;
    }

    // ==========================
    // ATTACK
    // ==========================

    this.attack.tryAttack(
      this.target.position
    );

    this.attack.update(
      delta,
      scene,
      this.model
    );

    if (
      this.attack.isAttacking
    ) {

      this.movement.stop();

      return;
    }

    // ==========================
    // MOVEMENT
    // ==========================

    this.movement.update(
      delta,
      this.target.position
    );
  }

  // ==============================
  // COMBAT TARGET
  // ==============================

  getCombatTarget():
    CombatTarget {

    return {

      getPosition: () => {
        return this.getTadpoleCenter();
      },

      isAlive: () => {
        return !this.dead;
      },

      isTrapped: () => {
        return this.trapped;
      },

      trap: (
        _bubble: THREE.Mesh
      ) => {

        if (
          this.dead ||
          this.trapped
        ) {
          return false;
        }

        this.trapped =
          true;

        return true;
      },

      updateTrappedPosition: (
        position: THREE.Vector3
      ) => {

        if (
          this.trapped
        ) {
          this.setTadpoleCenter(
            position
          );
        }
      },

      onBubbleReachedSurface:
        () => {

          this.dead =
            true;
        },
    };
  }

  // ==============================
  // BUBBLE
  // ==============================

  get bubble():
    THREE.Mesh | null {

    return this.bubbles.bubble;
  }

  // ==============================
  // STATE
  // ==============================

  isAlive():
    boolean {

    return !this.dead;
  }

  isTrapped():
    boolean {

    return this.trapped;
  }

  // ==============================
  // RESET
  // ==============================

  reset(
    scene: THREE.Scene
  ): void {

    this.dead =
      false;

    this.trapped =
      false;

    this.bubbles.reset(
      scene
    );

    this.attack.reset();

    this.model.visible =
      true;
  }

  // ==============================
  // DESTROY
  // ==============================

  destroy(
    scene: THREE.Scene
  ): void {

    this.bubbles.reset(
      scene
    );

    this.model.removeFromParent();
  }
}