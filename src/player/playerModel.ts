import * as THREE from 'three';

function darkenColor(
  color: number,
  amount = 0.58
): number {

  const r =
    (color >> 16) & 0xff;

  const g =
    (color >> 8) & 0xff;

  const b =
    color & 0xff;

  const darkenedR =
    Math.round(r * amount);

  const darkenedG =
    Math.round(g * amount);

  const darkenedB =
    Math.round(b * amount);

  return (
    (darkenedR << 16) |
    (darkenedG << 8) |
    darkenedB
  );
}

export function createPlayerModel(): THREE.Group {

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

  body.userData.playerColorPart =
    'body';

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
  // FLASHLIGHT BEAM
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
              ),
          },
        },

        vertexShader: `
          varying vec2 vUv;

          void main() {

            vUv = uv;

            gl_Position =
              projectionMatrix *
              modelViewMatrix *
              vec4(position, 1.0);
          }
        `,

        fragmentShader: `
          uniform vec3 color;

          varying vec2 vUv;

          void main() {

            float edge =
              smoothstep(
                0.0,
                0.35,
                vUv.x
              ) *
              smoothstep(
                1.0,
                0.65,
                vUv.x
              );

            float lengthFade =
              1.0 -
              smoothstep(
                0.0,
                1.0,
                vUv.y
              );

            float alpha =
              edge *
              lengthFade *
              0.13;

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

    beam.userData.isFlashlightBeam =
      true;

    beam.rotation.x =
      Math.PI / 2;

    beam.position.z =
      -7.0;

    return beam;
  }

  const leftBeam =
    createFlashlightBeam();

  const rightBeam =
    createFlashlightBeam();

  leftEye.add(leftBeam);
  rightEye.add(rightBeam);

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

  tail.userData.playerColorPart =
    'tail';

  tadpole.add(tail);

  return tadpole;
}

export function setPlayerModelColor(
  model: THREE.Group,
  color: number
): void {

  const tailColor =
    darkenColor(color);

  model.traverse(
    object => {

      if (
        !(object instanceof THREE.Mesh)
      ) {
        return;
      }

      const part =
        object.userData.playerColorPart;

      if (
        part !== 'body' &&
        part !== 'tail'
      ) {
        return;
      }

      const materials =
        Array.isArray(object.material)
          ? object.material
          : [object.material];

      for (
        const material of materials
      ) {

        if (
          material instanceof
          THREE.MeshStandardMaterial
        ) {

          if (
            part === 'body'
          ) {

            material.color.setHex(
              color
            );

          } else {

            material.color.setHex(
              tailColor
            );
          }
        }
      }
    }
  );
}

export function clonePlayerModel(
  model: THREE.Group
): THREE.Group {

  const clone =
    model.clone(true);

  clone.traverse(
    object => {

      if (
        !(object instanceof THREE.Mesh)
      ) {
        return;
      }

      if (
        Array.isArray(
          object.material
        )
      ) {

        object.material =
          object.material.map(
            material =>
              material.clone()
          );

      } else {

        object.material =
          object.material.clone();
      }
    }
  );

  return clone;
}

export function setPlayerFlashlightVisible(
  model: THREE.Group,
  visible: boolean
): void {

  model.traverse(
    object => {

      if (
        object.userData.isFlashlightBeam ===
        true
      ) {

        object.visible =
          visible;
      }
    }
  );
}