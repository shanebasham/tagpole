import './style.css';

export type DeathScreenMode =
  | 'death'
  | 'round-over'
  | 'victory';

export function createDeathScreen(
  onSpectate: () => void,
  onReturnToLobby: () => void,
  onPlayAgain: () => void,
  lockPointer: () => void
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

      <button id="spectate-button">
        SPECTATE
      </button>

      <button id="play-again-button">
        PLAY AGAIN
      </button>

      <button id="main-menu-button">
        RETURN TO LOBBY
      </button>

    </div>
  `;

  document.body.appendChild(
    deathScreen
  );

  const deathTitle =
    document.getElementById(
      'death-title'
    );

  const deathSubtitle =
    document.getElementById(
      'death-subtitle'
    );

  const spectateButton =
    document.getElementById(
      'spectate-button'
    );

  const playAgainButton =
    document.getElementById(
      'play-again-button'
    );

  const mainMenuButton =
    document.getElementById(
      'main-menu-button'
    );

  spectateButton?.addEventListener(
    'click',
    () => {

      deathScreen.classList.remove(
        'visible'
      );

      onSpectate();

      lockPointer();
    }
  );

  playAgainButton?.addEventListener(
    'click',
    () => {

      deathScreen.classList.remove(
        'visible'
      );

      onPlayAgain();

      lockPointer();
    }
  );

  mainMenuButton?.addEventListener(
    'click',
    () => {

      deathScreen.classList.remove(
        'visible'
      );

      onReturnToLobby();
    }
  );

  return {

    show(
      mode: DeathScreenMode = 'death',
      isHost = false
    ) {

      // ==========================
      // DEATH
      // ==========================

      if (
        mode === 'death'
      ) {

        if (deathTitle) {
          deathTitle.textContent =
            'YOU DIED';
        }

        if (deathSubtitle) {
          deathSubtitle.textContent =
            'THE SURFACE CLAIMED YOU';
        }

        if (spectateButton) {
          spectateButton.style.display =
            'block';
        }

        if (playAgainButton) {
          playAgainButton.style.display =
            'block';

          playAgainButton.textContent =
            'PLAY AGAIN';
        }

        if (mainMenuButton) {
          mainMenuButton.textContent =
            'RETURN TO LOBBY';
        }
      }

      // ==========================
      // VICTORY
      // ==========================

      else if (
        mode === 'victory'
      ) {

        if (deathTitle) {
          deathTitle.textContent =
            'YOU WIN';
        }

        if (deathSubtitle) {
          deathSubtitle.textContent =
            'ALL CREATURES HAVE BEEN ELIMINATED';
        }

        if (spectateButton) {
          spectateButton.style.display =
            'none';
        }

        if (playAgainButton) {
          playAgainButton.style.display =
            'block';

          playAgainButton.textContent =
            'PLAY AGAIN';
        }

        if (mainMenuButton) {
          mainMenuButton.textContent =
            'RETURN TO MENU';
        }
      }

      // ==========================
      // MULTIPLAYER ROUND OVER
      // ==========================

      else {

        if (deathTitle) {
          deathTitle.textContent =
            'ROUND OVER';
        }

        if (deathSubtitle) {
          deathSubtitle.textContent =
            'THE HUNT HAS ENDED';
        }

        if (spectateButton) {
          spectateButton.style.display =
            'none';
        }

        if (playAgainButton) {

          playAgainButton.style.display =
            isHost
              ? 'block'
              : 'none';

          playAgainButton.textContent =
            isHost
              ? 'PLAY AGAIN'
              : 'WAITING FOR HOST...';
        }

        if (mainMenuButton) {
          mainMenuButton.textContent =
            'RETURN TO LOBBY';
        }
      }

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

    setWaitingForHost() {

      if (playAgainButton) {

        playAgainButton.style.display =
          'block';

        playAgainButton.textContent =
          'WAITING FOR HOST...';
      }
    }
  };
}