import { randomBytes } from 'node:crypto';

const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{4,40}$/;

export const isValidRoomId = (id) => typeof id === 'string' && ROOM_ID_PATTERN.test(id);

// 10 random chars, e.g. "k3x9a0qzp1"
export function generateRoomId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(10);
  let id = '';
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return id;
}
