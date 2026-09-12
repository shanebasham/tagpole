import * as THREE from 'three';
import type { Controls } from './controls';

const velocity =
  new THREE.Vector3();

const acceleration = 0.018;

const waterResistance = 0.975;

const normalSpeed = 0.3;

// ==============================
// BOOST
// ==============================

const BOOST_COOLDOWN = 5;

const BOOST_FORCE = .4;

let boostCooldown = 0;

// ==============================
// SURFACE PHYSICS
// ==============================

const SURFACE_Y = 30;

// Maximum possible height above
// the water.
const MAX_BREACH_HEIGHT = 18;

// Lower gravity makes the player
// fall back into the water more slowly.
const gravity = 0.009;

// Air resistance controls how
// quickly upward momentum decreases.
const surfaceResistance = 0.94;

let aboveWater = false;

let surfaceVelocity = 0;

// Calculated from the speed at
// which the player reaches the surface.
let breachHeight = 0;

// ==============================
// MOVEMENT
// ==============================

export function updateMovement(
  camera: THREE.PerspectiveCamera,
  controls: Controls,
  delta: number
) {
  // ==============================
  // BOOST COOLDOWN
  // ==============================

  if (
    boostCooldown > 0
  ) {
    boostCooldown =
      Math.max(
        0,
        boostCooldown - delta
      );
  }

  const direction =
    new THREE.Vector3();

  // ==============================
  // HORIZONTAL MOVEMENT
  // ==============================

  if (
    controls.keys['KeyW']
  ) {
    direction.z -= 1;
  }

  if (
    controls.keys['KeyS']
  ) {
    direction.z += 1;
  }

  if (
    controls.keys['KeyA']
  ) {
    direction.x -= 1;
  }

  if (
    controls.keys['KeyD']
  ) {
    direction.x += 1;
  }

  // ==============================
  // VERTICAL MOVEMENT
  // ==============================

  if (
    controls.keys['Space']
  ) {
    direction.y += 1;
  }

  if (
    controls.keys['ControlLeft'] ||
    controls.keys['ControlRight']
  ) {
    direction.y -= 1;
  }

  // ==============================
  // NORMAL MOVEMENT
  // ==============================

  if (
    direction.lengthSq() > 0
  ) {
    direction.normalize();

    direction.applyQuaternion(
      camera.quaternion
    );

    velocity.addScaledVector(
      direction,
      acceleration *
        normalSpeed
    );
  }

  // ==============================
  // BOOST
  // ==============================

  if (
    controls.consumeBoost() &&
    boostCooldown <= 0
  ) {
    const boostDirection =
      new THREE.Vector3(
        0,
        0,
        -1
      );

    boostDirection.applyQuaternion(
      camera.quaternion
    );

    boostDirection.normalize();

    velocity.addScaledVector(
      boostDirection,
      BOOST_FORCE
    );

    boostCooldown =
      BOOST_COOLDOWN;
  }

  // ==============================
  // UNDERWATER
  // ==============================

  if (
    camera.position.y <=
    SURFACE_Y
  ) {
    aboveWater = false;

    velocity.multiplyScalar(
      Math.pow(
        waterResistance,
        delta * 60
      )
    );

    camera.position.addScaledVector(
      velocity,
      delta * 60
    );

    return;
  }

  // ==============================
  // BREACHING SURFACE
  // ==============================

  if (!aboveWater) {
    aboveWater = true;

    // Convert the upward velocity
    // from underwater movement into
    // airborne launch speed.
    surfaceVelocity =
      Math.max(
        velocity.y * 60,
        0
      );

    // Faster upward movement when
    // reaching the surface means
    // a higher breach.
    breachHeight =
      THREE.MathUtils.clamp(
        surfaceVelocity * 0.8,
        0.5,
        MAX_BREACH_HEIGHT
      );
  }

  // Stop underwater vertical
  // velocity from affecting the
  // player after entering the air.
  velocity.y = 0;

  // ==============================
  // AIRBORNE MOVEMENT
  // ==============================

  surfaceVelocity -=
    gravity *
    delta *
    60;

  surfaceVelocity *=
    Math.pow(
      surfaceResistance,
      delta * 60
    );

  camera.position.y +=
    surfaceVelocity *
    delta *
    60;

  // ==============================
  // DYNAMIC MAX HEIGHT
  // ==============================

  if (
    camera.position.y >
    SURFACE_Y +
      breachHeight
  ) {
    camera.position.y =
      SURFACE_Y +
      breachHeight;

    surfaceVelocity = 0;
  }

  // ==============================
  // RETURN TO WATER
  // ==============================

  if (
    camera.position.y <=
    SURFACE_Y
  ) {
    camera.position.y =
      SURFACE_Y;

    aboveWater = false;

    surfaceVelocity = 0;

    breachHeight = 0;
  }
}

// ==============================
// HELPERS
// ==============================

export function stopHorizontalMovement() {
  velocity.x = 0;
  velocity.z = 0;
}

export function getVelocity() {
  return velocity;
}

export function getBoostCooldown() {
  return boostCooldown;
}

export function getBoostCooldownDuration() {
  return BOOST_COOLDOWN;
}