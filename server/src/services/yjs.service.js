import * as Y from 'yjs';
import { Room } from '../models/Room.js';
import * as roomService from './room.service.js';
import { logger } from '../utils/logger.js';

/**
 * Keeps one in-memory Y.Doc per active room.
 * - loaded from MongoDB when the first socket joins
 * - persisted (debounced) after edits
 * - flushed + evicted when the last socket leaves
 * NOTE: in-memory state means ONE server instance per room. To scale horizontally,
 * add the Socket.IO Redis adapter + sticky sessions (see docs/ARCHITECTURE.md).
 */
const entries = new Map(); // roomId -> { doc, sockets:Set, timer, language, title, loading }
const flushing = new Map(); // roomId -> Promise
const PERSIST_DEBOUNCE_MS = 2000;

async function persist(roomId, doc) {
  try {
    const state = Buffer.from(Y.encodeStateAsUpdate(doc));
    const snippet = doc.getText('code').toString().slice(0, 240);
    await Room.updateOne({ roomId }, { ydocState: state, snippet });
  } catch (err) {
    logger.error('persist failed', roomId, err.message);
  }
}

async function loadDoc(roomId, entry, ownerId) {
  const room = await roomService.findOrCreate(roomId, ownerId);
  const doc = new Y.Doc();
  if (room.ydocState?.length) Y.applyUpdate(doc, new Uint8Array(room.ydocState));
  doc.on('update', () => {
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => persist(roomId, doc), PERSIST_DEBOUNCE_MS);
  });
  entry.doc = doc;
  entry.language = room.language;
  entry.title = room.title;
}

export async function acquire(roomId, socketId, ownerId) {
  if (flushing.has(roomId)) await flushing.get(roomId);
  let entry = entries.get(roomId);
  if (!entry) {
    entry = { doc: null, sockets: new Set(), timer: null, language: 'plaintext', title: 'Untitled' };
    entries.set(roomId, entry);
    entry.loading = loadDoc(roomId, entry, ownerId).catch((err) => {
      entries.delete(roomId);
      throw err;
    });
  }
  entry.sockets.add(socketId);
  try {
    await entry.loading;
  } catch (err) {
    entry.sockets.delete(socketId);
    throw err;
  }
  return entry;
}

export function release(roomId, socketId) {
  const entry = entries.get(roomId);
  if (!entry) return;
  entry.sockets.delete(socketId);
  if (entry.sockets.size > 0) return;

  entries.delete(roomId);
  clearTimeout(entry.timer);
  const p = persist(roomId, entry.doc).finally(() => {
    entry.doc.destroy();
    flushing.delete(roomId);
  });
  flushing.set(roomId, p);
}

export function applyUpdate(roomId, update, origin) {
  const entry = entries.get(roomId);
  if (!entry?.doc) return false;
  Y.applyUpdate(entry.doc, update, origin);
  return true;
}

export const getEntry = (roomId) => entries.get(roomId);

export async function flushAll() {
  await Promise.all([...entries.entries()].filter(([, e]) => e.doc).map(([id, e]) => persist(id, e.doc)));
}
