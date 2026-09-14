import * as THREE from 'three';

export function createPlayerModel() {

  const tadpole =
    new THREE.Group();

  // ==============================
  // BODY
  // ==============================

  const bodyGeometry =
    new THREE.SphereGeometry(
      0.45,
      16,
      12
    );

  const bodyMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x6f9e8b,
      roughness: 0.8,
    });

  const body =
    new THREE.Mesh(
      bodyGeometry,
      bodyMaterial
    );

  body.scale.set(
    1,
    0.9,
    1.25
  );

  tadpole.add(body);

  // ==============================
  // EYES
  // ==============================

  const eyeGeometry =
    new THREE.SphereGeometry(
      0.14,
      12,
      8
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
    -0.24,
    0.19,
    -0.38
  );

  tadpole.add(leftEye);

  const rightEye =
    new THREE.Mesh(
      eyeGeometry,
      eyeMaterial
    );

  rightEye.position.set(
    0.24,
    0.19,
    -0.38
  );

  tadpole.add(rightEye);

  // ==============================
  // TAIL
  // ==============================

  const tailGeometry =
    new THREE.ConeGeometry(
      0.25,
      1.8,
      8,
      4
    );

  const tailMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x527a6c,
      roughness: 0.9,
    });

  const tail =
    new THREE.Mesh(
      tailGeometry,
      tailMaterial
    );

  tail.rotation.x =
    Math.PI / 2;

  tail.position.z =
    1;

  tadpole.add(tail);

  return tadpole;
}