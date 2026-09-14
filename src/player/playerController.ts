import * as THREE from 'three';

import { gameState } from '../game/gameState';
import type { NetworkPlayer } from '../game/gameState';
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
  updateNetworkState(
    networkPlayer: NetworkPlayer
  ): void;
}

export interface PlayerControllerDependencies {
  player: Player;
  gameFlow: GameFlow;
  hud: ReturnType<typeof createGameHud>;
  getLocalTrapBubble: () => LocalTrapBubble | null;
  setLocalTrapBubble: (
    bubble: LocalTrapBubble | null
  ) => void;
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

    player.setNetworkTrapTiming(
      null,
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

    player.setNetworkTrapTiming(
      null,
      null
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

  const updateNetworkState = (
    networkPlayer: NetworkPlayer
  ): void => {

    /*
     * Server says this player drowned.
     */
    if (
      networkPlayer.isDrowned
    ) {

      if (
        !gameState.playerDead
      ) {
        die();
      }

      return;
    }

    /*
     * Server says this player is trapped.
     */
    if (
      networkPlayer.trapped
    ) {

      player.setNetworkTrapTiming(
        networkPlayer.trappedAt,
        networkPlayer.trapEndAt
      );

      /*
       * The local trap bubble should already
       * exist when possible. If it doesn't,
       * multiplayerController creates it.
       */
      const bubble =
        getLocalTrapBubble();

      if (
        !gameState.playerTrapped &&
        !gameState.playerDead &&
        bubble
      ) {

        trap(
          bubble.mesh
        );
      }

      return;
    }

    /*
     * Server says this player is no longer
     * trapped.
     */
    if (
      !networkPlayer.trapped &&
      gameState.playerTrapped &&
      !gameState.playerDead
    ) {

      clearTrap();
    }
  };

  return {
    clearTrap,
    trap,
    die,
    reset,
    updateNetworkState,
  };
}