import mongoose from 'mongoose';
import { env } from '../config/env.js';

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    title: { type: String, default: 'Untitled', trim: true, maxlength: 80 },
    language: { type: String, default: 'plaintext' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // absent = anonymous
    ydocState: { type: Buffer }, // full Yjs document state
    snippet: { type: String, default: '', maxlength: 240 }, // preview for dashboard
  },
  { timestamps: true }
);

// Anonymous rooms expire after N days of inactivity. Owned rooms are kept.
roomSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: env.ANONYMOUS_ROOM_TTL_DAYS * 24 * 60 * 60,
    partialFilterExpression: { owner: { $exists: false } },
  }
);

export const Room = mongoose.model('Room', roomSchema);
