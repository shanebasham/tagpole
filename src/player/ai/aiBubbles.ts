import * as THREE from 'three';

type SmallBubble = {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
};

type BubblePop = {
  position: THREE.Vector3;
  life: number;
  maxLife: number;
  mesh: THREE.Group;
};

export class AIBubbles {
  private surfaceY = 30;

  // Speed of the main trapping bubble.
  private bubbleRiseSpeed = 2.0;

  // How far above the surface
  // the trapped player rises.
  private bubblePopHeight = 2.5;

  // Projectile bubble speed.
  private smallBubbleSpeed = 7.0;

  // How close the projectile needs
  // to get before it counts as a hit.
  private playerHitRadius = 0.45;

  private smallBubbles: SmallBubble[] = [];
  private bubblePops: BubblePop[] = [];

  private bubbleSpawnTimer = 0;
  private bubbleSpawnInterval = 0.12;

  private target: THREE.PerspectiveCamera;

  private onPlayerTrapped:
    (bubble: THREE.Mesh) => void;

  private onPlayerDied:
    () => void;

  bubble: THREE.Mesh | null = null;

  isPlayerTrapped = false;

  constructor(
    target: THREE.PerspectiveCamera,
    onPlayerTrapped: (
      bubble: THREE.Mesh
    ) => void,
    onPlayerDied: () => void
  ) {
    this.target = target;

    this.onPlayerTrapped =
      onPlayerTrapped;

    this.onPlayerDied =
      onPlayerDied;
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
  // CREATE MAIN BUBBLE
  // ==============================

  createBubble(
    scene: THREE.Scene,
    position: THREE.Vector3
  ) {
    if (this.bubble) {
      return;
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

    this.bubble =
      new THREE.Mesh(
        geometry,
        material
      );

    this.bubble.position.copy(
      position
    );

    scene.add(
      this.bubble
    );

    this.isPlayerTrapped =
      true;

    this.onPlayerTrapped(
      this.bubble
    );
  }

  // ==============================
  // CREATE ATTACK BUBBLE
  // ==============================

  createSmallBubble(
    scene: THREE.Scene,
    model: THREE.Group,
    time: number
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

    // ==============================
    // SPAWN POSITION
    // ==============================

    const forward =
      new THREE.Vector3(
        0,
        0,
        -1
      );

    forward.applyQuaternion(
      model.quaternion
    );

    const side =
      new THREE.Vector3(
        1,
        0,
        0
      );

    side.applyQuaternion(
      model.quaternion
    );

    bubble.position.copy(
      model.position
    );

    // Shoot from farther in front
    // of the AI's mouth.
    bubble.position.addScaledVector(
      forward,
      THREE.MathUtils.randFloat(
        1.0,
        1.8
      )
    );

    // Small horizontal variation.
    bubble.position.addScaledVector(
      side,
      THREE.MathUtils.randFloat(
        -0.2,
        0.2
      )
    );

    bubble.position.y +=
      THREE.MathUtils.randFloat(
        -0.1,
        0.2
      );

    // ==============================
    // AIM DIRECTLY AT PLAYER
    // ==============================

    const direction =
      new THREE.Vector3()
        .subVectors(
          this.target.position,
          bubble.position
        );

    if (
      direction.lengthSq() <
      0.001
    ) {
      direction.set(
        0,
        0,
        -1
      );
    }

    direction.normalize();

    // Slight random spread.
    direction.x +=
      THREE.MathUtils.randFloat(
        -0.035,
        0.035
      );

    direction.y +=
      THREE.MathUtils.randFloat(
        -0.035,
        0.035
      );

    direction.z +=
      THREE.MathUtils.randFloat(
        -0.035,
        0.035
      );

    direction.normalize();

    const velocity =
      direction.multiplyScalar(
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
  // BUBBLE POP
  // ==============================

  createBubblePop(
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
      position:
        position.clone(),

      life: 0.45,

      maxLife: 0.45,

      mesh: group,
    });
  }

  // ==============================
  // UPDATE ATTACK BUBBLES
  // ==============================

  private updateSmallBubbles(
    delta: number,
    scene: THREE.Scene,
    zigzagTime: number
  ) {
    for (
      let i =
        this.smallBubbles.length -
        1;
      i >= 0;
      i--
    ) {
      const bubble =
        this.smallBubbles[i];

      // ==============================
      // MOVE PROJECTILE
      // ==============================

      bubble.mesh.position.addScaledVector(
        bubble.velocity,
        delta
      );

      // Slight wobble.
      bubble.mesh.position.x +=
        Math.sin(
          zigzagTime * 4 + i
        ) *
        0.025 *
        delta;

      bubble.mesh.position.z +=
        Math.cos(
          zigzagTime * 3 + i
        ) *
        0.025 *
        delta;

      // Slowly expand.
      bubble.mesh.scale.multiplyScalar(
        1 +
          delta * 0.08
      );

      // ==============================
      // CHECK PLAYER HIT
      // ==============================

      const distance =
        bubble.mesh.position.distanceTo(
          this.target.position
        );

      const bubbleRadius =
        bubble.mesh.geometry.boundingSphere
          ? bubble.mesh.geometry
              .boundingSphere.radius *
            bubble.mesh.scale.x
          : 0.15;

      const hitDistance =
        bubbleRadius +
        this.playerHitRadius;

      if (
        distance <=
        hitDistance
      ) {
        // The projectile actually
        // touched the player.
        //
        // NOW create the large
        // trapping bubble.
        const hitPosition =
          this.target.position.clone();

        this.createBubble(
          scene,
          hitPosition
        );

        // Remove the projectile.
        scene.remove(
          bubble.mesh
        );

        bubble.mesh.geometry.dispose();

        (
          bubble.mesh.material as
            THREE.Material
        ).dispose();

        this.smallBubbles.splice(
          i,
          1
        );

        continue;
      }

      // ==============================
      // MISSED BUBBLE
      // ==============================
      //
      // It continues traveling until
      // it reaches the surface.
      //

      if (
        bubble.mesh.position.y >=
        this.surfaceY
      ) {
        this.createBubblePop(
          scene,
          bubble.mesh.position,
          bubble.mesh.scale.x
        );

        scene.remove(
          bubble.mesh
        );

        bubble.mesh.geometry.dispose();

        (
          bubble.mesh.material as
            THREE.Material
        ).dispose();

        this.smallBubbles.splice(
          i,
          1
        );
      }
    }
  }

  // ==============================
  // UPDATE POP EFFECTS
  // ==============================

  private updateBubblePops(
    delta: number,
    scene: THREE.Scene
  ) {
    for (
      let i =
        this.bubblePops.length -
        1;
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
          0.8 * delta;

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
  // UPDATE MAIN BUBBLE
  // ==============================

  private updateMainBubble(
    delta: number,
    scene: THREE.Scene,
    zigzagTime: number
  ) {
    if (
      !this.isPlayerTrapped ||
      !this.bubble
    ) {
      return false;
    }

    // Main trapping bubble rises
    // at 2 meters per second.
    this.bubble.position.y +=
      this.bubbleRiseSpeed *
      delta;

    const bubbleRadius = 1.8;

    // Allow the bubble to rise
    // above the surface.
    const bubblePopY =
      this.surfaceY +
      this.bubblePopHeight -
      bubbleRadius;

    if (
      this.bubble.position.y >=
      bubblePopY
    ) {
      this.bubble.position.y =
        bubblePopY;

      this.createBubblePop(
        scene,
        this.bubble.position,
        bubbleRadius
      );

      scene.remove(
        this.bubble
      );

      const bubbleMesh =
        this.bubble as THREE.Mesh;

      bubbleMesh.geometry.dispose();

      (
        bubbleMesh.material as
          THREE.Material
      ).dispose();

      this.bubble = null;

      this.isPlayerTrapped =
        false;

      this.onPlayerDied();

      return true;
    }

    // Gentle sideways movement.
    this.bubble.position.x +=
      Math.sin(
        zigzagTime * 1.5
      ) *
      0.15 *
      delta;

    this.bubble.position.z +=
      Math.cos(
        zigzagTime * 1.2
      ) *
      0.15 *
      delta;

    return false;
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    delta: number,
    scene: THREE.Scene,
    zigzagTime: number
  ) {
    this.updateSmallBubbles(
      delta,
      scene,
      zigzagTime
    );

    this.updateBubblePops(
      delta,
      scene
    );

    return this.updateMainBubble(
      delta,
      scene,
      zigzagTime
    );
  }

  // ==============================
  // RESET
  // ==============================

  reset() {
    this.bubble = null;

    this.isPlayerTrapped =
      false;

    this.smallBubbles = [];

    this.bubblePops = [];

    this.bubbleSpawnTimer = 0;
  }
}