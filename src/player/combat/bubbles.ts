import * as THREE from 'three';

// ==============================
// COMBAT TARGET
// ==============================

export interface CombatTarget {
  getPosition(): THREE.Vector3;

  isAlive(): boolean;

  isTrapped(): boolean;

  trap(
    bubble: THREE.Mesh
  ): boolean;

  updateTrappedPosition(
    position: THREE.Vector3
  ): void;

  onBubbleReachedSurface(): void;
}

// ==============================
// PROJECTILE
// ==============================

type SmallBubble = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
};

// ==============================
// BUBBLE POP
// ==============================

type BubblePop = {
  life: number;
  maxLife: number;
  mesh: THREE.Group;
};

// ==============================
// BUBBLES
// ==============================

export class Bubbles {

  private surfaceY = 30;

  private bubbleRiseSpeed = 2.0;

  private bubblePopHeight = 2.5;

  private smallBubbleSpeed = 7.0;

  private targetHitRadius = 0.45;

  private smallBubbles:
    SmallBubble[] = [];

  private bubblePops:
    BubblePop[] = [];

  private targets:
    CombatTarget[] = [];

  private trappingBubble:
    THREE.Mesh | null = null;

  private trappedTarget:
    CombatTarget | null = null;

  // ==============================
  // TARGETS
  // ==============================

  setTargets(
    targets: CombatTarget[]
  ) {
    this.targets =
      targets;
  }

  // ==============================
  // BUBBLE MATERIAL
  // ==============================

  private createBubbleMaterial(
    opacity: number
  ) {
    return new THREE.MeshPhysicalMaterial({
      color: 0xbceff4,

      transparent: true,

      opacity,

      roughness: 0.05,

      metalness: 0,

      transmission: 0.45,

      thickness: 0.08,

      ior: 1.33,

      clearcoat: 1,

      clearcoatRoughness: 0.05,

      side: THREE.DoubleSide,

      depthWrite: false,
    });
  }

  // ==============================
  // FIRE BUBBLE
  // ==============================

  fire(
    scene: THREE.Scene,
    position: THREE.Vector3,
    direction: THREE.Vector3
  ) {
    const radius =
      THREE.MathUtils.randFloat(
        0.08,
        0.22
      );

    const geometry =
      new THREE.SphereGeometry(
        radius,
        24,
        16
      );

    const material =
      this.createBubbleMaterial(
        THREE.MathUtils.randFloat(
          0.1,
          0.2
        )
      );

    const bubble =
      new THREE.Mesh(
        geometry,
        material
      );

    bubble.position.copy(
      position
    );

    const velocity =
      direction
        .clone()
        .normalize();

    velocity.x +=
      THREE.MathUtils.randFloat(
        -0.035,
        0.035
      );

    velocity.y +=
      THREE.MathUtils.randFloat(
        -0.035,
        0.035
      );

    velocity.z +=
      THREE.MathUtils.randFloat(
        -0.035,
        0.035
      );

    velocity.normalize();

    velocity.multiplyScalar(
      this.smallBubbleSpeed
    );

    scene.add(
      bubble
    );

    this.smallBubbles.push({
      mesh: bubble,
      velocity,
    });
  }

  // ==============================
  // FIRE FROM OBJECT
  // ==============================

  fireFromObject(
  scene: THREE.Scene,
  object: THREE.Object3D,
  aimPosition:
    THREE.Vector3 | null = null
) {
  const forward =
    new THREE.Vector3(
      0,
      0,
      -1
    );

  forward.applyQuaternion(
    object.quaternion
  );

  forward.normalize();

  const position =
    object.position.clone();

  position.addScaledVector(
    forward,
    THREE.MathUtils.randFloat(
      1.0,
      1.8
    )
  );

  let direction =
    forward.clone();

  // AI:
  // aim directly toward player.
  if (
    aimPosition
  ) {
    direction =
      new THREE.Vector3()
        .subVectors(
          aimPosition,
          position
        )
        .normalize();
  }

  this.fire(
    scene,
    position,
    direction
  );
}

  // ==============================
  // CREATE TRAPPING BUBBLE
  // ==============================

  private createTrappingBubble(
    scene: THREE.Scene,
    target: CombatTarget,
    position: THREE.Vector3
  ) {
    if (
      this.trappingBubble ||
      this.trappedTarget
    ) {
      return false;
    }

    const geometry =
      new THREE.SphereGeometry(
        1.8,
        48,
        32
      );

    const material =
      this.createBubbleMaterial(
        0.22
      );

    const bubble =
      new THREE.Mesh(
        geometry,
        material
      );

    bubble.position.copy(
      position
    );

    scene.add(
      bubble
    );

    const trapped =
      target.trap(
        bubble
      );

    if (
      !trapped
    ) {
      scene.remove(
        bubble
      );

      bubble.geometry.dispose();

      (
        bubble.material as
          THREE.Material
      ).dispose();

      return false;
    }

    this.trappingBubble =
      bubble;

    this.trappedTarget =
      target;

    return true;
  }

