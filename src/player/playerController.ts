import * as THREE from 'three';

import { gameState } from '../game/gameState';
import type { GameFlow } from '../game/gameFlow';
import type { Player } from './player';
import type { LocalTrapBubble } from './combat/localTrapBubble';
import { clearLocalTrapBubble } from './combat/localTrapBubble';
import type { createGameHud } from '../ui/gameHud';

export interface PlayerController {
  clearTrap(): void;
  trap(bubble: THREE.Mesh): void;
  die(): void;
  reset(): void;
}

export interface PlayerControllerDependencies {
  player: Player;
  gameFlow: GameFlow;
  hud: ReturnType<typeof createGameHud>;
  getLocalTrapBubble: () => LocalTrapBubble | null;
  setLocalTrapBubble: (bubble: LocalTrapBubble | null) => void;
}

export function createPlayerController(
  dependencies: PlayerControllerDependencies
): PlayerController {
  const {
    player,
    gameFlow,
    hud,
    getLocalTrapBubble,
    setLocalTrapBubble,
  } = dependencies;

  const clearTrap = (): void => {
    const bubble =
      getLocalTrapBubble();

    clearLocalTrapBubble(
      bubble
    );

    setLocalTrapBubble(
      null
    );

    player.setTrapped(
      false
    );

    gameFlow.setTrapped(
      false
    );

    hud.setTrapped(
      false,
      null
    );

    hud.setCrosshairVisible(
      true
    );
  };

  const trap = (
    bubble: THREE.Mesh
  ): void => {
    if (
      gameState.playerDead ||
      gameState.playerTrapped
    ) {
      return;
    }

    gameFlow.setTrapped(
      true
    );

    player.setTrapped(
      true,
      bubble
    );

    hud.setAlive(
      true
    );

    hud.setTrapped(
      true,
      bubble
    );

    hud.setCrosshairVisible(
      false
    );
  };

  const die = (): void => {
    if (
      gameState.playerDead
    ) {
      return;
    }

    gameFlow.playerDied();
  };

  const reset = (): void => {
    clearTrap();

    player.setTrapped(
      false
    );

    player.model.visible =
      false;

    player.camera.position.set(
      0,
      0,
      10
    );

    player.camera.rotation.set(
      0,
      0,
      0
    );

    player.camera.rotation.order =
      'YXZ';

    hud.setAlive(
      true
    );

    hud.setTrapped(
      false,
      null
    );

    hud.setCrosshairVisible(
      true
    );
  };

  return {
    clearTrap,
    trap,
    die,
    reset,
  };
}