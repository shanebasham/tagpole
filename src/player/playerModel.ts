import * as THREE from 'three';

export function createPlayerModel() {

  const tadpole =
    new THREE.Group();

  // ==============================
  // BODY
  // ==============================

  const bodyGeometry =
    new THREE.SphereGeometry(
      0.45,
      16,
      12
    );

  const bodyMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x6f9e8b,
      roughness: 0.8,
    });

  const body =
    new THREE.Mesh(
      bodyGeometry,
      bodyMaterial
    );

  body.scale.set(
    1,
    0.9,
    1.25
  );

  tadpole.add(body);

  // ==============================
  // EYES
  // ==============================

  const eyeGeometry =
    new THREE.SphereGeometry(
      0.14,
      12,
      8
    );

  const eyeMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x050706,
      roughness: 0.5,
    });

  const leftEye =
    new THREE.Mesh(
      eyeGeometry,
      eyeMaterial
    );

  leftEye.position.set(
    -0.24,
    0.19,
    -0.38
  );

  tadpole.add(leftEye);

  const rightEye =
    new THREE.Mesh(
      eyeGeometry,
      eyeMaterial
    );

  rightEye.position.set(
    0.24,
    0.19,
    -0.38
  );

  tadpole.add(rightEye);

  // ==============================
  // FLASHLIGHT BEAMS
  // ==============================

  function createFlashlightBeam(): THREE.Mesh {

    const geometry =
      new THREE.ConeGeometry(
        1.8,
        14,
        32,
        32,
        true
      );

    const material =
      new THREE.ShaderMaterial({

        transparent: true,

        depthWrite: false,

        blending:
          THREE.AdditiveBlending,

        side:
          THREE.DoubleSide,

        uniforms: {

          color: {
            value:
              new THREE.Color(
                0xbdefff
              )
          },

        },

        vertexShader: `
          varying vec3 vLocalPosition;

          void main() {

            vLocalPosition =
              position;

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(
                position,
                1.0
              );
          }
        `,

        fragmentShader: `
          uniform vec3 color;

          varying vec3 vLocalPosition;

          void main() {

            /*
             * ConeGeometry points along Y.
             *
             * The cone is rotated so its
             * tip points forward along -Z.
             *
             * The tip is at local +Y.
             */

            float distanceFromEye =
              (7.0 - vLocalPosition.y) / 14.0;

            /*
             * Fade the beam toward the
             * far end.
             */

            float distanceFade =
              1.0 -
              smoothstep(
                0.05,
                1.0,
                distanceFromEye
              );

            /*
             * Distance from the center
             * of the beam.
             */

            float radius =
              length(
                vLocalPosition.xz
              );

            /*
             * The cone gets wider as it
             * travels away from the eye.
             */

            float coneRadius =
              0.05 +
              distanceFromEye * 1.8;

            /*
             * Soft outer edge.
             */

            float edge =
              1.0 -
              smoothstep(
                coneRadius * 0.55,
                coneRadius,
                radius
              );

            /*
             * Overall beam strength.
             */

            float alpha =
              distanceFade *
              edge *
              0.16;

            gl_FragColor =
              vec4(
                color,
                alpha
              );
          }
        `,
      });

    const beam =
      new THREE.Mesh(
        geometry,
        material
      );

    /*
     * Mark this object so cloned
     * player models can find it.
     */

    beam.userData.isFlashlightBeam =
      true;

    /*
     * ConeGeometry points along +Y.
     *
     * Rotate +Y toward -Z so the
     * flashlight points forward.
     */

    beam.rotation.x =
      Math.PI / 2;

    /*
     * Move the cone forward by half
     * its length so the narrow tip
     * starts at the eye.
     */

    beam.position.z =
      -7.0;

    return beam;
  }

  const leftBeam =
    createFlashlightBeam();

  const rightBeam =
    createFlashlightBeam();

  leftEye.add(
    leftBeam
  );

  rightEye.add(
    rightBeam
  );

  // ==============================
  // TAIL
  // ==============================

  const tailGeometry =
    new THREE.ConeGeometry(
      0.25,
      1.8,
      8,
      4
    );

  const tailMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x527a6c,
      roughness: 0.9,
    });

  const tail =
    new THREE.Mesh(
      tailGeometry,
      tailMaterial
    );

  tail.rotation.x =
    Math.PI / 2;

  tail.position.z =
    1;

  tadpole.add(tail);

  return tadpole;
}


// ========================================
// FLASHLIGHT VISIBILITY
// ========================================

export function setPlayerFlashlightVisible(
  model: THREE.Group,
  visible: boolean
): void {

  model.traverse(
    (object) => {

      if (
        object.userData
          .isFlashlightBeam === true
      ) {

        object.visible =
          visible;
      }
    }
  );
}