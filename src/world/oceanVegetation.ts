import * as THREE from 'three';

// ============================================================
// OCEAN VEGETATION
// ============================================================

// Root containing all vegetation so it can be removed cleanly
// when the world is reset.
let vegetationRoot:
  THREE.Group | null = null;

// All seaweed groups that receive the animated sway.
const seaweedGroups:
  THREE.Group[] = [];

// ============================================================
// SHARED MATERIALS
// ============================================================

// These materials are shared between many vegetation meshes.
// They intentionally are NOT disposed during world reset because
// they remain valid module-level materials for the next world.
const coralMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x31545a,
    roughness: 1,
  });

const coralDarkMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x243f45,
    roughness: 1,
  });

const seaweedMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x214d4c,
    roughness: 1,
    side: THREE.DoubleSide,
  });

const kelpMaterial =
  new THREE.MeshStandardMaterial({
    color: 0x1d4645,
    roughness: 1,
    side: THREE.DoubleSide,
  });

// ============================================================
// HELPERS
// ============================================================

function randomRange(
  min: number,
  max: number
): number {
  return THREE.MathUtils.randFloat(
    min,
    max
  );
}

// ============================================================
// CORAL
// ============================================================

function createCoral(
  parent: THREE.Object3D,
  position: THREE.Vector3
): void {
  const coral =
    new THREE.Group();

  coral.position.copy(
    position
  );

  coral.rotation.y =
    Math.random() *
    Math.PI *
    2;

  const branchCount =
    THREE.MathUtils.randInt(
      3,
      6
    );

  for (
    let i = 0;
    i < branchCount;
    i++
  ) {
    const height =
      randomRange(
        0.5,
        1.4
      );

    const radius =
      randomRange(
        0.08,
        0.18
      );

    const geometry =
      new THREE.CylinderGeometry(
        radius * 0.7,
        radius,
        height,
        5
      );

    const material =
      Math.random() > 0.35
        ? coralMaterial
        : coralDarkMaterial;

    const branch =
      new THREE.Mesh(
        geometry,
        material
      );

    const angle =
      (
        i /
        branchCount
      ) *
      Math.PI *
      2;

    const distance =
      randomRange(
        0.05,
        0.3
      );

    branch.position.x =
      Math.cos(angle) *
      distance;

    branch.position.z =
      Math.sin(angle) *
      distance;

    branch.position.y =
      height *
      0.5;

    branch.rotation.z =
      randomRange(
        -0.35,
        0.35
      );

    branch.rotation.x =
      randomRange(
        -0.35,
        0.35
      );

    coral.add(
      branch
    );
  }

  parent.add(
    coral
  );
}

// ============================================================
// SEAWEED BLADE
// ============================================================

function createSeaweedBlade(
  height: number,
  width: number
): THREE.Mesh {
  const geometry =
    new THREE.PlaneGeometry(
      width,
      height,
      1,
      6
    );

  // Move the geometry upward so the bottom remains anchored
  // to the ocean floor.
  const position =
    geometry.attributes.position;

  for (
    let i = 0;
    i < position.count;
    i++
  ) {
    const y =
      position.getY(i);

    position.setY(
      i,
      y +
        height *
        0.5
    );
  }

  geometry.computeVertexNormals();

  const blade =
    new THREE.Mesh(
      geometry,
      seaweedMaterial
    );

  return blade;
}

// ============================================================
// SEAWEED PATCH
// ============================================================

function createSeaweedPatch(
  parent: THREE.Object3D,
  position: THREE.Vector3
): void {
  const group =
    new THREE.Group();

  group.position.copy(
    position
  );

  group.userData.swayOffset =
    Math.random() *
    Math.PI *
    2;

  group.userData.swaySpeed =
    randomRange(
      0.65,
      1.05
    );

  const bladeCount =
    THREE.MathUtils.randInt(
      2,
      10
    );

  for (
    let i = 0;
    i < bladeCount;
    i++
  ) {
    const height =
      randomRange(
        0.5,
        8
      );

    const width =
      randomRange(
        0.2,
        0.8
      );

    const blade =
      createSeaweedBlade(
        height,
        width
      );

    const angle =
      Math.random() *
      Math.PI *
      2;

    const distance =
      randomRange(
        0,
        0.35
      );

    blade.position.x =
      Math.cos(angle) *
      distance;

    blade.position.z =
      Math.sin(angle) *
      distance;

    blade.rotation.y =
      angle;

    blade.userData.baseRotationZ =
      blade.rotation.z;

    blade.userData.swayAmount =
      randomRange(
        0.08,
        0.18
      );

    blade.userData.height =
      height;

    group.add(
      blade
    );
  }

  seaweedGroups.push(
    group
  );

  parent.add(
    group
  );
}

// ============================================================
// KELP BLADE
// ============================================================

