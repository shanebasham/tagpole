import * as THREE from 'three';

export type RockCollider = {
  position: THREE.Vector3;
  radius: number;
  height: number;
};

type RockObject = {
  mesh: THREE.Mesh;
  collider: RockCollider;
};

// Keep track of the actual rock meshes so they can
// be completely removed when the world resets.
const rockObjects: RockObject[] = [];

// ==============================
// CREATE ROCK
// ==============================

function createRock(
  scene: THREE.Scene,
  x: number,
  z: number
): RockCollider {
  const rockGeometry =
    new THREE.DodecahedronGeometry(
      1,
      Math.random() > 0.5 ? 1 : 0
    );

  const rockMaterial =
    new THREE.MeshStandardMaterial({
      color: THREE.MathUtils.randInt(
        0x183b43,
        0x294950
      ),
      roughness: 1,
    });

  const rock =
    new THREE.Mesh(
      rockGeometry,
      rockMaterial
    );

  rock.name = 'Rock';

  const scale =
    THREE.MathUtils.randFloat(
      0.5,
      3.5
    );

  const width =
    THREE.MathUtils.randFloat(
      0.7,
      1.5
    );

  const height =
    THREE.MathUtils.randFloat(
      0.5,
      1.4
    );

  const depth =
    THREE.MathUtils.randFloat(
      0.7,
      1.5
    );

  rock.position.set(
    x,
    -15 +
      scale *
        height *
        0.4,
    z
  );

  rock.scale.set(
    scale * width,
    scale * height,
    scale * depth
  );

  rock.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  scene.add(rock);

  const collider: RockCollider = {
    position:
      rock.position.clone(),

    radius:
      scale *
      Math.max(
        width,
        depth
      ) *
      0.75,

    height:
      scale *
      height *
      1.5,
  };

  rockObjects.push({
    mesh: rock,
    collider,
  });

  return collider;
}

// ==============================
// CREATE ROCKS
// ==============================

export function createRocks(
  scene: THREE.Scene
): RockCollider[] {
  const rockColliders:
    RockCollider[] = [];

  // ============================
  // RANDOM ROCK AREAS
  // ============================

  const rockClusterCount =
    15;

  for (
    let cluster = 0;
    cluster < rockClusterCount;
    cluster++
  ) {
    const centerX =
      THREE.MathUtils.randFloat(
        -50,
        50
      );

    const centerZ =
      THREE.MathUtils.randFloat(
        -50,
        50
      );

    const clusterSize =
      THREE.MathUtils.randFloat(
        2,
        7
      );

    const rockCount =
      THREE.MathUtils.randInt(
        2,
        6
      );

    for (
      let i = 0;
      i < rockCount;
      i++
    ) {
      const angle =
        Math.random() *
        Math.PI *
        2;

      const distance =
        THREE.MathUtils.randFloat(
          0,
          clusterSize
        );

      const x =
        centerX +
        Math.cos(angle) *
          distance;

      const z =
        centerZ +
        Math.sin(angle) *
          distance;

      rockColliders.push(
        createRock(
          scene,
          x,
          z
        )
      );
    }
  }

  // ============================
  // RANDOM INDIVIDUAL ROCKS
  // ============================

  for (
    let i = 0;
    i < 20;
    i++
  ) {
    const x =
      THREE.MathUtils.randFloat(
        -52,
        52
      );

    const z =
      THREE.MathUtils.randFloat(
        -52,
        52
      );

    rockColliders.push(
      createRock(
        scene,
        x,
        z
      )
    );
  }

  return rockColliders;
}

// ==============================
// CLEAR ROCKS
// ==============================

export function clearRocks(): void {
  for (
    const rock of rockObjects
  ) {
    rock.mesh.removeFromParent();

    rock.mesh.geometry.dispose();

    const material =
      rock.mesh.material;

    if (Array.isArray(material)) {
      material.forEach((item) => {
        item.dispose();
      });
    } else if (material) {
      material.dispose();
    }
  }

  rockObjects.length = 0;
}