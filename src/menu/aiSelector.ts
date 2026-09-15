import * as THREE from 'three';

import {
  setPlayerFlashlightVisible,
} from '../player/playerModel';

export interface AISelectorCallbacks {
  onCountChanged: (count: number) => void;
}

interface SelectorTadpole {
  model: THREE.Group;
  positionIndex: number;
}

export class AISelector {

  private readonly scene: THREE.Scene;
  private readonly sourceModel: THREE.Group;
  private readonly container: HTMLElement;
  private readonly callbacks: AISelectorCallbacks;

  private readonly maxOpponents = 11;

  /*
   * MENU-ONLY positions.
   *
   * These positions have nothing to do with
   * actual game-world spawn positions.
   *
   * 0  = player at 12 o'clock
   * 1  = 1 o'clock
   * 2  = 2 o'clock
   * ...
   * 11 = 11 o'clock
   */
  private readonly clockPositions: THREE.Vector3[] = [];

  private playerTadpole:
    THREE.Group | null = null;

  private aiTadpoles:
    SelectorTadpole[] = [];

  private selectedCount = 0;

  private arrow:
    HTMLButtonElement | null = null;

  private centerNumber:
    HTMLElement | null = null;

  private centerLabel:
    HTMLElement | null = null;

  private dragging = false;

  private pointerId:
    number | null = null;

  private centerX = 0;
  private centerY = 0;

  /*
   * Distance of tadpoles from the center
   * of the selector.
   */
  private readonly tadpoleRadius = 170;

  /*
   * Distance of the arrow from the center.
   */
  private readonly arrowRadius = 225;

  /*
   * Bound handlers allow us to remove the
   * global listeners when the selector dies.
   */
  private readonly handlePointerMove =
    (event: PointerEvent): void => {

      if (
        !this.dragging ||
        this.pointerId === null ||
        event.pointerId !== this.pointerId
      ) {
        return;
      }

      this.updateDrag(event);
    };

  private readonly handlePointerUp =
    (event: PointerEvent): void => {

      if (
        this.pointerId === null ||
        event.pointerId !== this.pointerId
      ) {
        return;
      }

      this.endDrag();
    };

  private readonly handlePointerCancel =
    (event: PointerEvent): void => {

      if (
        this.pointerId === null ||
        event.pointerId !== this.pointerId
      ) {
        return;
      }

      this.endDrag();
    };

  constructor(
    scene: THREE.Scene,
    sourceModel: THREE.Group,
    container: HTMLElement,
    callbacks: AISelectorCallbacks
  ) {

    this.scene = scene;
    this.sourceModel = sourceModel;
    this.container = container;
    this.callbacks = callbacks;

    this.createClockPositions();
    this.createInterface();
    this.createPlayerTadpole();

    this.updateVisuals();
    this.attachPointerEvents();
  }

  // ==============================
  // CLOCK POSITIONS
  // ==============================

  private createClockPositions(): void {

    this.clockPositions.length = 0;

    for (let i = 0; i < 12; i++) {

      const angle =
        (i / 12) *
        Math.PI *
        2;

      this.clockPositions.push(
        new THREE.Vector3(
          Math.sin(angle) *
            this.tadpoleRadius /
            100,

          Math.cos(angle) *
            this.tadpoleRadius /
            100,

          0
        )
      );
    }
  }

  // ==============================
  // INTERFACE
  // ==============================

  private createInterface(): void {

    this.container
      .querySelector(
        '.ai-selector'
      )
      ?.remove();

    const selector =
      document.createElement('div');

    selector.className =
      'ai-selector';

    selector.innerHTML = `

      <div class="ai-selector-ring"></div>

      <div class="ai-selector-center">

        <div
          class="ai-selector-number"
          id="ai-selector-number"
        >
          0
        </div>

        <div
          class="ai-selector-label"
          id="ai-selector-label"
        >
          OPPONENTS
        </div>

      </div>

      <button
        class="ai-selector-arrow"
        id="ai-selector-arrow"
        type="button"
        aria-label="Drag to choose opponents"
      >
        <span>↔</span>
      </button>

    `;

    this.container.appendChild(
      selector
    );

    this.arrow =
      selector.querySelector(
        '#ai-selector-arrow'
      ) as HTMLButtonElement | null;

    this.centerNumber =
      selector.querySelector(
        '#ai-selector-number'
      );

    this.centerLabel =
      selector.querySelector(
        '#ai-selector-label'
      );
  }

  // ==============================
  // PLAYER
  // ==============================

  private createPlayerTadpole(): void {

    this.playerTadpole =
      this.sourceModel.clone(true);

    setPlayerFlashlightVisible(
      this.playerTadpole,
      false
    );

    this.playerTadpole.visible =
      true;

    this.playerTadpole.position.copy(
      this.clockPositions[0]
    );

    this.playerTadpole.rotation.set(
      0,
      Math.PI * 0.75,
      0
    );

    this.playerTadpole.scale.setScalar(
      0.72
    );

    this.scene.add(
      this.playerTadpole
    );
  }

