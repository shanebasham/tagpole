import * as THREE from 'three';

import {
  gameState
} from '../../game/gameState';

import type {
  MultiplayerClient
} from '../../multiplayer/multiplayerClient';

import type {
  RemotePlayerManager
} from '../../multiplayer/remotePlayerManager';

import type {
  Player
} from '../player';

import type {
  AIManager
} from '../ai/aiManager';

import {
  updateLocalTrapBubble
} from './localTrapBubble';

import type {
  LocalTrapBubble
} from './localTrapBubble';

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
  getLocalTrapBubble:
    () => LocalTrapBubble | null;
}

export function createCombatController(
  dependencies:
    CombatControllerDependencies
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

  // ========================================
  // LOCAL BUBBLE -> MULTIPLAYER
  // ========================================

  player.setBubbleFiredListener(
    (
      position,
      velocity
    ) => {

      if (
        !gameState.multiplayer ||
        !gameState.started
      ) {

        return;
      }

      if (
        multiplayer.getStatus() !==
        'connected'
      ) {

        return;
      }

      multiplayer.sendBubbleFired(
        position,
        velocity
      );
    }
  );

  // ========================================
  // REMOTE BUBBLE -> LOCAL VISUAL
  // ========================================

  multiplayer.addBubbleFiredListener(
    (
      shooterId,
      position,
      velocity
    ) => {

      if (
        !gameState.multiplayer ||
        !gameState.started
      ) {

        return;
      }

      if (
        shooterId ===
        multiplayer.getPlayerId()
      ) {

        return;
      }

      player.showRemoteBubble(
        scene,
        position,
        velocity
      );
    }
  );

  const updateCombatTargets =
    (): void => {

      if (
        gameState.multiplayer
      ) {

        player.setCombatTargets(
          remotePlayerManager
            .getCombatTargets()
        );

        return;
      }

      player.setCombatTargets(
        aiManager.getCombatTargets()
      );
    };

  const sendMultiplayerPlayerState =
    (): void => {

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

  const updateMultiplayerSending =
    (
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

  const updateTrapBubble =
    (): void => {

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
        30
      );
    };

  return {

    update(
      delta: number
    ): void {

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