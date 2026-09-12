import * as THREE from 'three';

import {
  createNightSky
} from './sky';

// ==============================
// OCEAN FLOOR
// ==============================

function createOceanFloor(
  scene: THREE.Scene
) {
  const floorGeometry =
    new THREE.PlaneGeometry(
      120,
      120,
      40,
      40
    );

  const floorMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x102d35,
      roughness: 1,
    });

  const floor =
    new THREE.Mesh(
      floorGeometry,
      floorMaterial
    );

  floor.rotation.x =
    -Math.PI / 2;

  floor.position.y =
    -15;

  scene.add(floor);
}

// ==============================
// OCEAN SURFACE
// ==============================

function createOceanSurface(
  scene: THREE.Scene
) {
  const surfaceGeometry =
    new THREE.PlaneGeometry(
      600,
      600
    );

  const surfaceMaterial =
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,

      uniforms: {
        uTime: {
          value: 0,
        },

        uCameraPosition: {
          value:
            new THREE.Vector3(),
        },

        uSurfaceY: {
          value: 30,
        },

        uUnderwater: {
          value: 1,
        },
      },

      vertexShader: `
        uniform float uTime;

        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {
          vUv = uv;

          vec3 pos = position;

          // Gentle large-scale waves.
          pos.z +=
            sin(
              pos.x * 0.035 +
              uTime * 0.55
            ) * 0.18;

          pos.x +=
            sin(
              pos.z * 0.028 +
              uTime * 0.45
            ) * 0.15;

          vec4 worldPosition =
            modelMatrix *
            vec4(
              pos,
              1.0
            );

          vWorldPosition =
            worldPosition.xyz;

          gl_Position =
            projectionMatrix *
            viewMatrix *
            worldPosition;
        }
      `,

      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCameraPosition;
        uniform float uSurfaceY;
        uniform float uUnderwater;

        varying vec2 vUv;
        varying vec3 vWorldPosition;

        void main() {

          // ==============================
          // DISTANCE FROM PLAYER
          // ==============================

          float horizontalDistance =
            distance(
              uCameraPosition.xz,
              vWorldPosition.xz
            );

          // ==============================
          // MOVING WATER
          // ==============================

          float wave1 =
            sin(
              vWorldPosition.x * 0.22 +
              uTime * 0.7
            );

          float wave2 =
            sin(
              vWorldPosition.z * 0.18 -
              uTime * 0.55
            );

          float wave3 =
            sin(
              (
                vWorldPosition.x +
                vWorldPosition.z
              ) * 0.11 +
              uTime * 0.35
            );

          float movement =
            (
              wave1 +
              wave2 +
              wave3
            ) / 3.75;

          // ==============================
          // WATER COLOR
          // ==============================

          vec3 waterColor =
            vec3(
              0.30,
              0.53,
              0.57
            );

          waterColor *=
            0.72 +
            movement * 0.08;

          // ==============================
          // UNDERWATER DISTANCE
          // ==============================

          // Close to the player:
          // visible.
          //
          // Far away:
          // gradually disappears.

          float underwaterFade =
            1.0 -
            smoothstep(
              18.0,
              95.0,
              horizontalDistance
            );

          // ==============================
          // ABOVE WATER
          // ==============================

          // When above water, keep the
          // surface visible much farther
          // toward the horizon.

          float aboveWaterFade =
            1.0 -
            smoothstep(
              180.0,
              300.0,
              horizontalDistance
            );

          float alpha =
            mix(
              underwaterFade,
              aboveWaterFade,
              1.0 - uUnderwater
            );

          // Slightly stronger above water.
          alpha *=
            mix(
              0.48,
              0.62,
              1.0 - uUnderwater
            );

          gl_FragColor =
            vec4(
              waterColor,
              alpha
            );
        }
      `,
    });

  const surface =
    new THREE.Mesh(
      surfaceGeometry,
      surfaceMaterial
    );

  surface.rotation.x =
    -Math.PI / 2;

  surface.position.y =
    30;

  surface.renderOrder =
    10;

  scene.add(surface);

  return surface;
}

// ==============================
// PARTICLES
// ==============================

function createParticles(
  scene: THREE.Scene
) {
  const particleCount = 1800;

  const particlePositions =
    new Float32Array(
      particleCount * 3
    );

  for (
    let i = 0;
    i < particleCount;
    i++
  ) {
    particlePositions[
      i * 3
    ] =
      THREE.MathUtils.randFloatSpread(
        120
      );

    // Never above the surface.
    particlePositions[
      i * 3 + 1
    ] =
      THREE.MathUtils.randFloat(
        -15,
        29.8
      );

    particlePositions[
      i * 3 + 2
    ] =
      THREE.MathUtils.randFloatSpread(
        120
      );
  }

  const particleGeometry =
    new THREE.BufferGeometry();

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      particlePositions,
      3
    )
  );

  const particleMaterial =
    new THREE.PointsMaterial({
      color: 0x9acbd2,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
    });

  const particles =
    new THREE.Points(
      particleGeometry,
      particleMaterial
    );

  scene.add(particles);

  return particles;
}

// ==============================
// CREATE OCEAN
// ==============================

export function createOcean(
  scene: THREE.Scene
) {
  createOceanFloor(scene);

  const surface =
    createOceanSurface(scene);

  const sky =
    createNightSky(scene);

  const particles =
    createParticles(scene);

  return {
    surface,
    particles,
    sky,
  };
}