  // ==============================
  // AI TADPOLE
  // ==============================

  private createAITadpole(
    positionIndex: number
  ): void {

    const model =
      this.sourceModel.clone(true);

    setPlayerFlashlightVisible(
      model,
      false
    );

    model.visible = true;

    model.position.copy(
      this.clockPositions[positionIndex]
    );

    model.rotation.set(
      0,
      Math.PI * 0.75,
      0
    );

    model.scale.setScalar(
      0.58
    );

    this.scene.add(
      model
    );

    this.aiTadpoles.push({
      model,
      positionIndex,
    });
  }

  private disposeModel(
    model: THREE.Group
  ): void {

    model.traverse(
      object => {

        const mesh =
          object as THREE.Mesh;

        if (!mesh.isMesh) {
          return;
        }

        mesh.geometry.dispose();

        if (
          Array.isArray(
            mesh.material
          )
        ) {

          mesh.material.forEach(
            material => {
              material.dispose();
            }
          );

        } else {

          mesh.material.dispose();
        }
      }
    );
  }

  private removeLastAITadpole(): void {

    const tadpole =
      this.aiTadpoles.pop();

    if (!tadpole) {
      return;
    }

    tadpole.model.removeFromParent();

    this.disposeModel(
      tadpole.model
    );
  }

  // ==============================
  // COUNT
  // ==============================

  private setCount(
    count: number
  ): void {

    const nextCount =
      THREE.MathUtils.clamp(
        Math.floor(count),
        0,
        this.maxOpponents
      );

    if (
      nextCount ===
      this.selectedCount
    ) {
      this.updateVisuals();
      return;
    }

    while (
      this.selectedCount <
      nextCount
    ) {

      this.selectedCount++;

      this.createAITadpole(
        this.selectedCount
      );
    }

    while (
      this.selectedCount >
      nextCount
    ) {

      this.removeLastAITadpole();

      this.selectedCount--;
    }

    this.updateVisuals();

    this.callbacks.onCountChanged(
      this.selectedCount
    );
  }

  // ==============================
  // VISUALS
  // ==============================

  private updateVisuals(): void {

    if (this.centerNumber) {

      this.centerNumber.textContent =
        String(
          this.selectedCount
        );
    }

    if (this.centerLabel) {

      this.centerLabel.textContent =
        this.selectedCount === 1
          ? 'OPPONENT'
          : 'OPPONENTS';
    }

    this.positionArrow();
  }

  // ==============================
  // ARROW
  // ==============================

  private positionArrow(): void {

    if (!this.arrow) {
      return;
    }

    /*
     * The arrow represents the next position
     * that can be selected.
     *
     * Count 0  -> 12 o'clock
     * Count 1  -> 1 o'clock
     * Count 2  -> 2 o'clock
     * ...
     * Count 11 -> 11 o'clock
     *
     * There is intentionally NO modulo here.
     * This prevents the arrow from wrapping
     * around the clock.
     */
    const positionIndex =
      THREE.MathUtils.clamp(
        this.selectedCount,
        0,
        this.maxOpponents
      );

    const angle =
      (positionIndex / 12) *
      Math.PI *
      2;

    const x =
      Math.sin(angle) *
      this.arrowRadius;

    const y =
      -Math.cos(angle) *
      this.arrowRadius;

    /*
     * The double-sided arrow stays tangent
     * to the clock.
     */
    const rotation =
      positionIndex * 30;

    this.arrow.style.left =
      `calc(50% + ${x}px)`;

    this.arrow.style.top =
      `calc(50% + ${y}px)`;

    this.arrow.style.transform =
      `translate(-50%, -50%) rotate(${rotation}deg)`;
  }

  // ==============================
  // POINTER EVENTS
  // ==============================

  private attachPointerEvents(): void {

    if (!this.arrow) {
      return;
    }

    this.arrow.addEventListener(
      'pointerdown',
      this.handlePointerDown
    );

    window.addEventListener(
      'pointermove',
      this.handlePointerMove
    );

    window.addEventListener(
      'pointerup',
      this.handlePointerUp
    );

    window.addEventListener(
      'pointercancel',
      this.handlePointerCancel
    );
  }

  private readonly handlePointerDown =
    (event: PointerEvent): void => {

      if (!this.arrow) {
        return;
      }

      event.preventDefault();

      this.dragging = true;

      this.pointerId =
        event.pointerId;

      const rect =
        this.container.getBoundingClientRect();

      this.centerX =
        rect.left +
        rect.width / 2;

      this.centerY =
        rect.top +
        rect.height / 2;

      this.arrow.setPointerCapture?.(
        event.pointerId
      );
    };

