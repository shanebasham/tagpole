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
}

interface Room {
  code: string;
  hostId: string;
  phase:
    | 'lobby'
    | 'playing'
    | 'ended';
  players: Map<WebSocket, Player>;
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
// SERVER START
// ==============================

console.log(
  `TAGPOLE multiplayer server starting on ${HOST}:${PORT}`
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
// BROADCAST ROOM STATE
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
      12,

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
            12
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

          storedPlayer.alive =
            Boolean(
              networkPlayer.alive
            );

          storedPlayer.trapped =
            Boolean(
              networkPlayer.trapped
            );

          storedPlayer.isDrowned =
            Boolean(
              networkPlayer.isDrowned
            );

          broadcastRoomState(
            currentRoom
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

server.listen(
  PORT,
  HOST,
  () => {

    console.log(
      `TAGPOLE server listening on ${HOST}:${PORT}`
    );
  }
);