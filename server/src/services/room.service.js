import { Room } from '../models/Room.js';
import { generateRoomId } from '../utils/roomId.js';

// Upsert so that visiting any valid /r/:id link works, like codeshare.io.
export async function findOrCreate(roomId, ownerId) {
  const query = { roomId };
  const insert = { roomId, ...(ownerId ? { owner: ownerId } : {}) };
  try {
    return await Room.findOneAndUpdate(query, { $setOnInsert: insert }, { upsert: true, new: true });
  } catch (err) {
    if (err.code === 11000) return Room.findOne(query); // concurrent upsert race
    throw err;
  }
}

export async function createRoom({ ownerId, language }) {
  for (let i = 0; i < 5; i += 1) {
    try {
      return await Room.create({ roomId: generateRoomId(), owner: ownerId, language });
    } catch (err) {
      if (err.code !== 11000) throw err;
    }
  }
  throw new Error('Could not allocate a room id');
}

export const listByOwner = (ownerId) =>
  Room.find({ owner: ownerId })
    .sort({ updatedAt: -1 })
    .limit(100)
    .select('roomId title language snippet updatedAt');

export const findById = (roomId) => Room.findOne({ roomId }).select('-ydocState');
export const claim = (roomId, ownerId) =>
  Room.findOneAndUpdate({ roomId, owner: { $exists: false } }, { owner: ownerId }, { new: true });
export const rename = (roomId, ownerId, title) =>
  Room.findOneAndUpdate({ roomId, owner: ownerId }, { title }, { new: true });
export const remove = (roomId, ownerId) => Room.deleteOne({ roomId, owner: ownerId });
export const setLanguage = (roomId, language) => Room.updateOne({ roomId }, { language });
