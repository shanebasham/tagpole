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

  constructor(
    scene: THREE.Scene,
    target: THREE.PerspectiveCamera,
    rocks: RockCollider[],
    onPlayerTrapped: (
      bubble: THREE.Mesh
    ) => void,
    onPlayerDied: () => void
  ) {
    this.target =
      target;

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
        return true;
      },

      isTrapped: () => {
        return false;
      },

      trap: (
        bubble: THREE.Mesh
      ) => {
        onPlayerTrapped(
          bubble
        );

        return true;
      },

      updateTrappedPosition: (
        _position: THREE.Vector3
      ) => {
        // Player handles its own
        // trapped bubble position.
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

  private createTadpole() {
    const tadpole =
      new THREE.Group();

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

    tadpole.add(
      body
    );

    const head =
      new THREE.Group();

    head.name =
      'aiHead';

    tadpole.add(
      head
    );

    const eyeGeometry =
      new THREE.SphereGeometry(
        0.2,
        16,
        12
      );

    const eyeMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x050706,
        roughness: 0.65,
      });

    const leftEye =
      new THREE.Mesh(
        eyeGeometry,
        eyeMaterial
      );

    const rightEye =
      new THREE.Mesh(
        eyeGeometry,
        eyeMaterial
      );

    leftEye.position.set(
      -0.4,
      0.32,
      -0.58
    );

    rightEye.position.set(
      0.4,
      0.32,
      -0.58
    );

    head.add(
      leftEye,
      rightEye
    );

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

    tadpole.add(
      tail
    );

    const bellyGeometry =
      new THREE.SphereGeometry(
        0.55,
        16,
        10
      );

    const bellyMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x668d79,
        roughness: 1,
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

    tadpole.add(
      belly
    );

    return tadpole;
  }

  /*
   * Returns the actual world-space center
   * of the ENTIRE rendered tadpole.
   *
   * This includes:
   * - body
   * - eyes
   * - belly
   * - entire tail
   */
  private getTadpoleCenter():
    THREE.Vector3 {

    this.model.updateWorldMatrix(
      true,
      true
    );

    const box =
      new THREE.Box3();

    box.setFromObject(
      this.model
    );

    const center =
      new THREE.Vector3();

    box.getCenter(
      center
    );

    return center;
  }

  /*
   * Moves the tadpole so that the center
   * of its COMPLETE bounding box is at
   * the supplied world position.
   */
  private setTadpoleCenter(
    position: THREE.Vector3
  ): void {

    const currentCenter =
      this.getTadpoleCenter();

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

  update(
    delta: number,
    scene: THREE.Scene
  ) {
    if (
      this.dead
    ) {
      return;
    }

    this.bubbles.update(
      delta,
      scene,
      this.movement.time
    );

    if (
      this.trapped
    ) {
      this.movement.stop();

      return;
    }

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

    this.movement.update(
      delta,
      this.target.position
    );
  }

  getCombatTarget():
    CombatTarget {
    return {

      getPosition: () => {
        return this.model.position;
      },

      isAlive: () => {
        return !this.dead;
      },

      isTrapped: () => {
        return this.trapped;
      },

      trap: (
        bubble: THREE.Mesh
      ) => {
        if (
          this.dead ||
          this.trapped
        ) {
          return false;
        }

        this.trapped =
          true;

        this.attack.reset();

        this.movement.stop();

        this.model.visible =
          true;

        /*
         * AI bubbles are 35% larger
         * than normal player bubbles.
         */
        bubble.scale.setScalar(
          1.35
        );

        /*
         * Find the center of the COMPLETE
         * tadpole, including its tail.
         */
        const center =
          this.getTadpoleCenter();

        /*
         * The bubble center is now
         * EXACTLY the tadpole center.
         */
        bubble.position.copy(
          center
        );

        /*
         * Reposition the tadpole so its
         * complete bounding-box center
         * is exactly inside the bubble.
         */
        this.setTadpoleCenter(
          bubble.position
        );

        this.model.position.y -=
          0.15;

        return true;
      },

      updateTrappedPosition: (
        position: THREE.Vector3
      ) => {
        if (
          !this.trapped ||
          this.dead
        ) {
          return;
        }

        /*
         * Keep the COMPLETE tadpole centered
         * inside the rising bubble.
         */
        this.setTadpoleCenter(
          position
        );

        this.model.position.y -=
          0.15;
      },

      onBubbleReachedSurface:
        () => {
          this.onBubbleReachedSurface();
        },
    };
  }

  trap(
    bubble: THREE.Mesh
  ) {
    if (
      this.dead ||
      this.trapped
    ) {
      return false;
    }

    this.trapped =
      true;

    this.attack.reset();

    this.movement.stop();

    this.model.visible =
      true;

    /*
     * AI bubbles are 35% larger.
     */
    bubble.scale.setScalar(
      1.35
    );

    /*
     * Find the actual center of the
     * whole tadpole.
     */
    const center =
      this.getTadpoleCenter();

    /*
     * Put the bubble exactly there.
     */
    bubble.position.copy(
      center
    );

    /*
     * Put the entire tadpole exactly
     * around the bubble center.
     */
    this.setTadpoleCenter(
      bubble.position
    );

    this.model.position.y -=
      0.15;

    return true;
  }

  updateTrappedPosition(
    position: THREE.Vector3
  ) {
    if (
      !this.trapped ||
      this.dead
    ) {
      return;
    }

    /*
     * Keep the actual geometric center
     * of the tadpole at the bubble center.
     */
    this.setTadpoleCenter(
      position
    );

    this.model.position.y -=
      0.15;
  }

  onBubbleReachedSurface() {
    if (
      this.dead
    ) {
      return;
    }

    this.trapped =
      false;

    this.dead =
      true;

    this.model.visible =
      false;
  }

  isAlive() {
    return !this.dead;
  }

  isTrapped() {
    return this.trapped;
  }

  get isPlayerTrapped() {
    return this.bubbles.isTrapping;
  }

  get bubble() {
    return this.bubbles.bubble;
  }

  get isAttacking() {
    return this.attack.isAttacking;
  }

  reset(
    scene: THREE.Scene
  ) {
    this.trapped =
      false;

    this.dead =
      false;

    this.model.visible =
      true;

    this.attack.reset();

    this.bubbles.reset(
      scene
    );
  }
}