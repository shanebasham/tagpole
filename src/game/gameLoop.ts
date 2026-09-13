export interface GameLoopCallbacks {
  update: (delta: number, now: number) => void;
  render: () => void;
}

export class GameLoop {

  private readonly callbacks: GameLoopCallbacks;

  private animationFrame = 0;
  private running = false;
  private lastTime = 0;

  constructor(
    callbacks: GameLoopCallbacks
  ) {
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.lastTime =
      performance.now();

    this.animationFrame =
      requestAnimationFrame(
        this.tick
      );
  }

  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    cancelAnimationFrame(
      this.animationFrame
    );
  }

  isRunning(): boolean {
    return this.running;
  }

  private tick = (
    now: number
  ): void => {
    if (!this.running) {
      return;
    }

    const rawDelta =
      (now - this.lastTime) /
      1000;

    const delta =
      Math.min(
        rawDelta,
        0.05
      );

    this.lastTime =
      now;

    this.callbacks.update(
      delta,
      now
    );

    this.callbacks.render();

    this.animationFrame =
      requestAnimationFrame(
        this.tick
      );
  };
}