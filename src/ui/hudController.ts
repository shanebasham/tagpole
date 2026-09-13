import * as THREE from 'three';

import { gameState } from '../game/gameState';
import type { MultiplayerClient } from '../multiplayer/multiplayerClient';
import type { AIManager } from '../player/ai/aiManager';
import { getBoostCooldown } from '../player/movement';
import type { Player } from '../player/player';
import type { LocalTrapBubble } from '../player/combat/localTrapBubble';
import type { createGameHud } from './gameHud';

export interface HudController {
  update(): void;
}

export interface HudControllerDependencies {
  hud: ReturnType<typeof createGameHud>;
  player: Player;
  aiManager: AIManager;
  multiplayer: MultiplayerClient;
  getLocalTrapBubble: () => LocalTrapBubble | null;
}

export function createHudController(
  dependencies: HudControllerDependencies
): HudController {
  const {
    hud,
    player,
    aiManager,
    multiplayer,
    getLocalTrapBubble,
  } = dependencies;

  const mobileBoost =
    document.getElementById(
      'mobile-boost'
    );

  const mobileAttack =
    document.getElementById(
      'mobile-attack'
    );

  const updatePlayersAlive = (): void => {
    if (
      gameState.multiplayer
    ) {
      const state =
        multiplayer.getGameState();

      if (
        state
      ) {
        hud.setPlayersAlive(
          state.players.filter(
            (networkPlayer) =>
              networkPlayer.alive
          ).length
        );
      }

      return;
    }

    const aliveAITadpoles =
      aiManager.getAliveCount();

    hud.setPlayersAlive(
      aliveAITadpoles +
      (
        gameState.playerDead
          ? 0
          : 1
      )
    );
  };

  const updateTrapped = (): void => {
    let activeBubble:
      THREE.Mesh | null =
      null;

    if (
      gameState.playerTrapped &&
      !gameState.playerDead
    ) {
      if (
        gameState.multiplayer
      ) {
        activeBubble =
          getLocalTrapBubble()?.mesh ??
          null;
      } else {
        const bubble =
          aiManager.getAll()
            .find(
              (ai) =>
                ai.bubble
            );

        activeBubble =
          bubble?.bubble ??
          null;
      }
    }

    hud.updateTrapped(
      activeBubble
    );
  };

  const updateAttack = (): void => {
    const attackCooldown =
      player.getAttackCooldown();

    const attackUsable =
      !gameState.playerTrapped &&
      !gameState.playerDead;

    hud.updateAttack(
      attackCooldown,
      attackUsable
    );

    if (
      !mobileAttack
    ) {
      return;
    }

    if (
      !attackUsable
    ) {
      mobileAttack.textContent =
        '( / )';

      mobileAttack.classList.add(
        'locked'
      );

      return;
    }

    mobileAttack.classList.remove(
      'locked'
    );

    if (
      attackCooldown <= 0
    ) {
      mobileAttack.textContent =
        'BURST';
    } else {
      mobileAttack.textContent =
        `BURST ${attackCooldown.toFixed(1)}`;
    }
  };

  const updateBoost = (): void => {
    const boostCooldown =
      getBoostCooldown();

    const boostUsable =
      !gameState.playerTrapped &&
      !gameState.playerDead;

    hud.updateBoost(
      boostCooldown,
      boostUsable
    );

    if (
      !mobileBoost
    ) {
      return;
    }

    if (
      !boostUsable
    ) {
      mobileBoost.textContent =
        '( / )';

      mobileBoost.classList.add(
        'locked'
      );

      return;
    }

    mobileBoost.classList.remove(
      'locked'
    );

    if (
      boostCooldown <= 0
    ) {
      mobileBoost.textContent =
        'BOOST';
    } else {
      mobileBoost.textContent =
        `BOOST ${boostCooldown.toFixed(1)}`;
    }
  };

  return {
    update(): void {
      updatePlayersAlive();

      hud.updateDepth(
        player.camera
      );

      updateTrapped();

      updateAttack();

      updateBoost();
    },
  };
}