  // ==============================
  // DRAGGING
  // ==============================

  private updateDrag(
    event: PointerEvent
  ): void {

    const dx =
      event.clientX -
      this.centerX;

    const dy =
      event.clientY -
      this.centerY;

    /*
     * Ignore the center so dragging doesn't
     * accidentally jump to another position.
     */
    if (
      Math.hypot(
        dx,
        dy
      ) < 55
    ) {
      return;
    }

    /*
     * Convert pointer position to a clock angle.
     *
     * 12 = 0°
     * 1  = 30°
     * 2  = 60°
     * ...
     * 11 = 330°
     */
    let angle =
      Math.atan2(
        dx,
        -dy
      );

    if (angle < 0) {
      angle +=
        Math.PI * 2;
    }

    const rawPosition =
      angle /
      (Math.PI * 2 / 12);

    /*
     * Round to the nearest clock position.
     *
     * IMPORTANT:
     * Do NOT use % 12 here.
     *
     * The selector has a hard range:
     *
     * 0 -> 11
     */
    const position =
      Math.round(
        rawPosition
      );

    const desiredCount =
      THREE.MathUtils.clamp(
        position,
        0,
        this.maxOpponents
      );

    /*
     * This means:
     *
     * Drag clockwise:
     * 0 -> 1 -> 2 -> ... -> 11
     *
     * Drag counter-clockwise:
     * 11 -> 10 -> 9 -> ... -> 0
     *
     * The arrow can never wrap around.
     */
    if (
      desiredCount !==
      this.selectedCount
    ) {

      this.setCount(
        desiredCount
      );
    }
  }

  private endDrag(): void {

    this.dragging = false;

    this.pointerId = null;
  }

  // ==============================
  // UPDATE
  // ==============================

  update(
    time: number
  ): void {

    const seconds =
      time * 0.001;

    // ------------------------------
    // PLAYER
    // ------------------------------

    if (this.playerTadpole) {

      const player =
        this.playerTadpole;

      player.position.copy(
        this.clockPositions[0]
      );

      player.position.y +=
        Math.sin(
          seconds * 1.5
        ) * 0.045;

      player.rotation.y =
        Math.PI * 0.75 +
        Math.sin(
          seconds * 0.8
        ) * 0.12;

      player.rotation.z =
        Math.sin(
          seconds * 1.2
        ) * 0.06;

      player.rotation.x =
        Math.sin(
          seconds * 1.7
        ) * 0.035;

      player.scale.setScalar(
        0.72 +
        Math.sin(
          seconds * 1.5
        ) * 0.015
      );
    }

    // ------------------------------
    // AI
    // ------------------------------

    for (
      const tadpole
      of this.aiTadpoles
    ) {

      const base =
        this.clockPositions[
          tadpole.positionIndex
        ];

      tadpole.model.position.copy(
        base
      );

      const offset =
        tadpole.positionIndex *
        0.35;

      tadpole.model.position.y +=
        Math.sin(
          seconds * 1.5 +
          offset
        ) * 0.045;

      tadpole.model.rotation.y =
        Math.PI * 0.75 +
        Math.sin(
          seconds * 0.8 +
          offset
        ) * 0.12;

      tadpole.model.rotation.z =
        Math.sin(
          seconds * 1.2 +
          offset
        ) * 0.06;

      tadpole.model.rotation.x =
        Math.sin(
          seconds * 1.7 +
          offset
        ) * 0.035;

      tadpole.model.scale.setScalar(
        0.58 +
        Math.sin(
          seconds * 1.5 +
          offset
        ) * 0.012
      );
    }
  }

  // ==============================
  // GET COUNT
  // ==============================

  getCount(): number {
    return this.selectedCount;
  }

  // ==============================
  // DESTROY
  // ==============================

  destroy(): void {

    this.endDrag();

    window.removeEventListener(
      'pointermove',
      this.handlePointerMove
    );

    window.removeEventListener(
      'pointerup',
      this.handlePointerUp
    );

    window.removeEventListener(
      'pointercancel',
      this.handlePointerCancel
    );

    this.arrow?.removeEventListener(
      'pointerdown',
      this.handlePointerDown
    );

    if (this.playerTadpole) {

      this.playerTadpole.removeFromParent();

      this.disposeModel(
        this.playerTadpole
      );

      this.playerTadpole = null;
    }

    for (
      const tadpole
      of this.aiTadpoles
    ) {

      tadpole.model.removeFromParent();

      this.disposeModel(
        tadpole.model
      );
    }

    this.aiTadpoles.length = 0;

    this.container
      .querySelector(
        '.ai-selector'
      )
      ?.remove();

    this.arrow = null;
    this.centerNumber = null;
    this.centerLabel = null;

    this.clockPositions.length = 0;
  }
}