import * as THREE from 'three';

const BOUNDARY_X = 55;
const BOUNDARY_Y_BOTTOM = -14;

// Allows the player to breach the surface.
const BOUNDARY_Y_TOP = 35;

const BOUNDARY_Z = 55;

export function updateBoundaries(
  camera: THREE.PerspectiveCamera
) {
  camera.position.x =
    THREE.MathUtils.clamp(
      camera.position.x,
      -BOUNDARY_X,
      BOUNDARY_X
    );

  camera.position.y =
    THREE.MathUtils.clamp(
      camera.position.y,
      BOUNDARY_Y_BOTTOM,
      BOUNDARY_Y_TOP
    );

  camera.position.z =
    THREE.MathUtils.clamp(
      camera.position.z,
      -BOUNDARY_Z,
      BOUNDARY_Z
    );
}