import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

const PORT = 3001;

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
  players: Map<WebSocket, Player>;
}

const rooms =
  new Map<string, Room>();

const wss =
  new WebSocketServer({
    port: PORT,
  });

console.log(
  `TAGPOLE multiplayer server running on port ${PORT}`
);

// ==============================
// ROOM CODE
// ==============================

function createRoomCode() {
  const characters =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  do {
    code = '';

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
    rooms.has(code)
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
// BROADCAST STATE
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
      'lobby',

    players,

    maxPlayers:
      12,
  };

  for (
    const socket of room.players.keys()
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

    const player: Player = {
      id: playerId,

      x: 0,
      y: 0,
      z: 0,

      yaw: 0,
      pitch: 0,

      vx: 0,
      vy: 0,
      vz: 0,

      alive: true,
      trapped: false,
      isDrowned: false,
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

    // ============================
    // MESSAGE
    // ============================

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

        // ========================
        // CREATE ROOM
        // ========================

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

          const room: Room = {
            code,

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

        // ========================
        // JOIN ROOM
        // ========================

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

        // ========================
        // PLAYER STATE
        // ========================

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

        // ========================
        // LEAVE ROOM
        // ========================

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

    // ============================
    // DISCONNECT
    // ============================

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

  broadcastRoomState(
    room
  );
}