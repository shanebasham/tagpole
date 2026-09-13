import './style.css';

export interface MobileControls {
  attackButton: HTMLElement | null;
  boostButton: HTMLElement | null;
  exitButton: HTMLElement | null;

  isMobile: boolean;

  setVisible(visible: boolean): void;
  setBoostEnabled(enabled: boolean): void;
  setAttackEnabled(enabled: boolean): void;
  destroy(): void;
}

function detectMobile(): boolean {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
}

export function createMobileControls(): MobileControls {
  const isMobile = detectMobile();

  const attackButton =
    document.getElementById('mobile-attack');

  const boostButton =
    document.getElementById('mobile-boost');

  const exitButton =
    document.getElementById('mobile-exit');

  const controls: MobileControls = {
    attackButton,
    boostButton,
    exitButton,

    isMobile,

    setVisible(visible: boolean) {
      const method = visible ? 'remove' : 'add';

      attackButton?.classList[method]('hidden');
      boostButton?.classList[method]('hidden');
      exitButton?.classList[method]('hidden');
    },

    setBoostEnabled(enabled: boolean) {
      if (!boostButton) return;

      boostButton.classList.toggle(
        'disabled',
        !enabled
      );
    },

    setAttackEnabled(enabled: boolean) {
      if (!attackButton) return;

      attackButton.classList.toggle(
        'disabled',
        !enabled
      );
    },

    destroy() {
      // Buttons belong to the HUD/menu system.
      // We only remove listeners created by this module.
    },
  };

  return controls;
}