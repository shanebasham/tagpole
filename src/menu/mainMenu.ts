import * as THREE from 'three';

import './style.css';

import {
  setPlayerFlashlightVisible,
} from '../player/playerModel';

import {
  AISelector,
} from './aiSelector';

export class MainMenu {

  private container:
    HTMLDivElement;

  private tadpoleScene:
    THREE.Scene;

  private tadpoleCamera:
    THREE.PerspectiveCamera;

  private tadpoleRenderer:
    THREE.WebGLRenderer;

  private tadpoleModel:
    THREE.Group;

  private aiSelector:
    AISelector | null = null;

  private onVsAI:
    (aiCount: number) => void;

  private onCreateRoom:
    () => void;

  private onJoinRoom:
    (roomCode: string) => void;

  private onLeaveRoom:
    () => void;

  private onStartGame:
    () => void;

  private lobbyStartButton:
    HTMLButtonElement | null =
    null;

  private selectedAICount:
    number = 0;

  constructor(
    tadpoleModel: THREE.Group,
    onVsAI: (aiCount: number) => void,
    onCreateRoom: () => void,
    onJoinRoom: (roomCode: string) => void,
    onLeaveRoom: () => void,
    onStartGame: () => void
  ) {

    this.onVsAI =
      onVsAI;

    this.onCreateRoom =
      onCreateRoom;

    this.onJoinRoom =
      onJoinRoom;

    this.onLeaveRoom =
      onLeaveRoom;

    this.onStartGame =
      onStartGame;

    this.container =
      document.createElement(
        'div'
      );

    this.container.id =
      'main-menu';

    document.body.appendChild(
      this.container
    );

    this.tadpoleScene =
      new THREE.Scene();

    this.tadpoleScene.background =
      null;

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

    this.tadpoleModel =
      tadpoleModel.clone(true);

    setPlayerFlashlightVisible(
      this.tadpoleModel,
      false
    );

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

    tadpoleModel.visible =
      false;

    this.showMainMenu();

    this.resize();
  }

  // ==============================
  // CLEAN UP AI SELECTOR
  // ==============================

  private destroyAISelector(): void {

    if (!this.aiSelector) {
      return;
    }

    this.aiSelector.destroy();
    this.aiSelector = null;

    this.tadpoleModel.visible =
      true;
  }

  // ==============================
  // MAIN MENU
  // ==============================

