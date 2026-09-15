import * as THREE from 'three';

export interface CombatTarget {

  getPosition():
    THREE.Vector3;

  isAlive():
    boolean;

  isTrapped():
    boolean;

  trap(
    bubble: THREE.Mesh
  ):
    boolean;

  updateTrappedPosition(
    position: THREE.Vector3
  ):
    void;

  onBubbleReachedSurface():
    void;
}

type SmallBubble = {

  mesh:
    THREE.Mesh;

  velocity:
    THREE.Vector3;

  visualOnly:
    boolean;
};

export class Bubbles {

  private readonly surfaceY =
    30;

  private readonly bubbleRiseSpeed =
    2.0;

  private readonly bubblePopHeight =
    2.5;

  private readonly smallBubbleSpeed =
    7.0;

  private readonly targetHitRadius =
    0.45;

  private readonly smallBubbles:
    SmallBubble[] = [];

  private readonly trappingBubbles:
    Array<{
      mesh: THREE.Mesh;
      target: CombatTarget;
    }> = [];

  private readonly bubblePops:
    Array<{
      mesh: THREE.Mesh;
      time: number;
      duration: number;
    }> = [];

  private targets:
    CombatTarget[] = [];

  setTargets(
    targets: CombatTarget[]
  ): void {

    this.targets =
      targets;
  }

  get bubble():
    THREE.Mesh | null {

    return this.trappingBubbles.length > 0
      ? this.trappingBubbles[0].mesh
      : null;
  }

  // ==============================
  // SMALL BUBBLES
  // ==============================