  // ==============================
  // BUBBLE POP
  // ==============================

  private createBubblePop(
    scene: THREE.Scene,
    position: THREE.Vector3,
    size: number
  ) {
    const group =
      new THREE.Group();

    group.position.copy(
      position
    );

    const fragmentCount = 7;

    for (
      let i = 0;
      i < fragmentCount;
      i++
    ) {
      const fragmentGeometry =
        new THREE.SphereGeometry(
          THREE.MathUtils.randFloat(
            0.025,
            0.08
          ),
          10,
          8
        );

      const fragmentMaterial =
        new THREE.MeshBasicMaterial({
          color: 0xc8f7fa,
          transparent: true,
          opacity: 0.38,
          depthWrite: false,
        });

      const fragment =
        new THREE.Mesh(
          fragmentGeometry,
          fragmentMaterial
        );

      const direction =
        new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(
            2
          ),
          THREE.MathUtils.randFloat(
            0.3,
            1.8
          ),
          THREE.MathUtils.randFloatSpread(
            2
          )
        ).normalize();

      fragment.position
        .copy(direction)
        .multiplyScalar(
          size *
            THREE.MathUtils.randFloat(
              0.2,
              0.5
            )
        );

      fragment.userData.velocity =
        direction.multiplyScalar(
          THREE.MathUtils.randFloat(
            0.3,
            1.2
          )
        );

      group.add(
        fragment
      );
    }

    scene.add(
      group
    );

