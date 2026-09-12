import * as THREE from 'three';

// ==============================
// NIGHT SKY
// ==============================

export function createNightSky(
  scene: THREE.Scene
) {
  const skyGeometry =
    new THREE.SphereGeometry(
      600,
      64,
      32
    );

  const skyMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x02050c,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    });

  const sky =
    new THREE.Mesh(
      skyGeometry,
      skyMaterial
    );

  sky.position.set(
    0,
    30,
    0
  );

  sky.scale.set(
    1,
    0.5,
    1
  );

  sky.renderOrder = -100;

  scene.add(sky);

  // ==============================
  // STARS
  // ==============================

  const starCount = 1800;

  const positions =
    new Float32Array(
      starCount * 3
    );

  for (
    let i = 0;
    i < starCount;
    i++
  ) {
    const radius =
      THREE.MathUtils.randFloat(
        300,
        550
      );

    const theta =
      Math.random() *
      Math.PI *
      2;

    const phi =
      THREE.MathUtils.randFloat(
        0.02,
        Math.PI / 2
      );

    positions[i * 3] =
      Math.cos(theta) *
      Math.sin(phi) *
      radius;

    positions[i * 3 + 1] =
      Math.cos(phi) *
      radius +
      30;

    positions[i * 3 + 2] =
      Math.sin(theta) *
      Math.sin(phi) *
      radius;
  }

  const starGeometry =
    new THREE.BufferGeometry();

  starGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      positions,
      3
    )
  );

  const starMaterial =
    new THREE.PointsMaterial({
      color: 0xd8e8ee,
      size: 0.9,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      depthTest: false,
    });

  const stars =
    new THREE.Points(
      starGeometry,
      starMaterial
    );

  stars.renderOrder = -50;

  scene.add(stars);

  // ==============================
  // MOON
  // ==============================

  const moonGroup =
    new THREE.Group();

  // ==============================
  // FADING MOON HAZE
  // ==============================

  const hazeCanvas =
    document.createElement(
      'canvas'
    );

  hazeCanvas.width = 256;
  hazeCanvas.height = 256;

  const hazeContext =
    hazeCanvas.getContext('2d')!;

  const gradient =
    hazeContext.createRadialGradient(
      128,
      128,
      10,
      128,
      128,
      128
    );

  gradient.addColorStop(
    0,
    'rgba(210,235,240,0.20)'
  );

  gradient.addColorStop(
    0.3,
    'rgba(195,225,232,0.11)'
  );

  gradient.addColorStop(
    0.6,
    'rgba(175,210,220,0.045)'
  );

  gradient.addColorStop(
    0.8,
    'rgba(155,195,205,0.015)'
  );

  gradient.addColorStop(
    1,
    'rgba(150,190,200,0)'
  );

  hazeContext.fillStyle =
    gradient;

  hazeContext.fillRect(
    0,
    0,
    256,
    256
  );

  const hazeTexture =
    new THREE.CanvasTexture(
      hazeCanvas
    );

  const hazeMaterial =
    new THREE.SpriteMaterial({
      map: hazeTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

  const haze =
    new THREE.Sprite(
      hazeMaterial
    );

  haze.scale.set(
    125,
    125,
    1
  );

  haze.renderOrder = 10;

  moonGroup.add(haze);

  // ==============================
  // MOON
  // ==============================

  const moonGeometry =
    new THREE.SphereGeometry(
      18,
      48,
      32
    );

    const moonMaterial =
    new THREE.MeshBasicMaterial({
        color: 0xe8f7ff,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        depthTest: false,
        fog: false,
    });

  const moon =
    new THREE.Mesh(
      moonGeometry,
      moonMaterial
    );

  moon.renderOrder = 20;

  moonGroup.add(moon);

  // ==============================
  // RANDOM MOON POSITION
  // ==============================

  const moonAngle =
    Math.random() *
    Math.PI *
    2;

  const moonDistance =
    THREE.MathUtils.randFloat(
      320,
      390
    );

  const moonHeight =
    THREE.MathUtils.randFloat(
      120,
      190
    );

  moonGroup.position.set(
    Math.cos(moonAngle) *
      moonDistance,

    moonHeight,

    Math.sin(moonAngle) *
      moonDistance
  );

  scene.add(moonGroup);

  // ==============================
  // MOON VISIBILITY
  // ==============================

  function updateMoonVisibility(
    cameraY: number
  ) {
    const SURFACE_Y = 30;

    const distanceBelowSurface =
      SURFACE_Y - cameraY;

    // Above water:
    // completely visible.
    if (
      cameraY >= SURFACE_Y
    ) {
      moonMaterial.opacity = 1;
      hazeMaterial.opacity = 1;
      return;
    }

    // More than 10m underwater:
    // moon is completely gone.
    if (
      distanceBelowSurface >= 10
    ) {
      moonMaterial.opacity = 0;
      hazeMaterial.opacity = 0;
      return;
    }

    // Last 10m underwater:
    // gradually reveal the moon.
    const visibility =
      1 -
      THREE.MathUtils.smoothstep(
        distanceBelowSurface,
        0,
        10
      );

    // Keep it extremely faint underwater.
    moonMaterial.opacity =
      visibility * 0.12;

    hazeMaterial.opacity =
      visibility * 0.18;
  }

  return {
    sky,
    stars,
    moonGroup,
    moon,
    haze,
    updateMoonVisibility,
  };
}