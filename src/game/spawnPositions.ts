import * as THREE from 'three';

// ==============================
// SPAWN SETTINGS
// ==============================

export const MAX_SPAWN_POSITIONS = 12;

const SPAWN_RADIUS = 30;
const SPAWN_Y = -10;

// ==============================
// CLOCK SPAWN POSITIONS
// ==============================
//
//        12
//         |
//    11   |   1
//      \  |  /
//   10   \|/   2
//  9 ----+---- 3
//    8  /|\  4
//      / | \
//    7   |   5
//        |
//        6
//
// Index 0 = 12 o'clock
// Index 1 = 1 o'clock
// ...
// Index 11 = 11 o'clock
//
// All positions are evenly spaced around
// the same circle.

export const SPAWN_POSITIONS: THREE.Vector3[] =
  Array.from(
    {
      length: MAX_SPAWN_POSITIONS,
    },
    (_, index) => {

      const angle =
        (index / MAX_SPAWN_POSITIONS) *
        Math.PI *
        2;

      return new THREE.Vector3(
        Math.sin(angle) *
          SPAWN_RADIUS,

        SPAWN_Y,

        -Math.cos(angle) *
          SPAWN_RADIUS
      );
    }
  );

// ==============================
// RANDOM SPAWN POSITIONS
// ==============================

export function getRandomSpawnPositions(
  count: number
): THREE.Vector3[] {

  const shuffled =
    SPAWN_POSITIONS.map(
      position =>
        position.clone()
    );

  // Fisher-Yates shuffle
  for (
    let i =
      shuffled.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() *
        (i + 1)
      );

    [
      shuffled[i],
      shuffled[j]
    ] = [
      shuffled[j],
      shuffled[i]
    ];
  }

  return shuffled.slice(
    0,
    Math.min(
      Math.max(
        0,
        Math.floor(count)
      ),
      MAX_SPAWN_POSITIONS
    )
  );
}