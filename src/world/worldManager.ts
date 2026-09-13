import * as THREE from 'three';

import {
  createOcean,
  clearOcean,
} from './ocean';

import {
  createRocks,
  clearRocks,
} from './rocks';

import type {
  RockCollider
} from './rocks';

import {
  createOceanVegetation,
  clearOceanVegetation,
  updateSeaweed,
} from './oceanVegetation';

import {
  updateBoundaries
} from './boundaries';

import {
  withWorldSeed,
  createRandomWorldSeed,
} from './worldRandom';

export class WorldManager {

  private scene:
    THREE.Scene;

  private rocks:
    RockCollider[] = [];

  private ocean:
    ReturnType<typeof createOcean> |
    null = null;

  private worldSeed:
    number = 0;

  constructor(
    scene: THREE.Scene
  ) {

    this.scene =
      scene;
  }

  // ==============================
  // CREATE WORLD
  // ==============================

  create(
    seed: number =
      createRandomWorldSeed()
  ): void {

    this.worldSeed =
      seed >>> 0;

    this.clear();

    withWorldSeed(
      this.worldSeed,
      () => {

        this.ocean =
          createOcean(
            this.scene
          );

        const newRocks =
          createRocks(
            this.scene
          );

        this.rocks.push(
          ...newRocks
        );

        createOceanVegetation(
          this.scene
        );
      }
    );
  }

  // ==============================
  // RESET WORLD
  // ==============================

  reset(
    seed: number =
      createRandomWorldSeed()
  ): void {

    this.create(
      seed
    );
  }

  // ==============================
  // GET SEED
  // ==============================

  getWorldSeed(): number {

    return this.worldSeed;
  }

  // ==============================
  // GET ROCKS
  // ==============================

  getRocks():
    RockCollider[] {

    return this.rocks;
  }

  // ==============================
  // GET OCEAN
  // ==============================

  getOcean():
    ReturnType<typeof createOcean> |
    null {

    return this.ocean;
  }

  // ==============================
  // UPDATE WORLD
  // ==============================

  update(
    camera:
      THREE.PerspectiveCamera
  ): void {

    updateBoundaries(
      camera
    );

    updateSeaweed(
      performance.now()
    );
  }

  // ==============================
  // CLEAR WORLD
  // ==============================

  clear(): void {

    clearOcean(
      this.ocean
    );

    this.ocean =
      null;

    clearRocks();

    this.rocks.length =
      0;

    clearOceanVegetation();
  }

  // ==============================
  // DESTROY
  // ==============================

  destroy(): void {

    this.clear();
  }
}