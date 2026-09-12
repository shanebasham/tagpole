import * as THREE from 'three';

export function createFlashlight(
  scene: THREE.Scene
) {
  const flashlight = new THREE.SpotLight(
    0xbdefff,
    8,
    80,
    Math.PI / 7,
    0.5,
    1
  );

  scene.add(flashlight);

  const target = new THREE.Object3D();
  scene.add(target);

  flashlight.target = target;

  return {
    flashlight,
    target,
  };
}

export function updateFlashlight(
  camera: THREE.PerspectiveCamera,
  flashlight: THREE.SpotLight,
  target: THREE.Object3D
) {
  flashlight.position.copy(
    camera.position
  );

  const direction = new THREE.Vector3(
    0,
    0,
    -1
  );

  direction.applyQuaternion(
    camera.quaternion
  );

  target.position.copy(
    camera.position
  );

  target.position.add(
    direction.multiplyScalar(20)
  );
}