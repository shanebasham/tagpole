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

  tail.position.z = 1;

  tadpole.add(tail);

  return tadpole;
}