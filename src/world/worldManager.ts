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

export class WorldManager {

  private scene: THREE.Scene;

  // IMPORTANT:
  // Keep the same array object so AIManager's reference
  // remains valid when the world is recreated.
  private rocks: RockCollider[] = [];

  private ocean:
    ReturnType<typeof createOcean> |
    null = null;

  constructor(
    scene: THREE.Scene
  ) {
    this.scene = scene;
  }

  // ==============================
  // CREATE WORLD
  // ==============================

  create(): void {
    this.clear();

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

  // ==============================
  // GET ROCKS
  // ==============================

  getRocks(): RockCollider[] {
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
    camera: THREE.PerspectiveCamera
  ): void {
    updateBoundaries(
      camera
    );

    updateSeaweed(
      performance.now()
    );
  }

  // ==============================
  // RESET WORLD
  // ==============================

  reset(): void {
    this.clear();

    this.create();
  }

  // ==============================
  // CLEAR WORLD
  // ==============================

  clear(): void {
    clearOcean(
      this.ocean
    );

    this.ocean = null;

    clearRocks();

    this.rocks.length = 0;

    clearOceanVegetation();
  }

  // ==============================
  // DESTROY
  // ==============================

  destroy(): void {
    this.clear();
  }
}