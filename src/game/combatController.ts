import * as THREE from 'three';

import { gameState } from './gameState';
import type { MultiplayerClient } from '../multiplayer/multiplayerClient';
import type { RemotePlayerManager } from '../multiplayer/remotePlayerManager';
import type { Player } from '../player/player';
import type { AIManager } from '../player/ai/aiManager';
import { updateLocalTrapBubble } from '../player/combat/localTrapBubble';
import type { LocalTrapBubble } from '../player/combat/localTrapBubble';

export interface CombatController {
  update(delta: number): void;
  updateCombatTargets(): void;
}

export interface CombatControllerDependencies {
  scene: THREE.Scene;
  player: Player;
  aiManager: AIManager;
  remotePlayerManager: RemotePlayerManager;
  multiplayer: MultiplayerClient;
  getLocalTrapBubble: () => LocalTrapBubble | null;
}

export function createCombatController(
  dependencies: CombatControllerDependencies
): CombatController {
  const {
    scene,
    player,
    aiManager,
    remotePlayerManager,
    multiplayer,
    getLocalTrapBubble,
  } = dependencies;

  let multiplayerSendTimer =
    0;

  const updateCombatTargets = (): void => {
    if (
      gameState.multiplayer
    ) {
      player.setCombatTargets(
        remotePlayerManager.getCombatTargets()
      );

      return;
    }

    player.setCombatTargets(
      aiManager.getCombatTargets()
    );
  };

  const sendMultiplayerPlayerState = (): void => {
    if (
      !gameState.multiplayer ||
      !gameState.started
    ) {
      return;
    }

    multiplayer.sendPlayerState(
      player.getNetworkState()
    );
  };

  const updateMultiplayerSending = (
    delta: number
  ): void => {
    if (
      !gameState.multiplayer
    ) {
      return;
    }

    multiplayerSendTimer +=
      delta;

    if (
      multiplayerSendTimer <
      0.05
    ) {
      return;
    }

    multiplayerSendTimer =
      0;

    sendMultiplayerPlayerState();
  };

  const updateTrapBubble = (): void => {
    const localTrapBubble =
      getLocalTrapBubble();

    if (
      !gameState.multiplayer ||
      !gameState.playerTrapped ||
      !localTrapBubble
    ) {
      return;
    }

    updateLocalTrapBubble(
      localTrapBubble,
      player.position,
      30
    );
  };

  return {
    update(delta: number): void {
      updateTrapBubble();

      player.update(
        delta
      );

      player.updateCombat(
        delta,
        scene
      );

      updateMultiplayerSending(
        delta
      );
    },

    updateCombatTargets,
  };
}