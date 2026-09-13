import * as THREE from 'three';

import type {
  NetworkPlayer
} from '../../game/gameState';

export interface LocalTrapBubble {
  mesh: THREE.Mesh;
  startTime: number;
  endTime: number;
  startY: number;
}

export function createLocalTrapBubble(
  scene: THREE.Scene,
  player: NetworkPlayer
): LocalTrapBubble {

  const geometry =
    new THREE.SphereGeometry(
      1.8,
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

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position.set(
    player.x,
    player.y,
    player.z
  );

  scene.add(
    mesh
  );

  return {
    mesh,
    startTime:
      player.trappedAt ??
      Date.now(),
    endTime:
      player.trapEndAt ??
      Date.now() + 3000,
    startY:
      player.y,
  };
}

export function updateLocalTrapBubble(
  trap: LocalTrapBubble,
  position: THREE.Vector3,
  surfaceY: number = 30
): void {

  const now =
    Date.now();

  const duration =
    Math.max(
      1,
      trap.endTime -
      trap.startTime
    );

  const progress =
    THREE.MathUtils.clamp(
      (
        now -
        trap.startTime
      ) /
      duration,
      0,
      1
    );

  trap.mesh.position.x =
    position.x;

  trap.mesh.position.z =
    position.z;

  trap.mesh.position.y =
    THREE.MathUtils.lerp(
      trap.startY,
      surfaceY,
      progress
    );
}

export function clearLocalTrapBubble(
  trap: LocalTrapBubble | null
): void {

  if (!trap) {
    return;
  }

  trap.mesh.removeFromParent();

  trap.mesh.geometry.dispose();

  const material =
    trap.mesh.material;

  if (
    Array.isArray(material)
  ) {

    material.forEach(
      (item) => {
        item.dispose();
      }
    );

  } else {

    material.dispose();
  }
}