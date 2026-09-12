import * as THREE from 'three';
import type { RockCollider } from '../../world/rocks';

import { AIBubbles } from './aiBubbles';
import { AIAttack } from './aiAttack';
import { AIMovement } from './aiMovement';

export class AITadpole {
  model: THREE.Group;

  private target:
    THREE.PerspectiveCamera;

  private movement: AIMovement;
  private bubbles: AIBubbles;
  private attack: AIAttack;

  constructor(
    scene: THREE.Scene,
    target: THREE.PerspectiveCamera,
    rocks: RockCollider[],
    onPlayerTrapped: (
      bubble: THREE.Mesh
    ) => void,
    onPlayerDied: () => void
  ) {
    this.target = target;

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
      new AIBubbles(
        target,
        onPlayerTrapped,
        onPlayerDied
      );

    this.movement =
      new AIMovement(
        this.model,
        rocks
      );

    this.attack =
      new AIAttack(
        this.model,
        this.bubbles
      );
  }

  private createTadpole() {
    const tadpole =
      new THREE.Group();

    // ==============================
    // BODY
    // ==============================

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

    // ==============================
    // HEAD
    // ==============================
    //
    // The eyes are placed inside a
    // separate head group.
    //
    // This lets AIAttack shake the
    // head without rotating the body.
    //

    const head =
      new THREE.Group();

    head.name =
      'aiHead';

    tadpole.add(
      head
    );

    // ==============================
    // EYES
    // ==============================

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

    // ==============================
    // TAIL
    // ==============================

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

    // ==============================
    // BELLY
    // ==============================

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

  update(
    delta: number,
    scene: THREE.Scene
  ) {
    const bubbleKilledPlayer =
      this.bubbles.update(
        delta,
        scene,
        this.movement.time
      );

    if (
      bubbleKilledPlayer
    ) {
      this.movement.stop();

      return;
    }

    this.attack.tryAttack(
      this.target
    );

    this.attack.update(
      delta,
      scene
    );

    if (
      this.attack.isAttacking
    ) {
      this.movement.stop();

      return;
    }

    const targetPosition =
      this.bubbles.isPlayerTrapped &&
      this.bubbles.bubble
        ? this.bubbles.bubble.position
        : this.target.position;

    this.movement.update(
      delta,
      targetPosition
    );
  }

  get bubble() {
    return this.bubbles.bubble;
  }

  get isPlayerTrapped() {
    return this.bubbles.isPlayerTrapped;
  }
}