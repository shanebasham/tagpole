import * as THREE from 'three';
import './style.css';

export function createGameHud() {
  const hud =
    document.createElement('div');

  hud.id = 'game-hud';

  hud.innerHTML = `
    <div id="player-status">
      <div id="role-label">
        SURVIVOR
      </div>

      <div id="status-label">
        ALIVE
      </div>
    </div>

    <div id="players-status">
      <div id="players-value">
        12
      </div>

      <div id="players-label">
        PLAYERS ALIVE
      </div>
    </div>

    <div id="crosshair">
      <div class="crosshair-dot"></div>
    </div>

    <div id="boost-status">
      <div id="boost-key">
        SHIFT
      </div>

      <div id="boost-text">
        BOOST READY
      </div>
    </div>

    <div id="attack-status">
      <div id="attack-key">
        Left Click
      </div>

      <div id="attack-text">
        BURST READY
      </div>
    </div>

    <div id="depth-meter">
      <div id="depth-value">
        30.0m
      </div>

      <div id="depth-label">
        DEPTH
      </div>
    </div>

    <div id="trapped-status">
      <div id="trapped-title">
        TRAPPED
      </div>

      <div id="trapped-warning">
        POP THE BUBBLE
      </div>
    </div>
  `;

  document.body.appendChild(
    hud
  );

  const roleLabel =
    document.getElementById(
      'role-label'
    );

  const statusLabel =
    document.getElementById(
      'status-label'
    );

  const playersValue =
    document.getElementById(
      'players-value'
    );

  const depthValue =
    document.getElementById(
      'depth-value'
    );

  const trappedStatus =
    document.getElementById(
      'trapped-status'
    );

  const crosshair =
    document.getElementById(
      'crosshair'
    );

  const boostStatus =
    document.getElementById(
      'boost-status'
    );

  const boostKey =
    document.getElementById(
      'boost-key'
    );

  const boostText =
    document.getElementById(
      'boost-text'
    );

  const attackStatus =
    document.getElementById(
      'attack-status'
    );

  const attackKey =
    document.getElementById(
      'attack-key'
    );

  const attackText =
    document.getElementById(
      'attack-text'
    );

  return {
    setRole(isIt: boolean) {
      if (!roleLabel) {
        return;
      }

      if (isIt) {
        roleLabel.textContent =
          'THE DROWNED';

        roleLabel.classList.add(
          'drowned'
        );
      } else {
        roleLabel.textContent =
          'SURVIVOR';

        roleLabel.classList.remove(
          'drowned'
        );
      }
    },

    setAlive(alive: boolean) {
      if (!statusLabel) {
        return;
      }

      statusLabel.textContent =
        alive
          ? 'ALIVE'
          : 'DEAD';

      statusLabel.classList.toggle(
        'dead',
        !alive
      );
    },

    setPlayersAlive(
      count: number
    ) {
      if (!playersValue) {
        return;
      }

      playersValue.textContent =
        count.toString();
    },

    updateDepth(
      camera: THREE.Camera
    ) {
      if (!depthValue) {
        return;
      }

      const depth =
        Math.max(
          0,
          30 -
            camera.position.y
        );

      depthValue.textContent =
        `${depth.toFixed(1)}m`;
    },

    setTrapped(
      trapped: boolean,
      bubble: THREE.Mesh | null
    ) {
      if (!trappedStatus) {
        return;
      }

      trappedStatus.classList.toggle(
        'visible',
        trapped
      );

      if (!trapped || !bubble) {
        return;
      }
    },

    updateTrapped(
      bubble: THREE.Mesh | null
    ) {
      if (
        !bubble ||
        !trappedStatus
      ) {
        return;
      }
    },

    updateBoost(
      cooldown: number,
      usable: boolean
    ) {
      if (
        !boostStatus ||
        !boostKey ||
        !boostText
      ) {
        return;
      }

      if (!usable) {
        boostStatus.classList.add(
          'disabled'
        );

        boostText.textContent =
          'UNAVAILABLE';

        return;
      }

      if (cooldown <= 0) {
        boostStatus.classList.remove(
          'cooldown',
          'disabled'
        );

        boostText.textContent =
          'BOOST READY';

        return;
      }

      boostStatus.classList.add(
        'cooldown'
      );

      boostStatus.classList.remove(
        'disabled'
      );

      boostText.textContent =
        `BOOST ${cooldown.toFixed(1)}`;
    },

    updateAttack(
      cooldown: number,
      usable: boolean
    ) {
      if (
        !attackStatus ||
        !attackKey ||
        !attackText
      ) {
        return;
      }

      if (!usable) {
        attackStatus.classList.add(
          'disabled'
        );

        attackStatus.classList.remove(
          'cooldown'
        );

        attackText.textContent =
          'UNAVAILABLE';

        return;
      }

      if (cooldown <= 0) {
        attackStatus.classList.remove(
          'cooldown',
          'disabled'
        );

        attackText.textContent =
          'BURST READY';

        return;
      }

      attackStatus.classList.add(
        'cooldown'
      );

      attackStatus.classList.remove(
        'disabled'
      );

      attackText.textContent =
        `BURST ${cooldown.toFixed(1)}`;
    },

    setCrosshairVisible(
      visible: boolean
    ) {
      if (!crosshair) {
        return;
      }

      crosshair.classList.toggle(
        'hidden',
        !visible
      );
    },

    hide() {
      hud.classList.add(
        'hidden'
      );
    },

    show() {
      hud.classList.remove(
        'hidden'
      );
    },
  };
}