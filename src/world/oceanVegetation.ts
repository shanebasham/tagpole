import * as THREE from 'three';

// ==============================
// SEAWEED STORAGE
// ==============================

let seaweedGroups: THREE.Group[] = [];

// ==============================
// CORAL MATERIALS
// ==============================

const coralMaterials = [
  new THREE.MeshStandardMaterial({
    color: 0x8b4655,
    roughness: 0.9,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x9a5545,
    roughness: 0.9,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x694b72,
    roughness: 0.9,
  }),
  new THREE.MeshStandardMaterial({
    color: 0x3f7770,
    roughness: 0.9,
  }),
];

// ==============================
// SEAWEED MATERIAL
// ==============================

const seaweedMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x315c4a,
    roughness: 1,
    side: THREE.DoubleSide,
  });

// ==============================
// CORAL
// ==============================

function createCoral(
  x: number,
  z: number
) {
  const coral = new THREE.Group();

  const material =
    coralMaterials[
      Math.floor(
        Math.random() *
        coralMaterials.length
      )
    ];

  const branchCount =
    THREE.MathUtils.randInt(5, 10);

  for (let i = 0; i < branchCount; i++) {
    const height =
      THREE.MathUtils.randFloat(
        1.5,
        12
      );

    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.1,
        0.25,
        height,
        6
      ),
      material
    );

    branch.position.set(
      THREE.MathUtils.randFloatSpread(1.5),
      height / 2,
      THREE.MathUtils.randFloatSpread(1.5)
    );

    branch.rotation.z =
      THREE.MathUtils.randFloat(
        -0.35,
        0.35
      );

    branch.rotation.x =
      THREE.MathUtils.randFloat(
        -0.35,
        0.35
      );

    coral.add(branch);
  }

  coral.position.set(
    x,
    -15,
    z
  );

  return coral;
}

// ==============================
// SEAWEED
// ==============================

function createSeaweed(
  x: number,
  z: number,
  forest = false
) {
  const group = new THREE.Group();

  const bladeCount =
    forest
      ? THREE.MathUtils.randInt(5, 10)
      : THREE.MathUtils.randInt(5, 15);

  for (let i = 0; i < bladeCount; i++) {
    const height =
      forest
        ? THREE.MathUtils.randFloat(
            3,
            40
          )
        : THREE.MathUtils.randFloat(
            1.5,
            12
          );

    // ------------------------------
    // BLADE GEOMETRY
    // ------------------------------

    const geometry =
      new THREE.PlaneGeometry(
        0.3,
        height,
        1,
        8
      );

    // Keep the bottom anchored
    // at Y = 0.
    geometry.translate(
      0,
      height / 2,
      0
    );

    const blade = new THREE.Mesh(
      geometry,
      seaweedMaterial
    );

    // ------------------------------
    // BLADE POSITION
    // ------------------------------

    const angle =
      (i / bladeCount) *
        Math.PI *
        2 +
      THREE.MathUtils.randFloat(
        -0.2,
        0.2
      );

    const radius =
      forest
        ? THREE.MathUtils.randFloat(
            0.1,
            0.55
          )
        : THREE.MathUtils.randFloat(
            0.15,
            0.6
          );

    blade.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );

    // ------------------------------
    // BLADE DIRECTION
    // ------------------------------

    blade.rotation.y =
      angle +
      Math.PI / 2;

    // ------------------------------
    // SWAY SETTINGS
    // ------------------------------

    blade.userData.swayOffset =
      Math.random() *
      Math.PI *
      2;

    blade.userData.swayAmount =
      THREE.MathUtils.randFloat(
        0.15,
        0.3
      );

    blade.userData.swaySpeed =
      THREE.MathUtils.randFloat(
        0.8,
        1.2
      );

    // Store height because
    // BufferGeometry does not expose
    // geometry.parameters in TypeScript.
    blade.userData.height =
      height;

    group.add(blade);
  }

  group.position.set(
    x,
    -15,
    z
  );

  return group;
}

// ==============================
// CREATE VEGETATION
// ==============================

export function createOceanVegetation(
  scene: THREE.Scene
) {
  seaweedGroups = [];

  // ------------------------------
  // CORAL
  // ------------------------------

  for (let i = 0; i < 40; i++) {
    const coral = createCoral(
      THREE.MathUtils.randFloat(
        -52,
        52
      ),
      THREE.MathUtils.randFloat(
        -52,
        52
      )
    );

    scene.add(coral);
  }

  // ------------------------------
  // SCATTERED SEAWEED
  // ------------------------------

  for (let i = 0; i < 35; i++) {
    const seaweed =
      createSeaweed(
        THREE.MathUtils.randFloat(
          -53,
          53
        ),
        THREE.MathUtils.randFloat(
          -53,
          53
        )
      );

    scene.add(seaweed);

    seaweedGroups.push(
      seaweed
    );
  }

  // ------------------------------
  // KELP FORESTS
  // ------------------------------

  const forestCount = 8;

  for (
    let forest = 0;
    forest < forestCount;
    forest++
  ) {
    const centerX =
      THREE.MathUtils.randFloat(
        -48,
        48
      );

    const centerZ =
      THREE.MathUtils.randFloat(
        -48,
        48
      );

    const forestRadius =
      THREE.MathUtils.randFloat(
        3,
        8
      );

    const patchCount =
      THREE.MathUtils.randInt(
        8,
        18
      );

    for (
      let i = 0;
      i < patchCount;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const distance =
        THREE.MathUtils.randFloat(
          0,
          forestRadius
        );

      const x =
        centerX +
        Math.cos(angle) *
          distance;

      const z =
        centerZ +
        Math.sin(angle) *
          distance;

      const seaweed =
        createSeaweed(
          x,
          z,
          true
        );

      scene.add(seaweed);

      seaweedGroups.push(
        seaweed
      );
    }
  }
}

// ==============================
// UPDATE SEAWEED
// ==============================

export function updateSeaweed(
  time: number
) {
  // Shared underwater current.
  const current =
    Math.sin(
      time * 0.0015
    ) * 0.12;

  for (const group of seaweedGroups) {
    for (const child of group.children) {
      const blade =
        child as THREE.Mesh;

      const offset =
        blade.userData.swayOffset;

      const amount =
        blade.userData.swayAmount;

      const speed =
        blade.userData.swaySpeed;

      const bladeHeight =
        blade.userData.height;

      const sway =
        (
          Math.sin(
            time *
              0.0015 *
              speed +
              offset
          ) *
            amount +
          current
        );

      const geometry =
        blade.geometry;

      const position =
        geometry.attributes.position;

      // Move the blade forward and backward.
      // The bottom remains anchored.
      for (
        let i = 0;
        i < position.count;
        i++
      ) {
        const y =
          position.getY(i);

        const height =
          THREE.MathUtils.clamp(
            y / bladeHeight,
            0,
            1
          );

        const originalZ =
          0;

        position.setZ(
          i,
          originalZ +
            sway * height
        );
      }

      position.needsUpdate = true;
    }
  }
}