import * as THREE from 'three';
import type { RockCollider } from '../../world/rocks';

export class AIMovement {
  private model: THREE.Group;

  private rocks: RockCollider[];

  // ==============================
  // MOVEMENT SETTINGS
  // ==============================

  private velocity =
    new THREE.Vector3();

  private speed = 5;

  private avoidanceDistance = 3;

  private boundary = 53;

  private surfaceY = 30;

  // ==============================
  // ZIG-ZAG
  // ==============================

  private zigzagTime = 0;

  private focusSide = 1;

  private focusTimer = 0;

  private focusDuration = 3;

  private focusStrength = 0;

  // ==============================
  // CONSTRUCTOR
  // ==============================

  constructor(
    model: THREE.Group,
    rocks: RockCollider[]
  ) {
    this.model = model;

    this.rocks = rocks;

    this.chooseFocus();
  }

  // ==============================
  // FOCUS
  // ==============================

  private chooseFocus() {
    this.focusSide =
      Math.random() < 0.5
        ? -1
        : 1;

    this.focusStrength =
      THREE.MathUtils.randFloat(
        0.7,
        1.25
      );

    this.focusDuration =
      THREE.MathUtils.randFloat(
        2.2,
        4.0
      );

    this.focusTimer = 0;
  }

  // ==============================
  // ROCK AVOIDANCE
  // ==============================

  private calculateRockAvoidance() {
    const avoidance =
      new THREE.Vector3();

    for (
      const rock of this.rocks
    ) {
      const dx =
        this.model.position.x -
        rock.position.x;

      const dz =
        this.model.position.z -
        rock.position.z;

      const horizontalDistance =
        Math.sqrt(
          dx * dx +
          dz * dz
        );

      const safeDistance =
        rock.radius +
        this.avoidanceDistance;

      if (
        horizontalDistance <
        safeDistance
      ) {
        const strength =
          1 -
          horizontalDistance /
            safeDistance;

        const push =
          new THREE.Vector3(
            dx,
            0,
            dz
          );

        if (
          push.lengthSq() >
          0.001
        ) {
          push.normalize();

          avoidance.addScaledVector(
            push,
            strength
          );
        }
      }
    }

    return avoidance;
  }

  // ==============================
  // BOUNDARY AVOIDANCE
  // ==============================

  private calculateBoundaryAvoidance() {
    const boundaryAvoidance =
      new THREE.Vector3();

    const edgeDistance = 8;

    if (
      this.model.position.x >
      this.boundary -
        edgeDistance
    ) {
      boundaryAvoidance.x -=
        (
          this.model.position.x -
          (
            this.boundary -
            edgeDistance
          )
        ) /
        edgeDistance;
    }

    if (
      this.model.position.x <
      -this.boundary +
        edgeDistance
    ) {
      boundaryAvoidance.x +=
        (
          (
            -this.boundary +
            edgeDistance
          ) -
          this.model.position.x
        ) /
        edgeDistance;
    }

    if (
      this.model.position.z >
      this.boundary -
        edgeDistance
    ) {
      boundaryAvoidance.z -=
        (
          this.model.position.z -
          (
            this.boundary -
            edgeDistance
          )
        ) /
        edgeDistance;
    }

    if (
      this.model.position.z <
      -this.boundary +
        edgeDistance
    ) {
      boundaryAvoidance.z +=
        (
          (
            -this.boundary +
            edgeDistance
          ) -
          this.model.position.z
        ) /
        edgeDistance;
    }

    return boundaryAvoidance;
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    delta: number,
    targetPosition: THREE.Vector3
  ) {
    this.zigzagTime +=
      delta;

    this.focusTimer +=
      delta;

    if (
      this.focusTimer >=
      this.focusDuration
    ) {
      this.chooseFocus();
    }

    const toTarget =
      new THREE.Vector3()
        .subVectors(
          targetPosition,
          this.model.position
        );

    const distanceToTarget =
      toTarget.length();

    if (
      distanceToTarget <
      0.01
    ) {
      return;
    }

    toTarget.normalize();

    // ==============================
    // SIDEWAYS MOVEMENT
    // ==============================

    const side =
      new THREE.Vector3(
        -toTarget.z,
        0,
        toTarget.x
      );

    if (
      side.lengthSq() >
      0.001
    ) {
      side.normalize();
    }

    const phase =
      this.focusTimer /
      this.focusDuration *
      Math.PI;

    const sine =
      Math.sin(phase);

    const lateral =
      sine *
      this.focusSide *
      this.focusStrength;

    const direction =
      toTarget.clone();

    direction.addScaledVector(
      side,
      lateral *
        Math.sin(
          this.focusTimer *
          2.5
        )
    );

    direction.addScaledVector(
      side,
      lateral * 1.2
    );

    // ==============================
    // ROCK AVOIDANCE
    // ==============================

    const rockAvoidance =
      this.calculateRockAvoidance();

    direction.add(
      rockAvoidance.multiplyScalar(
        2
      )
    );

    // ==============================
    // BOUNDARIES
    // ==============================

    const boundaryAvoidance =
      this.calculateBoundaryAvoidance();

    direction.add(
      boundaryAvoidance.multiplyScalar(
        3
      )
    );

    direction.normalize();

    // ==============================
    // DESIRED VELOCITY
    // ==============================

    const desiredVelocity =
      direction
        .clone()
        .multiplyScalar(
          this.speed
        );

    this.velocity.lerp(
      desiredVelocity,
      Math.min(
        delta * 4,
        1
      )
    );

    this.model.position.addScaledVector(
      this.velocity,
      delta
    );

    // ==============================
    // SURFACE LIMIT
    // ==============================

    if (
      this.model.position.y >
      this.surfaceY
    ) {
      this.model.position.y =
        this.surfaceY;

      this.velocity.y = 0;
    }

    // ==============================
    // WORLD BOUNDARIES
    // ==============================

    this.model.position.x =
      THREE.MathUtils.clamp(
        this.model.position.x,
        -this.boundary,
        this.boundary
      );

    this.model.position.z =
      THREE.MathUtils.clamp(
        this.model.position.z,
        -this.boundary,
        this.boundary
      );

    // ==============================
    // FACE MOVEMENT DIRECTION
    // ==============================

    if (
      this.velocity.lengthSq() >
      0.001
    ) {
      const lookDirection =
        this.model.position
          .clone()
          .add(this.velocity);

      this.model.lookAt(
        lookDirection
      );

      this.model.rotateY(
        Math.PI
      );
    }

    // ==============================
    // TAIL ANIMATION
    // ==============================

    const tail =
      this.model.children[3] as
        THREE.Mesh;

    if (tail) {
      tail.rotation.z =
        Math.sin(
          this.zigzagTime * 7
        ) * 0.18;

      tail.rotation.y =
        Math.sin(
          this.zigzagTime * 5
        ) * 0.07;
    }
  }

  // ==============================
  // STOP
  // ==============================

  stop() {
    this.velocity.set(
      0,
      0,
      0
    );
  }

  get time() {
    return this.zigzagTime;
  }
}