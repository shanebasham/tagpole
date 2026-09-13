export interface PauseMenuCallbacks {
  onResume: () => void;
  onExit: () => void;
}

export interface PauseMenu {
  show(): void;
  hide(): void;
  toggle(): void;
  isVisible(): boolean;
  destroy(): void;
}

export function createPauseMenu(callbacks: PauseMenuCallbacks): PauseMenu {
  let visible = false;

  const menu = document.createElement('div');

  menu.id = 'exit-menu';

  menu.innerHTML = `
    <div id="exit-menu-panel">
      <div id="exit-menu-title">
        PAUSED
      </div>

      <div id="exit-menu-subtitle">
        LEAVE THE HUNT?
      </div>

      <div id="exit-menu-buttons">
        <button id="resume-button" type="button">
          RESUME
        </button>

        <button id="exit-to-menu-button" type="button">
          EXIT TO MAIN MENU
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(menu);

  const resumeButton =
    menu.querySelector<HTMLButtonElement>(
      '#resume-button'
    );

  const exitButton =
    menu.querySelector<HTMLButtonElement>(
      '#exit-to-menu-button'
    );

  const show = (): void => {
    visible = true;
    menu.classList.add('visible');
  };

  const hide = (): void => {
    visible = false;
    menu.classList.remove('visible');
  };

  resumeButton?.addEventListener(
    'click',
    () => {
      hide();
      callbacks.onResume();
    }
  );

  exitButton?.addEventListener(
    'click',
    () => {
      hide();
      callbacks.onExit();
    }
  );

  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();

      if (visible) {
        hide();
        callbacks.onResume();
        return;
      }

      show();
    }
  );

  return {
    show,
    hide,

    toggle(): void {
      if (visible) {
        hide();
      } else {
        show();
      }
    },

    isVisible(): boolean {
      return visible;
    },

    destroy(): void {
      menu.remove();
    },
  };
}