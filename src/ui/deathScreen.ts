import './style.css';

export function createDeathScreen(
  onRestart: () => void,
  onMainMenu: () => void
) {
  const deathScreen =
    document.createElement('div');

  deathScreen.id =
    'death-screen';

  deathScreen.innerHTML = `
    <div id="death-title">
      YOU DIED
    </div>

    <div id="death-subtitle">
      THE SURFACE CLAIMED YOU
    </div>

    <div id="death-buttons">

      <button
        id="restart-button"
      >
        START AGAIN
      </button>

      <button
        id="main-menu-button"
      >
        MAIN MENU
      </button>

    </div>
  `;

  document.body.appendChild(
    deathScreen
  );

  const restartButton =
    document.getElementById(
      'restart-button'
    );

  restartButton?.addEventListener(
    'click',
    onRestart
  );

  const mainMenuButton =
    document.getElementById(
      'main-menu-button'
    );

  mainMenuButton?.addEventListener(
    'click',
    onMainMenu
  );

  return {
    show() {
      deathScreen.classList.add(
        'visible'
      );

      if (
        typeof document.exitPointerLock ===
        'function'
      ) {
        document.exitPointerLock();
      }
    },

    hide() {
      deathScreen.classList.remove(
        'visible'
      );
    },
  };
}