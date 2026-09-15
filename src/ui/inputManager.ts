import { gameState } from '../game/gameState';
import type { Player } from '../player/player';
import type { PauseMenu } from './pauseMenu';

export interface InputManager {
  destroy(): void;
}

export function createInputManager(
  player: Player,
  pauseMenu: PauseMenu
): InputManager {

  const mobileAttack =
    document.getElementById(
      'mobile-attack'
    );

  const mobileExit =
    document.createElement(
      'button'
    );

  mobileExit.id =
    'mobile-exit';

  mobileExit.textContent =
    'EXIT';

  document.body.appendChild(
    mobileExit
  );

  const attack = (): void => {

    if (
      !gameState.started ||
      gameState.playerDead ||
      gameState.playerTrapped
    ) {
      return;
    }

    if (
      player.getAttackCooldown() > 0
    ) {
      return;
    }

    player.startAttack();
  };

  const handleMobileAttack = (
    event: PointerEvent
  ): void => {

    event.preventDefault();
    event.stopPropagation();

    attack();
  };

  const handleMouseDown = (
    event: MouseEvent
  ): void => {

    if (
      event.button !== 0
    ) {
      return;
    }

    attack();
  };

  const handleMobileExit = (): void => {

    if (
      pauseMenu.isVisible()
    ) {

      return;
    }

    if (
      !gameState.started ||
      gameState.playerDead
    ) {
      return;
    }

    pauseMenu.show();
  };

  mobileAttack?.addEventListener(
    'pointerdown',
    handleMobileAttack
  );

  window.addEventListener(
    'mousedown',
    handleMouseDown
  );

  mobileExit.addEventListener(
    'click',
    handleMobileExit
  );

  return {

    destroy(): void {

      mobileAttack?.removeEventListener(
        'pointerdown',
        handleMobileAttack
      );

      window.removeEventListener(
        'mousedown',
        handleMouseDown
      );

      mobileExit.removeEventListener(
        'click',
        handleMobileExit
      );

      mobileExit.remove();
    },
  };
}