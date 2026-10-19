import { z } from 'zod';
import * as rooms from '../services/room.service.js';
import { AppError } from '../utils/AppError.js';
import { isValidRoomId } from '../utils/roomId.js';
import { LANGUAGES } from '../utils/languages.js';

const createSchema = z.object({ language: z.enum(LANGUAGES).optional() });
const renameSchema = z.object({ title: z.string().trim().min(1).max(80) });

const publicRoom = (r) => ({
  roomId: r.roomId,
  title: r.title,
  language: r.language,
  snippet: r.snippet,
  updatedAt: r.updatedAt,
});

function paramId(req) {
  if (!isValidRoomId(req.params.roomId)) throw new AppError(400, 'Invalid room id', 'INVALID_ROOM');
  return req.params.roomId;
}

export async function create(req, res) {
  const { language } = createSchema.parse(req.body ?? {});
  const room = await rooms.createRoom({ ownerId: req.session?.userId, language });
  res.status(201).json({ room: publicRoom(room) });
}

export async function mine(req, res) {
  const list = await rooms.listByOwner(req.session.userId);
  res.json({ rooms: list.map(publicRoom) });
}

export async function getOne(req, res) {
  const room = await rooms.findById(paramId(req));
  if (!room) throw new AppError(404, 'Room not found', 'NOT_FOUND');
  res.json({
    room: {
      ...publicRoom(room),
      claimed: Boolean(room.owner),
      isOwner: Boolean(room.owner && room.owner.toString() === req.session?.userId),
    },
  });
}

export async function claim(req, res) {
  const room = await rooms.claim(paramId(req), req.session.userId);
  if (!room) throw new AppError(409, 'This room already has an owner', 'ALREADY_CLAIMED');
  res.json({ room: publicRoom(room) });
}

export async function rename(req, res) {
  const { title } = renameSchema.parse(req.body);
  const room = await rooms.rename(paramId(req), req.session.userId, title);
  if (!room) throw new AppError(404, 'Room not found or not yours', 'NOT_FOUND');
  res.json({ room: publicRoom(room) });
}

export async function remove(req, res) {
  const result = await rooms.remove(paramId(req), req.session.userId);
  if (!result.deletedCount) throw new AppError(404, 'Room not found or not yours', 'NOT_FOUND');
  res.status(204).end();
}
