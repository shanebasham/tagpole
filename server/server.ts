import http from 'http';

import path from 'path';

import fs from 'fs';

import {
  WebSocketServer,
  WebSocket
} from 'ws';

import {
  randomUUID
} from 'crypto';

const PORT =
  Number(process.env.PORT) || 3001;

const HOST =
  '0.0.0.0';

const SURFACE_Y =
  30;

const BUBBLE_RISE_SPEED =
  2;

const MAX_PLAYERS =
  12;

const ATTACK_RANGE =
  12;

const ATTACK_FACING_THRESHOLD =
  0.5;

interface Player {

  id: string;

  x: number;
  y: number;
  z: number;

  yaw: number;
  pitch: number;

  vx: number;
  vy: number;
  vz: number;

  alive: boolean;
  trapped: boolean;
  isDrowned: boolean;

  trappedAt:
    number | null;

  trapEndAt:
    number | null;
}

interface Room {

  code: string;

  hostId: string;

  phase:
    | 'lobby'
    | 'playing'
    | 'ended';

  players:
    Map<WebSocket, Player>;
}

const rooms =
  new Map<string, Room>();

// ==============================
// HTTP SERVER
// ==============================

const server =
  http.createServer(
    (
      request,
      response
    ) => {

      const url =
        new URL(
          request.url || '/',
          `http://${request.headers.host || 'localhost'}`
        );

      let filePath =
        url.pathname === '/'
          ? path.join(
              process.cwd(),
              'dist',
              'index.html'
            )
          : path.join(
              process.cwd(),
              'dist',
              url.pathname
            );

      const distPath =
        path.resolve(
          process.cwd(),
          'dist'
        );

      filePath =
        path.resolve(
          filePath
        );

      if (
        !filePath.startsWith(
          distPath
        )
      ) {

        response.writeHead(
          403
        );

        response.end(
          'Forbidden'
        );

        return;
      }

      if (
        !fs.existsSync(
          filePath
        ) ||
        fs.statSync(
          filePath
        ).isDirectory()
      ) {

        filePath =
          path.join(
            distPath,
            'index.html'
          );
      }

      if (
        !fs.existsSync(
          filePath
        )
      ) {

        response.writeHead(
          404
        );

        response.end(
          'TAGPOLE build not found.'
        );

        return;
      }

      const extension =
        path.extname(
          filePath
        );

      const contentTypes:
        Record<string, string> = {

        '.html':
          'text/html; charset=utf-8',

        '.js':
          'application/javascript',

        '.css':
          'text/css',

        '.json':
          'application/json',

        '.svg':
          'image/svg+xml',

        '.png':
          'image/png',

        '.jpg':
          'image/jpeg',

        '.jpeg':
          'image/jpeg',

        '.webp':
          'image/webp',

        '.ico':
          'image/x-icon',
      };

      const contentType =
        contentTypes[
          extension
        ] ||
        'application/octet-stream';

      try {

        const file =
          fs.readFileSync(
            filePath
          );

        response.writeHead(
          200,
          {
            'Content-Type':
              contentType,
          }
        );

        response.end(
          file
        );

      } catch {

        response.writeHead(
          500
        );

        response.end(
          'Internal server error.'
        );
      }
    }
  );

// ==============================
// WEBSOCKET SERVER
// ==============================

const wss =
  new WebSocketServer({
    noServer: true,
  });

server.on(
  'upgrade',
  (
    request,
    socket,
    head
  ) => {

    if (
      request.headers.upgrade?.toLowerCase() !==
      'websocket'
    ) {

      socket.destroy();

      return;
    }

    wss.handleUpgrade(
      request,
      socket,
      head,
      (webSocket) => {

        wss.emit(
          'connection',
          webSocket,
          request
        );
      }
    );
  }
);

// ==============================
// ROOM CODE
// ==============================

function createRoomCode() {

  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code =
    '';

  do {

    code =
      '';

    for (
      let i = 0;
      i < 4;
      i++
    ) {

      code +=
        characters[
          Math.floor(
            Math.random() *
            characters.length
          )
        ];
    }

  } while (
    rooms.has(
      code
    )
  );

  return code;
}

// ==============================
// SEND
// ==============================