  fire(
    scene: THREE.Scene,
    position: THREE.Vector3,
    direction: THREE.Vector3
  ): {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
  } {

    const radius =
      THREE.MathUtils.randFloat(
        0.06,
        0.12
      );

    const geometry =
      new THREE.SphereGeometry(
        radius,
        10,
        8
      );

    const material =
      new THREE.MeshPhysicalMaterial({
        transparent: true,
        opacity: 0.5,
        roughness: 0,
        metalness: 0,
        transmission: 0.9,
        thickness: 0.05,
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    const spawnPosition =
      position.clone();

    mesh.position.copy(
      spawnPosition
    );

    const velocity =
      direction.clone();

    velocity.x +=
      THREE.MathUtils.randFloat(
        -0.12,
        0.12
      );

    velocity.y +=
      THREE.MathUtils.randFloat(
        -0.12,
        0.12
      );

    velocity.z +=
      THREE.MathUtils.randFloat(
        -0.12,
        0.12
      );

    velocity
      .normalize()
      .multiplyScalar(
        this.smallBubbleSpeed
      );

    scene.add(
      mesh
    );

    this.smallBubbles.push({
      mesh,
      velocity,
      visualOnly: false,
    });

    return {
      position:
        spawnPosition,

      velocity:
        velocity.clone(),
    };
  }

  fireRemote(
    scene: THREE.Scene,
    position: THREE.Vector3,
    velocity: THREE.Vector3
  ): void {

    const radius =
      THREE.MathUtils.randFloat(
        0.06,
        0.12
      );

    const geometry =
      new THREE.SphereGeometry(
        radius,
        10,
        8
      );

    const material =
      new THREE.MeshPhysicalMaterial({
        transparent: true,
        opacity: 0.5,
        roughness: 0,
        metalness: 0,
        transmission: 0.9,
        thickness: 0.05,
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.position.copy(
      position
    );

    scene.add(
      mesh
    );

    this.smallBubbles.push({
      mesh,
      velocity:
        velocity.clone(),
      visualOnly: true,
    });
  }

  fireFromObject(
    scene: THREE.Scene,
    object: THREE.Object3D,
    aimPosition:
      THREE.Vector3 | null = null
  ): {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
  } {

    const direction =
      new THREE.Vector3(
        0,
        0,
        -1
      );

    direction.applyQuaternion(
      object.quaternion
    );

    direction.normalize();

    if (
      aimPosition
    ) {

      direction.subVectors(
        aimPosition,
        object.position
      );

      direction.normalize();
    }

    const spawnPosition =
      object.position.clone();

    spawnPosition.add(
      direction
        .clone()
        .multiplyScalar(
          0.35
        )
    );

    return this.fire(
      scene,
      spawnPosition,
      direction
    );
  }

  // ==============================
  // TRAPPING BUBBLE
  // ==============================

  createTrappingBubble(
    scene: THREE.Scene,
    target: CombatTarget
  ): THREE.Mesh {

    const geometry =
      new THREE.SphereGeometry(
        2,
        24,
        16
      );

    const material =
      new THREE.MeshPhysicalMaterial({
        transparent: true,
        opacity: 0.22,
        roughness: 0,
        metalness: 0,
        transmission: 0.85,
        thickness: 0.2,
      });

    const bubble =
      new THREE.Mesh(
        geometry,
        material
      );

    /*
    * The player model handles its visual
    * offset relative to this bubble.
    */
    bubble.position.copy(
      target.getPosition()
    );

    scene.add(
      bubble
    );

    this.trappingBubbles.push({
      mesh:
        bubble,

      target:
        target,
    });

    return bubble;
  }

  // ==============================
  // UPDATE SMALL BUBBLES
  // ==============================

  private updateSmallBubbles(
    delta: number,
    scene: THREE.Scene
  ): void {

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

      if (
        !bubble.visualOnly
      ) {

        let hit =
          false;

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

          if (
            distance <=
            this.targetHitRadius
          ) {

            const trappingBubble =
              this.createTrappingBubble(
                scene,
                target
              );

            if (
              target.trap(
                trappingBubble
              )
            ) {

              this.removeProjectile(
                i
              );

              hit =
                true;

              break;
            }

            trappingBubble.removeFromParent();

            trappingBubble.geometry.dispose();

            const material =
              trappingBubble.material;

            if (
              Array.isArray(
                material
              )
            ) {

              material.forEach(
                item =>
                  item.dispose()
              );

            } else {

              material.dispose();
            }
          }
        }

        if (
          hit
        ) {
          continue;
        }
      }

      if (
        bubble.mesh.position.y >=
        this.surfaceY
      ) {

        this.createBubblePop(
          scene,
          bubble.mesh.position
        );

        this.removeProjectile(
          i
        );
      }
    }
  }

  // ==============================
  // UPDATE TRAPPING BUBBLES
  // ==============================

  private updateTrappingBubbles(
    delta: number,
    scene: THREE.Scene,
    _time: number
  ): void {

    for (
      let i =
        this.trappingBubbles.length - 1;
      i >= 0;
      i--
    ) {

      const bubble =
        this.trappingBubbles[i];

      if (
        !bubble.target.isAlive()
      ) {

        this.removeTrappingBubble(
          i
        );

        continue;
      }

      bubble.mesh.position.y +=
        this.bubbleRiseSpeed *
        delta;

      bubble.target.updateTrappedPosition(
        bubble.mesh.position
      );

      if (
        bubble.mesh.position.y >=
        this.surfaceY +
        this.bubblePopHeight
      ) {

        bubble.target.onBubbleReachedSurface();

        this.createBubblePop(
          scene,
          bubble.mesh.position
        );

        this.removeTrappingBubble(
          i
        );
      }
    }
  }

  // ==============================
  // BUBBLE POP
  // ==============================

  private createBubblePop(
    scene: THREE.Scene,
    position: THREE.Vector3
  ): void {

    const geometry =
      new THREE.SphereGeometry(
        0.3,
        12,
        8
      );

    const material =
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.45,
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      );

    mesh.position.copy(
      position
    );

    scene.add(
      mesh
    );

    this.bubblePops.push({
      mesh,
      time: 0,
      duration: 0.25,
    });
  }

  // ==============================
  // REMOVE PROJECTILE
  // ==============================

  private removeProjectile(
    index: number
  ): void {

    const bubble =
      this.smallBubbles[index];

    if (
      !bubble
    ) {
      return;
    }

    bubble.mesh.removeFromParent();

    bubble.mesh.geometry.dispose();

    const material =
      bubble.mesh.material;

    if (
      Array.isArray(material)
    ) {

      material.forEach(
        item =>
          item.dispose()
      );

    } else {

      material.dispose();
    }

    this.smallBubbles.splice(
      index,
      1
    );
  }

  // ==============================
  // REMOVE TRAPPING BUBBLE
  // ==============================

  private removeTrappingBubble(
    index: number
  ): void {

    const bubble =
      this.trappingBubbles[index];

    if (
      !bubble
    ) {
      return;
    }

    bubble.mesh.removeFromParent();

    bubble.mesh.geometry.dispose();

    const material =
      bubble.mesh.material;

    if (
      Array.isArray(material)
    ) {

      material.forEach(
        item =>
          item.dispose()
      );

    } else {

      material.dispose();
    }

    this.trappingBubbles.splice(
      index,
      1
    );
  }

  // ==============================
  // UPDATE POPS
  // ==============================

  private updateBubblePops(
    delta: number
  ): void {

    for (
      let i =
        this.bubblePops.length - 1;
      i >= 0;
      i--
    ) {

      const pop =
        this.bubblePops[i];

      pop.time +=
        delta;

      const progress =
        pop.time /
        pop.duration;

      pop.mesh.scale.setScalar(
        1 +
        progress * 2
      );

      const material =
        pop.mesh.material;

      if (
        !Array.isArray(material)
      ) {

        material.opacity =
          0.45 *
          (1 - progress);
      }

      if (
        progress >= 1
      ) {

        pop.mesh.removeFromParent();

        pop.mesh.geometry.dispose();

        if (
          !Array.isArray(material)
        ) {

          material.dispose();

        } else {

          material.forEach(
            item =>
              item.dispose()
          );
        }

        this.bubblePops.splice(
          i,
          1
        );
      }
    }
  }

  // ==============================
  // MAIN UPDATE
  // ==============================

  update(
    delta: number,
    scene: THREE.Scene,
    time: number
  ): void {

    this.updateSmallBubbles(
      delta,
      scene
    );

    this.updateTrappingBubbles(
      delta,
      scene,
      time
    );

    this.updateBubblePops(
      delta
    );
  }

  // ==============================
  // CLEAR PROJECTILES
  // ==============================

  clearProjectiles(
    _scene?: THREE.Scene
  ): void {

    for (
      const bubble of
        this.smallBubbles
    ) {

      bubble.mesh.removeFromParent();

      bubble.mesh.geometry.dispose();

      const material =
        bubble.mesh.material;

      if (
        Array.isArray(material)
      ) {

        material.forEach(
          item =>
            item.dispose()
        );

      } else {

        material.dispose();
      }
    }

    this.smallBubbles.length =
      0;
  }

  // ==============================
  // RESET
  // ==============================

  reset(
    _scene?: THREE.Scene
  ): void {

    this.clearProjectiles();

    for (
      let i =
        this.trappingBubbles.length - 1;
      i >= 0;
      i--
    ) {

      this.removeTrappingBubble(
        i
      );
    }

    for (
      let i =
        this.bubblePops.length - 1;
      i >= 0;
      i--
    ) {

      const pop =
        this.bubblePops[i];

      pop.mesh.removeFromParent();

      pop.mesh.geometry.dispose();

      const material =
        pop.mesh.material;

      if (
        Array.isArray(material)
      ) {

        material.forEach(
          item =>
            item.dispose()
        );

      } else {

        material.dispose();
      }

      this.bubblePops.splice(
        i,
        1
      );
    }
  }
}