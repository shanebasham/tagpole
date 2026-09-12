import * as THREE from 'three';

export type Controls = {
  keys: Record<string, boolean>;
  yaw: number;
  pitch: number;
  consumeBoost: () => boolean;
  isMobile: boolean;
};

export function createControls(
  domElement: HTMLElement
): Controls {
  const keys: Record<string, boolean> = {};

  let yaw = 0;
  let pitch = 0;

  let boostPressed = false;
  let shiftHeld = false;

  const isMobile =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0;

  // ==============================
  // PC KEYBOARD
  // ==============================

  window.addEventListener(
    'keydown',
    (event) => {
      keys[event.code] = true;

      if (
        (
          event.code === 'ShiftLeft' ||
          event.code === 'ShiftRight'
        ) &&
        !shiftHeld
      ) {
        boostPressed = true;
        shiftHeld = true;
      }
    }
  );

  window.addEventListener(
    'keyup',
    (event) => {
      keys[event.code] = false;

      if (
        event.code === 'ShiftLeft' ||
        event.code === 'ShiftRight'
      ) {
        shiftHeld = false;
      }
    }
  );

  // ==============================
  // DESKTOP POINTER LOCK
  // ==============================

  if (!isMobile) {
    domElement.addEventListener(
      'click',
      () => {
        domElement.requestPointerLock();
      }
    );

    document.addEventListener(
      'mousemove',
      (event) => {
        if (
          document.pointerLockElement !==
          domElement
        ) {
          return;
        }

        const sensitivity = 0.002;

        yaw -=
          event.movementX *
          sensitivity;

        pitch -=
          event.movementY *
          sensitivity;

        pitch =
          THREE.MathUtils.clamp(
            pitch,
            -Math.PI / 2 + 0.05,
            Math.PI / 2 - 0.05
          );
      }
    );
  }

  // ==============================
  // MOBILE CONTROLS
  // ==============================

  if (isMobile) {
    createMobileControls();
  }

  function createMobileControls() {
    const mobileControls =
      document.createElement('div');

    mobileControls.id =
      'mobile-controls';

    mobileControls.innerHTML = `
      <div id="mobile-joystick">
        <div id="joystick-base">
          <div id="joystick-stick"></div>
        </div>
      </div>

      <div id="mobile-look"></div>

      <button
        id="mobile-boost"
        type="button"
      >
        BOOST
      </button>

      <button
        id="mobile-up"
        type="button"
      >
        ▲
      </button>

      <button
        id="mobile-down"
        type="button"
      >
        ▼
      </button>
    `;

    document.body.appendChild(
      mobileControls
    );

    const joystick =
      document.getElementById(
        'joystick-base'
      );

    const stick =
      document.getElementById(
        'joystick-stick'
      );

    const lookArea =
      document.getElementById(
        'mobile-look'
      );

    const boost =
      document.getElementById(
        'mobile-boost'
      );

    const up =
      document.getElementById(
        'mobile-up'
      );

    const down =
      document.getElementById(
        'mobile-down'
      );

    // ==========================
    // JOYSTICK
    // ==========================

    let joystickPointerId:
      number | null = null;

    const joystickRadius = 50;

    joystick?.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();

        joystickPointerId =
          event.pointerId;

        joystick.setPointerCapture(
          event.pointerId
        );

        updateJoystick(
          event
        );
      }
    );

    joystick?.addEventListener(
      'pointermove',
      (event) => {
        if (
          event.pointerId !==
          joystickPointerId
        ) {
          return;
        }

        event.preventDefault();

        updateJoystick(
          event
        );
      }
    );

    const releaseJoystick =
      (event: PointerEvent) => {
        if (
          event.pointerId !==
          joystickPointerId
        ) {
          return;
        }

        joystickPointerId =
          null;

        keys['KeyW'] = false;
        keys['KeyS'] = false;
        keys['KeyA'] = false;
        keys['KeyD'] = false;

        if (stick) {
          stick.style.transform =
            'translate(-50%, -50%)';
        }
      };

    joystick?.addEventListener(
      'pointerup',
      releaseJoystick
    );

    joystick?.addEventListener(
      'pointercancel',
      releaseJoystick
    );

    function updateJoystick(
      event: PointerEvent
    ) {
      if (!joystick || !stick) {
        return;
      }

      const rect =
        joystick.getBoundingClientRect();

      const centerX =
        rect.left +
        rect.width / 2;

      const centerY =
        rect.top +
        rect.height / 2;

      let x =
        event.clientX -
        centerX;

      let y =
        event.clientY -
        centerY;

      const distance =
        Math.sqrt(
          x * x +
          y * y
        );

      if (
        distance >
        joystickRadius
      ) {
        x =
          (x / distance) *
          joystickRadius;

        y =
          (y / distance) *
          joystickRadius;
      }

      stick.style.transform =
        `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

      const normalizedX =
        x / joystickRadius;

      const normalizedY =
        y / joystickRadius;

      keys['KeyW'] =
        normalizedY < -0.25;

      keys['KeyS'] =
        normalizedY > 0.25;

      keys['KeyA'] =
        normalizedX < -0.25;

      keys['KeyD'] =
        normalizedX > 0.25;
    }

    // ==========================
    // MOBILE LOOK
    // ==========================

    let lookPointerId:
      number | null = null;

    let lastLookX = 0;
    let lastLookY = 0;

    lookArea?.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();

        lookPointerId =
          event.pointerId;

        lastLookX =
          event.clientX;

        lastLookY =
          event.clientY;

        lookArea.setPointerCapture(
          event.pointerId
        );
      }
    );

    lookArea?.addEventListener(
      'pointermove',
      (event) => {
        if (
          event.pointerId !==
          lookPointerId
        ) {
          return;
        }

        event.preventDefault();

        const movementX =
          event.clientX -
          lastLookX;

        const movementY =
          event.clientY -
          lastLookY;

        lastLookX =
          event.clientX;

        lastLookY =
          event.clientY;

        const sensitivity =
          0.005;

        yaw -=
          movementX *
          sensitivity;

        pitch -=
          movementY *
          sensitivity;

        pitch =
          THREE.MathUtils.clamp(
            pitch,
            -Math.PI / 2 + 0.05,
            Math.PI / 2 - 0.05
          );
      }
    );

    const releaseLook =
      (event: PointerEvent) => {
        if (
          event.pointerId ===
          lookPointerId
        ) {
          lookPointerId = null;
        }
      };

    lookArea?.addEventListener(
      'pointerup',
      releaseLook
    );

    lookArea?.addEventListener(
      'pointercancel',
      releaseLook
    );

    // ==========================
    // BOOST
    // ==========================

    boost?.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();

        boostPressed = true;
      }
    );

    // ==========================
    // UP
    // ==========================

    up?.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();

        keys['Space'] = true;
      }
    );

    const releaseUp =
      () => {
        keys['Space'] = false;
      };

    up?.addEventListener(
      'pointerup',
      releaseUp
    );

    up?.addEventListener(
      'pointercancel',
      releaseUp
    );

    up?.addEventListener(
      'pointerleave',
      releaseUp
    );

    // ==========================
    // DOWN
    // ==========================

    down?.addEventListener(
      'pointerdown',
      (event) => {
        event.preventDefault();

        keys['ControlLeft'] = true;
      }
    );

    const releaseDown =
      () => {
        keys['ControlLeft'] = false;
      };

    down?.addEventListener(
      'pointerup',
      releaseDown
    );

    down?.addEventListener(
      'pointercancel',
      releaseDown
    );

    down?.addEventListener(
      'pointerleave',
      releaseDown
    );
  }

  return {
    keys,

    get yaw() {
      return yaw;
    },

    get pitch() {
      return pitch;
    },

    consumeBoost() {
      if (!boostPressed) {
        return false;
      }

      boostPressed = false;

      return true;
    },

    isMobile,
  };
}