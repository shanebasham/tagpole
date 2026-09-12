import * as THREE from 'three';
import './style.css';

export class MainMenu {
  private container: HTMLDivElement;

  private tadpoleScene: THREE.Scene;
  private tadpoleCamera: THREE.PerspectiveCamera;
  private tadpoleRenderer: THREE.WebGLRenderer;
  private tadpoleModel: THREE.Group;

  private onVsAI: () => void;
  private onFriends: () => void;

  constructor(
    tadpoleModel: THREE.Group,
    onVsAI: () => void,
    onFriends: () => void
  ) {
    this.onVsAI = onVsAI;
    this.onFriends = onFriends;

    // ==============================
    // MENU CONTAINER
    // ==============================

    this.container =
      document.createElement('div');

    this.container.id =
      'main-menu';

    document.body.appendChild(
      this.container
    );

    // ==============================
    // MENU HTML
    // ==============================

    this.container.innerHTML = `
      <div class="menu-content">

        <div class="menu-left">

          <div class="game-title">
            TAGPOLE
          </div>

          <div class="game-subtitle">
            DON'T GET TAGGED
          </div>

          <div class="menu-buttons">

            <button
              id="menu-friends"
              class="menu-button"
            >
              PLAY WITH FRIENDS
            </button>

            <button
              id="menu-ai"
              class="menu-button"
            >
              VS AI
            </button>

            <button
              id="menu-settings"
              class="menu-button"
            >
              SETTINGS
            </button>

          </div>

        </div>

        <div class="menu-character">

          <div
            id="menu-tadpole-container"
            class="menu-tadpole"
          ></div>

          <button
            id="menu-customize"
            class="customize-button"
          >
            CUSTOMIZE
          </button>

        </div>

      </div>

      <div class="menu-version">
        TAGPOLE
      </div>
    `;

    // ==============================
    // TADPOLE SCENE
    // ==============================

    this.tadpoleScene =
      new THREE.Scene();

    this.tadpoleScene.background =
      null;

    // ==============================
    // TADPOLE CAMERA
    // ==============================

    this.tadpoleCamera =
      new THREE.PerspectiveCamera(
        45,
        1,
        0.1,
        100
      );

    this.tadpoleCamera.position.set(
      0,
      0,
      7
    );

    this.tadpoleCamera.lookAt(
      0,
      0,
      0
    );

    // ==============================
    // LIGHTING
    // ==============================

    const ambientLight =
      new THREE.AmbientLight(
        0xb8e9ee,
        2.2
      );

    this.tadpoleScene.add(
      ambientLight
    );

    const keyLight =
      new THREE.DirectionalLight(
        0xd9f8ff,
        2.5
      );

    keyLight.position.set(
      3,
      5,
      5
    );

    this.tadpoleScene.add(
      keyLight
    );

    const fillLight =
      new THREE.DirectionalLight(
        0x5fb4c0,
        1.2
      );

    fillLight.position.set(
      -4,
      1,
      3
    );

    this.tadpoleScene.add(
      fillLight
    );

    // ==============================
    // RENDERER
    // ==============================

    this.tadpoleRenderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });

    this.tadpoleRenderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );

    this.tadpoleRenderer.setClearColor(
      0x000000,
      0
    );

    this.tadpoleRenderer.domElement.className =
      'menu-tadpole-renderer';

    const tadpoleContainer =
      document.getElementById(
        'menu-tadpole-container'
      );

    if (tadpoleContainer) {
      tadpoleContainer.appendChild(
        this.tadpoleRenderer.domElement
      );
    }

    // ==============================
    // CLONE PLAYER MODEL
    // ==============================

    this.tadpoleModel =
      tadpoleModel.clone(true);

    this.tadpoleModel.visible =
      true;

    this.tadpoleModel.position.set(
      0,
      0,
      0
    );

    this.tadpoleModel.rotation.set(
      0,
      Math.PI * 0.75,
      0
    );

    this.tadpoleModel.scale.setScalar(
      1.7
    );

    this.tadpoleScene.add(
      this.tadpoleModel
    );

    // Keep the actual gameplay model hidden.
    tadpoleModel.visible =
      false;

    // ==============================
    // VS AI
    // ==============================

    document
      .getElementById(
        'menu-ai'
      )
      ?.addEventListener(
        'click',
        () => {
          this.hide();

          this.onVsAI();
        }
      );

    // ==============================
    // PLAY WITH FRIENDS
    // ==============================

    document
      .getElementById(
        'menu-friends'
      )
      ?.addEventListener(
        'click',
        () => {
          this.hide();

          this.onFriends();
        }
      );

    // ==============================
    // SETTINGS
    // ==============================

    document
      .getElementById(
        'menu-settings'
      )
      ?.addEventListener(
        'click',
        () => {
          const button =
            document.getElementById(
              'menu-settings'
            );

          if (!button) {
            return;
          }

          button.textContent =
            'COMING SOON';

          setTimeout(() => {
            button.textContent =
              'SETTINGS';
          }, 1200);
        }
      );

    // ==============================
    // CUSTOMIZE
    // ==============================

    document
      .getElementById(
        'menu-customize'
      )
      ?.addEventListener(
        'click',
        () => {
          const button =
            document.getElementById(
              'menu-customize'
            );

          if (!button) {
            return;
          }

          button.textContent =
            'COMING SOON';

          setTimeout(() => {
            button.textContent =
              'CUSTOMIZE';
          }, 1200);
        }
      );

    // ==============================
    // INITIAL SIZE
    // ==============================

    this.resize();
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    time: number
  ) {
    if (!this.isVisible()) {
      return;
    }

    const seconds =
      time * 0.001;

    // ------------------------------
    // TADPOLE SWIMMING
    // ------------------------------

    this.tadpoleModel.position.y =
      Math.sin(
        seconds * 1.5
      ) * 0.16;

    this.tadpoleModel.position.x =
      Math.sin(
        seconds * 0.7
      ) * 0.08;

    this.tadpoleModel.rotation.y =
      Math.PI * 0.75 +
      Math.sin(
        seconds * 0.8
      ) * 0.12;

    this.tadpoleModel.rotation.z =
      Math.sin(
        seconds * 1.2
      ) * 0.06;

    this.tadpoleModel.rotation.x =
      Math.sin(
        seconds * 1.7
      ) * 0.035;

    // ------------------------------
    // SMALL BODY BOB
    // ------------------------------

    const scale =
      1.7 +
      Math.sin(
        seconds * 1.5
      ) * 0.035;

    this.tadpoleModel.scale.setScalar(
      scale
    );

    // ------------------------------
    // RENDER
    // ------------------------------

    this.tadpoleRenderer.render(
      this.tadpoleScene,
      this.tadpoleCamera
    );
  }

  // ==============================
  // RESIZE
  // ==============================

  resize() {
    const element =
      document.getElementById(
        'menu-tadpole-container'
      );

    if (!element) {
      return;
    }

    const width =
      Math.max(
        element.clientWidth,
        1
      );

    const height =
      Math.max(
        element.clientHeight,
        1
      );

    this.tadpoleCamera.aspect =
      width / height;

    this.tadpoleCamera.updateProjectionMatrix();

    this.tadpoleRenderer.setSize(
      width,
      height,
      false
    );
  }

  // ==============================
  // SHOW
  // ==============================

  show() {
    this.container.style.display =
      'flex';

    this.resize();
  }

  // ==============================
  // HIDE
  // ==============================

  hide() {
    this.container.style.display =
      'none';
  }

  // ==============================
  // VISIBLE
  // ==============================

  isVisible() {
    return (
      this.container.style.display !==
      'none'
    );
  }
  
    // ==============================
  // LOBBY
  // ==============================

  showLobby(
    roomCode: string,
    playerCount: number,
    maxPlayers: number
  ) {
    this.container.innerHTML = `
      <div class="menu-content lobby-content">

        <div class="menu-left">

          <div class="game-title">
            TAGPOLE
          </div>

          <div class="game-subtitle">
            PLAY WITH FRIENDS
          </div>

          <div class="lobby-info">

            <div class="lobby-label">
              ROOM CODE
            </div>

            <div class="lobby-code">
              ${roomCode}
            </div>

            <div class="lobby-players">
              ${playerCount} / ${maxPlayers} PLAYERS
            </div>

            <div class="lobby-waiting">
              WAITING FOR PLAYERS...
            </div>

          </div>

        </div>

        <div class="menu-character">

          <div
            id="menu-tadpole-container"
            class="menu-tadpole"
          ></div>

        </div>

      </div>

      <div class="menu-version">
        TAGPOLE
      </div>
    `;

    const tadpoleContainer =
      document.getElementById(
        'menu-tadpole-container'
      );

    if (tadpoleContainer) {
      tadpoleContainer.appendChild(
        this.tadpoleRenderer.domElement
      );
    }

    this.container.style.display = 'flex';

    this.resize();
  }
}