function send(
  socket: WebSocket,
  message: unknown
) {

  if (
    socket.readyState ===
    WebSocket.OPEN
  ) {

    socket.send(
      JSON.stringify(
        message
      )
    );
  }
}

// ==============================
// BROADCAST
// ==============================

function broadcastRoomState(
  room: Room
) {

  const players =
    Array.from(
      room.players.values()
    );

  const state = {

    phase:
      room.phase,

    players,

    maxPlayers:
      MAX_PLAYERS,

    hostId:
      room.hostId,
  };

  for (
    const socket of
    room.players.keys()
  ) {

    send(
      socket,
      {
        type:
          'game-state',

        state,
      }
    );
  }
}

// ==============================
// RESET PLAYERS
// ==============================

function resetPlayers(
  room: Room
) {

  let index =
    0;

  for (
    const player of
    room.players.values()
  ) {

    player.x =
      index * 4;

    player.y =
      0;

    player.z =
      10;

    player.yaw =
      0;

    player.pitch =
      0;

    player.vx =
      0;

    player.vy =
      0;

    player.vz =
      0;

    player.alive =
      true;

    player.trapped =
      false;

    player.isDrowned =
      false;

    player.trappedAt =
      null;

    player.trapEndAt =
      null;

    index++;
  }
}

// ==============================
// CHECK ROUND END
// ==============================

function checkRoundEnd(
  room: Room
) {

  if (
    room.phase !==
    'playing'
  ) {
    return;
  }

  const alivePlayers =
    Array.from(
      room.players.values()
    ).filter(
      (player) =>
        player.alive &&
        !player.isDrowned
    );

  if (
    alivePlayers.length <= 1
  ) {

    room.phase =
      'ended';

    console.log(
      `Game ended in room: ${room.code}`
    );

    broadcastRoomState(
      room
    );
  }
}

// ==============================
// DROWN PLAYER
// ==============================

function drownPlayer(
  room: Room,
  target: Player
) {

  if (
    !target.trapped ||
    target.isDrowned
  ) {
    return;
  }

  target.trapped =
    false;

  target.alive =
    false;

  target.isDrowned =
    true;

  target.trappedAt =
    null;

  target.trapEndAt =
    null;

  console.log(
    `Player drowned in room ${room.code}: ${target.id}`
  );

  broadcastRoomState(
    room
  );

  checkRoundEnd(
    room
  );
}

// ==============================
// TRAP PLAYER
// ==============================

function trapPlayer(
  room: Room,
  attacker: Player,
  target: Player
) {

  if (
    room.phase !==
    'playing'
  ) {
    return;
  }

  if (
    attacker.id ===
    target.id
  ) {
    return;
  }

  if (
    !attacker.alive ||
    attacker.trapped ||
    attacker.isDrowned
  ) {
    return;
  }

  if (
    !target.alive ||
    target.trapped ||
    target.isDrowned
  ) {
    return;
  }

  const dx =
    target.x -
    attacker.x;

  const dy =
    target.y -
    attacker.y;

  const dz =
    target.z -
    attacker.z;

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz
    );

  if (
    distance >
    ATTACK_RANGE
  ) {
    return;
  }

  const targetYaw =
    Math.atan2(
      dx,
      dz
    );

  const yawDifference =
    Math.atan2(
      Math.sin(
        targetYaw -
        attacker.yaw
      ),
      Math.cos(
        targetYaw -
        attacker.yaw
      )
    );

  const facing =
    Math.cos(
      yawDifference
    );

  if (
    facing <
    ATTACK_FACING_THRESHOLD
  ) {
    return;
  }

  const now =
    Date.now();

  const distanceToSurface =
    Math.max(
      0,
      SURFACE_Y -
      target.y
    );

  const trapDuration =
    (
      distanceToSurface /
      BUBBLE_RISE_SPEED
    ) *
    1000;

  target.trapped =
    true;

  target.trappedAt =
    now;

  target.trapEndAt =
    now +
    trapDuration;

  console.log(
    `Player ${attacker.id} trapped player ${target.id} in room ${room.code}`
  );

  broadcastRoomState(
    room
  );

  setTimeout(
    () => {

      if (
        !room.players.has(
          findSocketForPlayer(
            room,
            target.id
          ) as WebSocket
        )
      ) {
        return;
      }

      if (
        target.trapped &&
        target.trapEndAt !== null &&
        Date.now() >=
          target.trapEndAt
      ) {

        drownPlayer(
          room,
          target
        );
      }

    },
    Math.max(
      0,
      trapDuration
    ) + 50
  );
}

