import { Server } from 'socket.io';
import * as Y from 'yjs';
import { env } from '../config/env.js';
import * as yjs from '../services/yjs.service.js';
import * as roomService from '../services/room.service.js';
import { isValidRoomId } from '../utils/roomId.js';
import { isValidLanguage } from '../utils/languages.js';
import { logger } from '../utils/logger.js';

const MAX_UPDATE_BYTES = 512 * 1024;
const toUint8 = (data) => (data instanceof Uint8Array ? data : new Uint8Array(data));

export function initSockets(httpServer, sessionMiddleware) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
    maxHttpBufferSize: 1e6,
    pingInterval: 25000,
    pingTimeout: 30000,
    connectTimeout: 20000,
    allowEIO3: true,
  });

  // Share the Express session so sockets know who is logged in.
  io.engine.use(sessionMiddleware);

  const broadcastPresence = (roomId) => {
    const count = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;
    io.to(roomId).emit('room:presence', { count });
  };

  io.on('connection', (socket) => {
    const userId = socket.request.session?.userId;

    socket.on('error', (err) => {
      logger.warn('socket error', socket.id, err?.message || err);
    });

    const leave = () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      socket.leave(roomId);
      socket.data.roomId = null;
      yjs.release(roomId, socket.id);
      broadcastPresence(roomId);
    };

    socket.on('room:join', async (payload, ack) => {
      if (typeof ack !== 'function') return;
      try {
        const roomId = payload?.roomId;
        if (!isValidRoomId(roomId)) return ack({ ok: false, error: 'INVALID_ROOM' });
        if (socket.data.roomId === roomId) return ack({ ok: false, error: 'ALREADY_JOINED' });
        leave();

        const entry = await yjs.acquire(roomId, socket.id, userId);
        socket.join(roomId);
        socket.data.roomId = roomId;

        ack({
          ok: true,
          state: Y.encodeStateAsUpdate(entry.doc),
          language: entry.language,
          title: entry.title,
        });
        broadcastPresence(roomId);
        socket.to(roomId).emit('awareness:request', {}); // peers re-send their cursors to the newcomer
      } catch (err) {
        logger.error('room:join failed', err.message);
        ack({ ok: false, error: 'JOIN_FAILED' });
      }
    });

    socket.on('yjs:update', (payload) => {
      const roomId = socket.data.roomId; // trust the server, not the client
      if (!roomId || !payload?.update) return;
      const update = toUint8(payload.update);
      if (update.byteLength > MAX_UPDATE_BYTES) return;
      try {
        if (yjs.applyUpdate(roomId, update, socket.id)) {
          socket.to(roomId).emit('yjs:update', { update });
        }
      } catch (err) {
        logger.warn('bad yjs update ignored', err.message);
      }
    });

    socket.on('awareness:update', (payload) => {
      const roomId = socket.data.roomId;
      if (!roomId || !payload?.update) return;
      socket.to(roomId).volatile.emit('awareness:update', { update: toUint8(payload.update) });
    });

    socket.on('room:language', async (payload) => {
      const roomId = socket.data.roomId;
      const language = payload?.language;
      if (!roomId || !isValidLanguage(language)) return;
      const entry = yjs.getEntry(roomId);
      if (entry) entry.language = language;
      await roomService.setLanguage(roomId, language).catch((e) => logger.error(e.message));
      socket.to(roomId).emit('room:language', { language });
    });

    socket.on('disconnect', leave);
  });

  return io;
}
