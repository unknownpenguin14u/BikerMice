import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = Number(process.env.PORT || 3003);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'biker-mice-multiplayer' });
});

const rooms = new Map();

function getOrCreateRoom(roomCode) {
  const normalized = String(roomCode || '').trim().toUpperCase();
  if (!rooms.has(normalized)) {
    rooms.set(normalized, {
      roomCode: normalized,
      players: new Map(),
      state: { started: false, countdown: 3 },
      config: { trackId: null, playerCharId: null },
      race: {},
    });
  }
  return rooms.get(normalized);
}

function sanitizePlayer(payload) {
  return {
    id: payload.id,
    name: payload.name,
    color: payload.color,
    connected: true,
  };
}

io.on('connection', (socket) => {
  socket.on('create-room', ({ roomCode, playerName, color }) => {
    const normalized = String(roomCode || '').trim().toUpperCase();
    const room = getOrCreateRoom(normalized);
    const id = socket.id;
    room.players.set(id, sanitizePlayer({ id, name: playerName || 'Player 1', color: color || '#cc3333' }));
    socket.join(normalized);
    socket.data.roomCode = normalized;
    socket.emit('room-state', {
      roomCode: normalized,
      players: [...room.players.values()],
      state: room.state,
      config: room.config,
      host: id,
    });
    io.to(normalized).emit('room-state', {
      roomCode: normalized,
      players: [...room.players.values()],
      state: room.state,
      config: room.config,
      host: [...room.players.keys()][0],
    });
  });

  socket.on('join-room', ({ roomCode, playerName, color }) => {
    const normalized = String(roomCode || '').trim().toUpperCase();
    const room = getOrCreateRoom(normalized);
    const id = socket.id;
    room.players.set(id, sanitizePlayer({ id, name: playerName || 'Player 2', color: color || '#2dd4bf' }));
    socket.join(normalized);
    socket.data.roomCode = normalized;
    socket.emit('room-state', {
      roomCode: normalized,
      players: [...room.players.values()],
      state: room.state,
      config: room.config,
      host: [...room.players.keys()][0],
    });
    io.to(normalized).emit('room-state', {
      roomCode: normalized,
      players: [...room.players.values()],
      state: room.state,
      config: room.config,
      host: [...room.players.keys()][0],
    });
  });

  socket.on('room-config', ({ roomCode, trackId, playerCharId }) => {
    const normalized = String(roomCode || socket.data.roomCode || '').trim().toUpperCase();
    const room = rooms.get(normalized);
    if (!room) return;
    room.config = {
      trackId: trackId || room.config.trackId,
      playerCharId: playerCharId || room.config.playerCharId,
    };
    io.to(normalized).emit('room-config', {
      roomCode: normalized,
      trackId: room.config.trackId,
      playerCharId: room.config.playerCharId,
    });
  });

  socket.on('start-race', ({ roomCode }) => {
    const normalized = String(roomCode || socket.data.roomCode || '').trim().toUpperCase();
    const room = rooms.get(normalized);
    if (!room || socket.data.roomCode !== normalized) return;
    room.state.started = true;
    room.state.countdown = 3;
    io.to(normalized).emit('race-start', { roomCode: normalized, countdown: 3, trackId: room.config.trackId || null });
  });

  socket.on('client-race-state', ({ roomCode, racerState }) => {
    const normalized = String(roomCode || socket.data.roomCode || '').trim().toUpperCase();
    const room = rooms.get(normalized);
    if (!room || !racerState?.id) return;
    room.race[socket.id] = {
      ...racerState,
      socketId: socket.id,
      roomCode: normalized,
    };
    io.to(normalized).emit('race-state', {
      roomCode: normalized,
      racers: Object.values(room.race),
    });
  });

  socket.on('input-state', ({ roomCode, input }) => {
    const normalized = String(roomCode || socket.data.roomCode || '').trim().toUpperCase();
    if (!normalized) return;
    socket.to(normalized).emit('remote-input', { socketId: socket.id, input });
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    room.players.delete(socket.id);
    delete room.race[socket.id];
    if (room.players.size === 0) {
      rooms.delete(roomCode);
      return;
    }
    io.to(roomCode).emit('room-state', {
      roomCode,
      players: [...room.players.values()],
      state: room.state,
      host: [...room.players.keys()][0],
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Multiplayer server running on http://0.0.0.0:${PORT}`);
});