// ==============================
// FIND SOCKET
// ==============================

function findSocketForPlayer(
  room: Room,
  playerId: string
): WebSocket | null {

  for (
    const [
      socket,
      player
    ] of room.players
  ) {

    if (
      player.id ===
      playerId
    ) {

      return socket;
    }
  }

  return null;
}

// ==============================
// CONNECTION
// ==============================

wss.on(
  'connection',
  (socket) => {

    const playerId =
      randomUUID();

    let currentRoom:
      Room | null =
      null;

    const player:
      Player = {

      id:
        playerId,

      x:
        0,

      y:
        0,

      z:
        0,

      yaw:
        0,

      pitch:
        0,

      vx:
        0,

      vy:
        0,

      vz:
        0,

      alive:
        true,

      trapped:
        false,

      isDrowned:
        false,

      trappedAt:
        null,

      trapEndAt:
        null,
    };

    console.log(
      `Player connected: ${playerId}`
    );

    send(
      socket,
      {
        type:
          'connected',

        playerId,
      }
    );

    // ==============================
    // MESSAGE
    // ==============================

    socket.on(
      'message',
      (data) => {

        let message:
          any;

        try {

          message =
            JSON.parse(
              data.toString()
            );

        } catch {

          send(
            socket,
            {
              type:
                'error',

              message:
                'Invalid message.',
            }
          );

          return;
        }

        // ==============================
        // CREATE ROOM
        // ==============================

        if (
          message.type ===
          'create-room'
        ) {

          if (
            currentRoom
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'Already in a room.',
              }
            );

            return;
          }

          const code =
            createRoomCode();

          const room:
            Room = {

            code,

            hostId:
              playerId,

            phase:
              'lobby',

            players:
              new Map(),
          };

          room.players.set(
            socket,
            player
          );

          rooms.set(
            code,
            room
          );

          currentRoom =
            room;

          console.log(
            `Room created: ${code}`
          );

          send(
            socket,
            {
              type:
                'room-created',

              roomCode:
                code,
            }
          );

          broadcastRoomState(
            room
          );

          return;
        }

        // ==============================
        // JOIN ROOM
        // ==============================

        if (
          message.type ===
          'join-room'
        ) {

          if (
            currentRoom
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'Already in a room.',
              }
            );

            return;
          }

          const code =
            String(
              message.roomCode ||
              ''
            )
              .trim()
              .toUpperCase();

          const room =
            rooms.get(
              code
            );

          if (
            !room
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'Room not found.',
              }
            );

            return;
          }

          if (
            room.players.size >=
            MAX_PLAYERS
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'Room is full.',
              }
            );

            return;
          }

          if (
            room.phase !==
            'lobby'
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'Game already started.',
              }
            );

            return;
          }

          room.players.set(
            socket,
            player
          );

          currentRoom =
            room;

          console.log(
            `Player joined room: ${code}`
          );

          send(
            socket,
            {
              type:
                'room-joined',

              roomCode:
                code,
            }
          );

          broadcastRoomState(
            room
          );

          return;
        }

        // ==============================
        // START GAME
        // ==============================

        if (
          message.type ===
          'start-game'
        ) {

          if (
            !currentRoom
          ) {
            return;
          }

          if (
            playerId !==
            currentRoom.hostId
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'Only the host can start the game.',
              }
            );

            return;
          }

          if (
            currentRoom.players.size <
            2
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'At least 2 players are required.',
              }
            );

            return;
          }

          if (
            currentRoom.phase !==
            'lobby'
          ) {
            return;
          }

          resetPlayers(
            currentRoom
          );

          currentRoom.phase =
            'playing';

          console.log(
            `Game started in room: ${currentRoom.code}`
          );

          broadcastRoomState(
            currentRoom
          );

          return;
        }

        // ==============================
        // PLAY AGAIN
        // ==============================

        if (
          message.type ===
          'play-again'
        ) {

          if (
            !currentRoom
          ) {
            return;
          }

          if (
            playerId !==
            currentRoom.hostId
          ) {

            send(
              socket,
              {
                type:
                  'error',

                message:
                  'Only the host can start another round.',
              }
            );

            return;
          }

          if (
            currentRoom.phase !==
            'ended'
          ) {
            return;
          }

          resetPlayers(
            currentRoom
          );

          currentRoom.phase =
            'lobby';

          console.log(
            `Returning room ${currentRoom.code} to lobby`
          );

          broadcastRoomState(
            currentRoom
          );

          return;
        }

        // ==============================
        // PLAYER STATE
        // ==============================

        if (
          message.type ===
          'player-state'
        ) {

          if (
            !currentRoom
          ) {
            return;
          }

          const networkPlayer =
            message.player;

          if (
            !networkPlayer ||
            networkPlayer.id !==
              playerId
          ) {
            return;
          }

          const storedPlayer =
            currentRoom.players.get(
              socket
            );

          if (
            !storedPlayer
          ) {
            return;
          }

          storedPlayer.x =
            Number(
              networkPlayer.x
            ) || 0;

          storedPlayer.y =
            Number(
              networkPlayer.y
            ) || 0;

          storedPlayer.z =
            Number(
              networkPlayer.z
            ) || 0;

          storedPlayer.yaw =
            Number(
              networkPlayer.yaw
            ) || 0;

          storedPlayer.pitch =
            Number(
              networkPlayer.pitch
            ) || 0;

          storedPlayer.vx =
            Number(
              networkPlayer.vx
            ) || 0;

          storedPlayer.vy =
            Number(
              networkPlayer.vy
            ) || 0;

          storedPlayer.vz =
            Number(
              networkPlayer.vz
            ) || 0;

          // IMPORTANT:
          // alive/trapped/isDrowned are
          // server-authoritative.

          broadcastRoomState(
            currentRoom
          );

          return;
        }

        // ==============================
        // TRAP PLAYER
        // ==============================

        if (
          message.type ===
          'trap-player'
        ) {

          if (
            !currentRoom
          ) {
            return;
          }

          const attacker =
            currentRoom.players.get(
              socket
            );

          if (
            !attacker
          ) {
            return;
          }

          const targetId =
            String(
              message.targetId ||
              ''
            );

          const targetSocket =
            findSocketForPlayer(
              currentRoom,
              targetId
            );

          if (
            !targetSocket
          ) {
            return;
          }

          const target =
            currentRoom.players.get(
              targetSocket
            );

          if (
            !target
          ) {
            return;
          }

          trapPlayer(
            currentRoom,
            attacker,
            target
          );

          return;
        }

        // ==============================
        // LEAVE ROOM
        // ==============================

        if (
          message.type ===
          'leave-room'
        ) {

          if (
            !currentRoom
          ) {
            return;
          }

          removePlayer(
            socket,
            currentRoom
          );

          currentRoom =
            null;

          return;
        }
      }
    );

    // ==============================
    // DISCONNECT
    // ==============================

    socket.on(
      'close',
      () => {

        console.log(
          `Player disconnected: ${playerId}`
        );

        if (
          currentRoom
        ) {

          removePlayer(
            socket,
            currentRoom
          );
        }
      }
    );
  }
);

// ==============================
// REMOVE PLAYER
// ==============================

function removePlayer(
  socket: WebSocket,
  room: Room
) {

  const leavingPlayer =
    room.players.get(
      socket
    );

  room.players.delete(
    socket
  );

  console.log(
    `Player left room: ${room.code}`
  );

  if (
    room.players.size ===
    0
  ) {

    rooms.delete(
      room.code
    );

    console.log(
      `Room deleted: ${room.code}`
    );

    return;
  }

  // ==============================
  // HOST LEFT
  // ==============================

  if (
    leavingPlayer &&
    room.hostId ===
      leavingPlayer.id
  ) {

    const newHost =
      room.players
        .values()
        .next()
        .value as Player;

    room.hostId =
      newHost.id;

    room.phase =
      'lobby';

    resetPlayers(
      room
    );

    console.log(
      `New host in room ${room.code}: ${room.hostId}`
    );
  }

  broadcastRoomState(
    room
  );
}

// ==============================
// LISTEN
// ==============================

console.log(
  `TAGPOLE multiplayer server starting on ${HOST}:${PORT}`
);

server.listen(
  PORT,
  HOST,
  () => {

    console.log(
      `TAGPOLE server listening on ${HOST}:${PORT}`
    );
  }
);