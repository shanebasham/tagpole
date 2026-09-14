import * as THREE from 'three';

import type {
  NetworkPlayer
} from '../game/gameState';

import {
  RemotePlayer
} from './remotePlayer';

export interface RemotePlayerMultiplayer {

  sendTrapPlayer(
    targetId: string
  ): void;
}

export class RemotePlayerManager {

  private readonly scene:
    THREE.Scene;

  private readonly multiplayer:
    RemotePlayerMultiplayer;

  private readonly players =
    new Map<
      string,
      RemotePlayer
    >();

  constructor(
    scene: THREE.Scene,
    multiplayer: RemotePlayerMultiplayer
  ) {

    this.scene =
      scene;

    this.multiplayer =
      multiplayer;
  }

  update(
    networkPlayers: NetworkPlayer[],
    localPlayerId: string | null
  ): void {

    const activeIds =
      new Set<string>();

    for (
      const player
      of networkPlayers
    ) {

      if (
        player.id ===
        localPlayerId
      ) {
        continue;
      }

      activeIds.add(
        player.id
      );

      let remote =
        this.players.get(
          player.id
        );

      if (
        !remote
      ) {

        remote =
          new RemotePlayer(
            this.scene,
            player,
            this.multiplayer
          );

        this.players.set(
          player.id,
          remote
        );

      } else {

        remote.updateFromNetwork(
          player
        );
      }
    }

    for (
      const [
        id,
        remote
      ]
      of this.players
    ) {

      if (
        activeIds.has(id)
      ) {
        continue;
      }

      remote.destroy();

      this.players.delete(
        id
      );
    }
  }

  updateMovement(
    delta: number
  ): void {

    for (
      const remote
      of this.players.values()
    ) {

      remote.update(
        delta
      );
    }
  }

  get(
    id: string
  ):
    RemotePlayer | undefined {

    return this.players.get(
      id
    );
  }

  getAll():
    RemotePlayer[] {

    return Array.from(
      this.players.values()
    );
  }

  getCombatTargets():
    RemotePlayer[] {

    return this.getAll();
  }

  getAliveCount():
    number {

    let count =
      0;

    for (
      const remote
      of this.players.values()
    ) {

      if (
        remote.isAlive()
      ) {

        count++;
      }
    }

    return count;
  }

  clear(): void {

    for (
      const remote
      of this.players.values()
    ) {

      remote.destroy();
    }

    this.players.clear();
  }

  size(): number {

    return this.players.size;
  }
}