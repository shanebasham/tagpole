let randomState =
  0;

export function createRandomWorldSeed(): number {
  const values =
    new Uint32Array(1);

  if (
    typeof crypto !==
      'undefined' &&
    typeof crypto.getRandomValues ===
      'function'
  ) {
    crypto.getRandomValues(
      values
    );

    return values[0] >>> 0;
  }

  return (
    Math.floor(
      Math.random() *
      0x100000000
    ) >>> 0
  );
}

function seededRandom(): number {
  randomState =
    (
      randomState *
      1664525 +
      1013904223
    ) >>> 0;

  return (
    randomState /
    4294967296
  );
}

export function withWorldSeed<T>(
  seed: number,
  generate: () => T
): T {

  const originalRandom =
    Math.random;

  randomState =
    seed >>> 0;

  Math.random =
    seededRandom;

  try {

    return generate();

  } finally {

    Math.random =
      originalRandom;
  }
}