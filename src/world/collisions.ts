import * as THREE from 'three';
import type { RockCollider } from './rocks';

export function updateRockCollisions(
  camera: THREE.PerspectiveCamera,
  rockColliders: RockCollider[]
) {
  const playerRadius = 0.6;

  for (const rock of rockColliders) {
    const dx =
      camera.position.x -
      rock.position.x;

    const dz =
      camera.position.z -
      rock.position.z;

    const horizontalDistance =
      Math.sqrt(
        dx * dx +
        dz * dz
      );

    const verticalDistance =
      Math.abs(
        camera.position.y -
        rock.position.y
      );

    if (
      horizontalDistance <
        rock.radius + playerRadius &&
      verticalDistance <
        rock.height / 2 +
          playerRadius
    ) {
      const distance = Math.max(
        horizontalDistance,
        0.001
      );

      const pushX =
        dx / distance;

      const pushZ =
        dz / distance;

      camera.position.x =
        rock.position.x +
        pushX *
          (rock.radius + playerRadius);

      camera.position.z =
        rock.position.z +
        pushZ *
          (rock.radius + playerRadius);
    }
  }
}