  private showMainMenu(): void {

    this.destroyAISelector();

    this.lobbyStartButton =
      null;

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

    this.attachTadpoleRenderer();

    document
      .getElementById('menu-ai')
      ?.addEventListener(
        'click',
        () => {
          this.showAISetup();
        }
      );

    document
      .getElementById('menu-friends')
      ?.addEventListener(
        'click',
        () => {
          this.showFriendsMenu();
        }
      );

    document
      .getElementById('menu-settings')
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

          setTimeout(
            () => {
              button.textContent =
                'SETTINGS';
            },
            1200
          );
        }
      );

    document
      .getElementById('menu-customize')
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

          setTimeout(
            () => {
              button.textContent =
                'CUSTOMIZE';
            },
            1200
          );
        }
      );

    this.container.style.display =
      'flex';

    this.resize();
  }

  // ==============================
  // AI SETUP
  // ==============================

  private showAISetup(): void {

    this.destroyAISelector();

    this.lobbyStartButton =
      null;

    this.container.innerHTML = `
      <div class="menu-content ai-setup-content">

        <div class="menu-left">

          <div class="game-title">
            TAGPOLE
          </div>

          <div class="game-subtitle">
            VS AI
          </div>

          <div class="ai-setup">

            <div class="ai-setup-label">
              CHOOSE YOUR OPPONENTS
            </div>

            <div
              id="ai-selector-container"
              class="ai-selector-container"
            ></div>

            <button
              id="ai-start"
              class="menu-button ai-start-button"
            >
              START GAME
            </button>

          </div>

        </div>

        <div class="menu-character ai-menu-character">

          <div
            id="menu-tadpole-container"
            class="menu-tadpole ai-menu-tadpole"
          ></div>

        </div>

      </div>

      <button
        id="ai-back"
        class="menu-button menu-back-button"
      >
        ← BACK
      </button>

      <div class="menu-version">
        TAGPOLE
      </div>
    `;

    const tadpoleContainer =
      document.getElementById(
        'menu-tadpole-container'
      );

    const selectorContainer =
      document.getElementById(
        'ai-selector-container'
      );

    if (
      !tadpoleContainer ||
      !selectorContainer
    ) {
      return;
    }

    /*
     * The selector uses the existing Three.js
     * renderer and scene, but hides the normal
     * single centered tadpole.
     */
    this.tadpoleModel.visible =
      false;

    tadpoleContainer.appendChild(
      this.tadpoleRenderer.domElement
    );

    /*
     * The radial selector itself is placed
     * over the renderer.
     */
    tadpoleContainer.appendChild(
      selectorContainer
    );

    this.aiSelector =
      new AISelector(
        this.tadpoleScene,
        this.tadpoleModel,
        tadpoleContainer,
        {
          onCountChanged:
            count => {

              this.selectedAICount =
                count;
            },
        }
      );

    document
      .getElementById('ai-start')
      ?.addEventListener(
        'click',
        () => {

          /*
           * Do not allow a zero-opponent
           * round to start.
           */
          if (
            this.selectedAICount < 1
          ) {
            return;
          }

          const count =
            this.selectedAICount;

          this.hide();

          this.onVsAI(
            count
          );
        }
      );

    document
      .getElementById('ai-back')
      ?.addEventListener(
        'click',
        () => {

          this.showMainMenu();
        }
      );

    this.container.style.display =
      'flex';

    this.resize();
  }

  // ==============================
  // FRIENDS MENU
  // ==============================

  showFriendsMenu(): void {

    this.destroyAISelector();

    this.lobbyStartButton =
      null;

    this.container.innerHTML = `
      <div class="menu-content">

        <div class="menu-left">

          <div class="game-title">
            TAGPOLE
          </div>

          <div class="game-subtitle">
            PLAY WITH FRIENDS
          </div>

          <div class="menu-buttons">

            <button
              id="menu-create-room"
              class="menu-button"
            >
              CREATE ROOM
            </button>

            <button
              id="menu-join-room"
              class="menu-button"
            >
              JOIN ROOM
            </button>

            <button
              id="menu-friends-back"
              class="menu-button menu-back-button"
            >
              ← BACK
            </button>

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

    this.attachTadpoleRenderer();

    document
      .getElementById(
        'menu-create-room'
      )
      ?.addEventListener(
        'click',
        () => {

          this.hide();

          this.onCreateRoom();
        }
      );

    document
      .getElementById(
        'menu-join-room'
      )
      ?.addEventListener(
        'click',
        () => {

          this.showJoinRoom();
        }
      );

    document
      .getElementById(
        'menu-friends-back'
      )
      ?.addEventListener(
        'click',
        () => {

          this.showMainMenu();
        }
      );

    this.container.style.display =
      'flex';

    this.resize();
  }

  // ==============================
  // JOIN ROOM
  // ==============================

  private showJoinRoom(): void {

    this.destroyAISelector();

    this.lobbyStartButton =
      null;

    this.container.innerHTML = `
      <div class="menu-content">

        <div class="menu-left">

          <div class="game-title">
            TAGPOLE
          </div>

          <div class="game-subtitle">
            JOIN ROOM
          </div>

          <div class="join-room-menu">

            <input
              id="join-room-input"
              class="join-room-input"
              type="text"
              maxlength="4"
              placeholder="ROOM CODE"
              autocomplete="off"
              autocapitalize="characters"
              spellcheck="false"
              inputmode="text"
            />

            <button
              id="join-room-button"
              class="menu-button"
            >
              JOIN
            </button>

            <button
              id="join-room-back"
              class="menu-button menu-back-button"
            >
              ← BACK
            </button>

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

    this.attachTadpoleRenderer();

    const input =
      document.getElementById(
        'join-room-input'
      ) as HTMLInputElement | null;

    const joinButton =
      document.getElementById(
        'join-room-button'
      );

    const backButton =
      document.getElementById(
        'join-room-back'
      );

    if (!input) {
      return;
    }

    input.addEventListener(
      'input',
      () => {

        input.value =
          input.value
            .toUpperCase()
            .replace(
              /[^A-Z0-9]/g,
              ''
            )
            .slice(
              0,
              4
            );
      }
    );

    const join = () => {

      const roomCode =
        input.value
          .trim()
          .toUpperCase();

      if (
        roomCode.length !== 4
      ) {

        input.focus();

        return;
      }

      this.hide();

      this.onJoinRoom(
        roomCode
      );
    };

    joinButton?.addEventListener(
      'click',
      join
    );

    input.addEventListener(
      'keydown',
      event => {

        if (
          event.key === 'Enter'
        ) {
          join();
        }
      }
    );

    backButton?.addEventListener(
      'click',
      () => {

        this.showFriendsMenu();
      }
    );

    this.container.style.display =
      'flex';

    this.resize();

    setTimeout(
      () => {
        input.focus();
      },
      50
    );
  }

  // ==============================
  // LOBBY
  // ==============================

  showLobby(
    roomCode: string,
    playerCount: number,
    maxPlayers: number,
    isHost: boolean
  ): void {

    this.destroyAISelector();

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

            ${
              isHost
                ? `
                  <button
                    id="lobby-start"
                    class="menu-button lobby-start-button"
                    ${
                      playerCount < 2
                        ? 'disabled'
                        : ''
                    }
                  >
                    START GAME
                  </button>
                `
                : `
                  <div class="lobby-waiting">
                    WAITING FOR HOST...
                  </div>
                `
            }

          </div>

        </div>

        <div class="menu-character">

          <div
            id="menu-tadpole-container"
            class="menu-tadpole"
          ></div>

        </div>

      </div>

      <button
        id="lobby-leave"
        class="menu-button lobby-leave-button"
      >
        LEAVE ROOM
      </button>

      <div class="menu-version">
        TAGPOLE
      </div>
    `;

    this.attachTadpoleRenderer();

    this.lobbyStartButton =
      document.getElementById(
        'lobby-start'
      ) as HTMLButtonElement | null;

    this.lobbyStartButton
      ?.addEventListener(
        'click',
        () => {

          if (
            !this.lobbyStartButton ||
            this.lobbyStartButton.disabled
          ) {
            return;
          }

          this.lobbyStartButton.disabled =
            true;

          this.lobbyStartButton.textContent =
            'STARTING...';

          this.onStartGame();
        }
      );

    document
      .getElementById(
        'lobby-leave'
      )
      ?.addEventListener(
        'click',
        () => {

          this.onLeaveRoom();
        }
      );

    this.container.style.display =
      'flex';

    this.resize();
  }

  // ==============================
  // ATTACH TADPOLE
  // ==============================

  private attachTadpoleRenderer(): void {

    const tadpoleContainer =
      document.getElementById(
        'menu-tadpole-container'
      );

    if (
      tadpoleContainer
    ) {

      tadpoleContainer.appendChild(
        this.tadpoleRenderer.domElement
      );
    }
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    time: number
  ): void {

    if (
      !this.isVisible()
    ) {
      return;
    }

    if (this.aiSelector) {

      this.aiSelector.update(
        time
      );

    } else {

      const seconds =
        time * 0.001;

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

      const scale =
        1.7 +
        Math.sin(
          seconds * 1.5
        ) * 0.035;

      this.tadpoleModel.scale.setScalar(
        scale
      );
    }

    this.tadpoleRenderer.render(
      this.tadpoleScene,
      this.tadpoleCamera
    );
  }

  // ==============================
  // RESIZE
  // ==============================

  resize(): void {

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

    this.tadpoleCamera
      .updateProjectionMatrix();

    this.tadpoleRenderer.setSize(
      width,
      height,
      false
    );
  }

  // ==============================
  // SHOW
  // ==============================

  show(): void {

    this.container.style.display =
      'flex';

    this.showMainMenu();
  }

  // ==============================
  // HIDE
  // ==============================

  hide(): void {

    this.destroyAISelector();

    this.container.style.display =
      'none';
  }

  // ==============================
  // VISIBLE
  // ==============================

  isVisible(): boolean {

    return (
      this.container.style.display !==
      'none'
    );
  }
}