function createKelpBlade(
  height: number
): THREE.Mesh {
  const width =
    randomRange(
      0.18,
      0.35
    );

  const geometry =
    new THREE.PlaneGeometry(
      width,
      height,
      1,
      8
    );

  const position =
    geometry.attributes.position;

  for (
    let i = 0;
    i < position.count;
    i++
  ) {
    const y =
      position.getY(i);

    position.setY(
      i,
      y +
        height *
        0.5
    );
  }

  geometry.computeVertexNormals();

  const blade =
    new THREE.Mesh(
      geometry,
      kelpMaterial
    );

  return blade;
}

// ============================================================
// KELP FOREST
// ============================================================

function createKelpForest(
  parent: THREE.Object3D,
  position: THREE.Vector3
): void {
  const group =
    new THREE.Group();

  group.position.copy(
    position
  );

  group.userData.swayOffset =
    Math.random() *
    Math.PI *
    2;

  group.userData.swaySpeed =
    randomRange(
      0.35,
      0.65
    );

  const stalkCount =
    THREE.MathUtils.randInt(
      2,
      20
    );

  for (
    let i = 0;
    i < stalkCount;
    i++
  ) {
    const height =
      randomRange(
        4,
        40
      );

    const blade =
      createKelpBlade(
        height
      );

    const angle =
      Math.random() *
      Math.PI *
      2;

    const distance =
      randomRange(
        0,
        1.2
      );

    blade.position.x =
      Math.cos(angle) *
      distance;

    blade.position.z =
      Math.sin(angle) *
      distance;

    blade.rotation.y =
      angle;

    blade.userData.swayAmount =
      randomRange(
        0.04,
        0.1
      );

    blade.userData.height =
      height;

    group.add(
      blade
    );
  }

  seaweedGroups.push(
    group
  );

  parent.add(
    group
  );
}

// ============================================================
// CREATE VEGETATION
// ============================================================

export function createOceanVegetation(
  scene: THREE.Scene
): void {
  // If vegetation already exists, remove it first.
  clearOceanVegetation();

  vegetationRoot =
    new THREE.Group();

  vegetationRoot.name =
    'OceanVegetation';

  // ==========================================================
  // CORAL
  // ==========================================================

  for (
    let i = 0;
    i < 45;
    i++
  ) {
    const position =
      new THREE.Vector3(
        randomRange(
          -54,
          54
        ),
        -15,
        randomRange(
          -54,
          54
        )
      );

    createCoral(
      vegetationRoot,
      position
    );
  }

  // ==========================================================
  // SEAWEED
  // ==========================================================

  for (
    let i = 0;
    i < 90;
    i++
  ) {
    const position =
      new THREE.Vector3(
        randomRange(
          -55,
          55
        ),
        -15,
        randomRange(
          -55,
          55
        )
      );

    createSeaweedPatch(
      vegetationRoot,
      position
    );
  }

  // ==========================================================
  // KELP FORESTS
  // ==========================================================

  for (
    let i = 0;
    i < 18;
    i++
  ) {
    const position =
      new THREE.Vector3(
        randomRange(
          -52,
          52
        ),
        -15,
        randomRange(
          -52,
          52
        )
      );

    createKelpForest(
      vegetationRoot,
      position
    );
  }

  scene.add(
    vegetationRoot
  );
}

// ============================================================
// SEAWEED / KELP ANIMATION
// ============================================================

export function updateSeaweed(
  time: number
): void {
  for (
    const group of seaweedGroups
  ) {
    const offset =
      group.userData.swayOffset ??
      0;

    const speed =
      group.userData.swaySpeed ??
      0.8;

    const groupSway =
      Math.sin(
        time *
          0.001 *
          speed +
          offset
      );

    for (
      const child of group.children
    ) {
      const blade =
        child as THREE.Mesh;

      const swayAmount =
        blade.userData.swayAmount ??
        0.1;

      const height =
        blade.userData.height ??
        1;

      if (
        !blade.geometry
      ) {
        continue;
      }

      const position =
        blade.geometry.attributes
          .position;

      for (
        let i = 0;
        i < position.count;
        i++
      ) {
        const y =
          position.getY(i);

        const normalizedHeight =
          THREE.MathUtils.clamp(
            y / height,
            0,
            1
          );

        const sway =
          groupSway *
          swayAmount *
          normalizedHeight;

        position.setX(
          i,
          position.getX(i)
        );

        position.setZ(
          i,
          Math.sin(
            time *
              0.001 *
              speed +
              offset +
              normalizedHeight
          ) *
          sway
        );
      }

      position.needsUpdate =
        true;
    }
  }
}

// ============================================================
// CLEAR VEGETATION
// ============================================================

export function clearOceanVegetation(): void {
  if (
    !vegetationRoot
  ) {
    seaweedGroups.length = 0;
    return;
  }

  vegetationRoot.traverse(
    (object) => {
      const mesh =
        object as THREE.Mesh;

      if (
        mesh.geometry
      ) {
        mesh.geometry.dispose();
      }

      // DO NOT dispose the shared vegetation materials here.
      // They are reused when the next world is created.
    }
  );

  vegetationRoot.removeFromParent();

  vegetationRoot = null;

  seaweedGroups.length = 0;
}