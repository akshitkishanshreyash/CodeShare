import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRoomId, isValidRoomId } from '../src/utils/roomId.js';

test('generated ids are valid and unique-ish', () => {
  const ids = new Set(Array.from({ length: 500 }, generateRoomId));
  assert.equal(ids.size, 500);
  for (const id of ids) assert.ok(isValidRoomId(id));
});

test('rejects unsafe ids', () => {
  for (const bad of ['', 'abc', 'a b c d', '../etc/passwd', 'x'.repeat(41), null, 42]) {
    assert.equal(isValidRoomId(bad), false);
  }
});
