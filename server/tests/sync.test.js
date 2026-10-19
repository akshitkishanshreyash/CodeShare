import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import * as Y from 'yjs';
import { io as connect } from 'socket.io-client';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const join = (socket, roomId) => new Promise((res) => socket.emit('room:join', { roomId }, res));

test('two clients stay in sync through the server (DB stubbed)', async () => {
  const { Room } = await import('../src/models/Room.js');
  const saved = {};
  Room.findOneAndUpdate = async (q) => ({ roomId: q.roomId, language: 'python', title: 'Untitled', ydocState: saved[q.roomId] });
  Room.updateOne = async (q, set) => { if (set.ydocState) saved[q.roomId] = set.ydocState; };

  const { createSessionMiddleware } = await import('../src/config/session.js');
  const { initSockets } = await import('../src/sockets/index.js');
  const mw = createSessionMiddleware();
  const server = http.createServer();
  const io = initSockets(server, mw);
  await new Promise((r) => server.listen(0, r));
  const url = `http://127.0.0.1:${server.address().port}`;

  const a = connect(url, { transports: ['websocket'] });
  const b = connect(url, { transports: ['websocket'] });
  const docA = new Y.Doc();
  const docB = new Y.Doc();
  a.on('yjs:update', ({ update }) => Y.applyUpdate(docA, new Uint8Array(update), 'remote'));
  b.on('yjs:update', ({ update }) => Y.applyUpdate(docB, new Uint8Array(update), 'remote'));
  docA.on('update', (u, o) => o !== 'remote' && a.emit('yjs:update', { update: u }));
  docB.on('update', (u, o) => o !== 'remote' && b.emit('yjs:update', { update: u }));

  const ra = await join(a, 'room-test-1');
  assert.equal(ra.ok, true);
  assert.equal(ra.language, 'python');
  await join(b, 'room-test-1');

  docA.getText('code').insert(0, 'hello ');
  await wait(250);
  docB.getText('code').insert(6, 'world');
  await wait(250);
  assert.equal(docA.getText('code').toString(), 'hello world');
  assert.equal(docB.getText('code').toString(), 'hello world');

  const bad = await join(a, '../evil');
  assert.equal(bad.ok, false);

  // last client leaves -> state is flushed, a new client receives it
  a.disconnect(); b.disconnect();
  await wait(500);
  const c = connect(url, { transports: ['websocket'] });
  const rc = await join(c, 'room-test-1');
  const docC = new Y.Doc();
  Y.applyUpdate(docC, new Uint8Array(rc.state));
  assert.equal(docC.getText('code').toString(), 'hello world');

  c.disconnect();
  await wait(200);
  io.close();
  server.close();
});