    this.bubblePops.push({
      life: 0.45,

      maxLife: 0.45,

      mesh: group,
    });
  }

  // ==============================
  // UPDATE SMALL BUBBLES
  // ==============================

  private updateSmallBubbles(
    delta: number,
    scene: THREE.Scene,
    time: number
  ) {
    for (
      let i =
        this.smallBubbles.length - 1;
      i >= 0;
      i--
    ) {
      const bubble =
        this.smallBubbles[i];

      bubble.mesh.position.addScaledVector(
        bubble.velocity,
        delta
      );

      bubble.mesh.position.x +=
        Math.sin(
          time * 4 + i
        ) *
        0.025 *
        delta;

      bubble.mesh.position.z +=
        Math.cos(
          time * 3 + i
        ) *
        0.025 *
        delta;

      bubble.mesh.scale.multiplyScalar(
        1 +
          delta * 0.08
      );

      // ==========================
      // TARGET COLLISION
      // ==========================

      let hitTarget:
        CombatTarget | null =
        null;

      let closestDistance =
        Infinity;

      for (
        const target of
        this.targets
      ) {
        if (
          !target.isAlive() ||
          target.isTrapped()
        ) {
          continue;
        }

        const distance =
          bubble.mesh.position.distanceTo(
            target.getPosition()
          );

        const geometry =
          bubble.mesh.geometry;

        geometry.computeBoundingSphere();

        const bubbleRadius =
          geometry.boundingSphere
            ? geometry
                .boundingSphere
                .radius *
              bubble.mesh.scale.x
            : 0.15;

        const hitDistance =
          bubbleRadius +
          this.targetHitRadius;

        if (
          distance <=
            hitDistance &&
          distance <
            closestDistance
        ) {
          closestDistance =
            distance;

          hitTarget =
            target;
        }
      }

      // ==========================
      // TRAP TARGET
      // ==========================

      if (
        hitTarget
      ) {
        const hitPosition =
          hitTarget
            .getPosition()
            .clone();

        const trapped =
          this.createTrappingBubble(
            scene,
            hitTarget,
            hitPosition
          );

        if (
          trapped
        ) {
          this.removeProjectile(
            scene,
            bubble
          );

          this.smallBubbles.splice(
            i,
            1
          );

          continue;
        }
      }

      // ==========================
      // REACH SURFACE
      // ==========================

      if (
        bubble.mesh.position.y >=
        this.surfaceY
      ) {
        this.createBubblePop(
          scene,
          bubble.mesh.position,
          bubble.mesh.scale.x
        );

        this.removeProjectile(
          scene,
          bubble
        );

        this.smallBubbles.splice(
          i,
          1
        );
      }
    }
  }

  // ==============================
  // REMOVE PROJECTILE
  // ==============================

  private removeProjectile(
    scene: THREE.Scene,
    bubble: SmallBubble
  ) {
    scene.remove(
      bubble.mesh
    );

    bubble.mesh.geometry.dispose();

    (
      bubble.mesh.material as
        THREE.Material
    ).dispose();
  }

  // ==============================
  // UPDATE TRAPPING BUBBLE
  // ==============================

  private updateTrappingBubble(
  delta: number,
  scene: THREE.Scene,
  time: number
) {
  if (
    !this.trappingBubble ||
    !this.trappedTarget
  ) {
    return;
  }

  this.trappingBubble.position.y +=
    this.bubbleRiseSpeed *
    delta;

  this.trappingBubble.position.x +=
    Math.sin(
      time * 1.5
    ) *
    0.15 *
    delta;

  this.trappingBubble.position.z +=
    Math.cos(
      time * 1.2
    ) *
    0.15 *
    delta;

  this.trappedTarget.updateTrappedPosition(
    this.trappingBubble.position
  );

  const popY =
    this.surfaceY +
    this.bubblePopHeight -
    1.5;

  if (
    this.trappingBubble.position.y >=
    popY
  ) {
    this.trappingBubble.position.y =
      popY;

    this.trappedTarget.updateTrappedPosition(
      this.trappingBubble.position
    );

    this.createBubblePop(
      scene,
      this.trappingBubble.position,
      1.5
    );

    scene.remove(
      this.trappingBubble
    );

    this.trappingBubble.geometry.dispose();

    (
      this.trappingBubble.material as
        THREE.Material
    ).dispose();

    const target =
      this.trappedTarget;

    this.trappingBubble =
      null;

    this.trappedTarget =
      null;

    target.onBubbleReachedSurface();
  }
}

  // ==============================
  // UPDATE POPS
  // ==============================

  private updateBubblePops(
    delta: number,
    scene: THREE.Scene
  ) {
    for (
      let i =
        this.bubblePops.length - 1;
      i >= 0;
      i--
    ) {
      const pop =
        this.bubblePops[i];

      pop.life -=
        delta;

      const progress =
        1 -
        pop.life /
          pop.maxLife;

      for (
        const fragment of
          pop.mesh.children
      ) {
        const mesh =
          fragment as THREE.Mesh;

        const velocity =
          mesh.userData
            .velocity as
            THREE.Vector3;

        mesh.position.addScaledVector(
          velocity,
          delta
        );

        velocity.y -=
          0.8 *
          delta;

        mesh.scale.setScalar(
          1 +
            progress * 1.5
        );

        const material =
          mesh.material as
            THREE.MeshBasicMaterial;

        material.opacity =
          Math.max(
            0,
            0.65 *
              (1 - progress)
          );
      }

      pop.mesh.scale.setScalar(
        1 +
          progress * 0.5
      );

      if (
        pop.life <= 0
      ) {
        scene.remove(
          pop.mesh
        );

        for (
          const fragment of
            pop.mesh.children
        ) {
          const mesh =
            fragment as THREE.Mesh;

          mesh.geometry.dispose();

          (
            mesh.material as
              THREE.Material
          ).dispose();
        }

        this.bubblePops.splice(
          i,
          1
        );
      }
    }
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    delta: number,
    scene: THREE.Scene,
    time: number
  ) {
    this.updateSmallBubbles(
      delta,
      scene,
      time
    );

    this.updateTrappingBubble(
      delta,
      scene,
      time
    );

    this.updateBubblePops(
      delta,
      scene
    );
  }

  // ==============================
  // STATE
  // ==============================

  get isTrapping() {
    return (
      this.trappedTarget !== null
    );
  }

  get bubble() {
    return this.trappingBubble;
  }

  // ==============================
  // RESET
  // ==============================

  reset(
    scene: THREE.Scene
  ) {
    for (
      const bubble of
        this.smallBubbles
    ) {
      this.removeProjectile(
        scene,
        bubble
      );
    }

    this.smallBubbles = [];

    if (
      this.trappingBubble
    ) {
      scene.remove(
        this.trappingBubble
      );

      this.trappingBubble.geometry.dispose();

      (
        this.trappingBubble.material as
          THREE.Material
      ).dispose();

      this.trappingBubble =
        null;
    }

    for (
      const pop of
        this.bubblePops
    ) {
      scene.remove(
        pop.mesh
      );

      for (
        const fragment of
          pop.mesh.children
      ) {
        const mesh =
          fragment as THREE.Mesh;

        mesh.geometry.dispose();

        (
          mesh.material as
            THREE.Material
        ).dispose();
      }
    }

    this.bubblePops = [];

    this.trappedTarget =
      null;
  }
}