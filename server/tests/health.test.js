import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret';

test('GET /api/health responds (503 without a DB is expected)', async () => {
  const { createApp } = await import('../src/app.js');
  const { createSessionMiddleware } = await import('../src/config/session.js');
  const app = createApp(createSessionMiddleware());
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.ok([200, 503].includes(res.status));
    const body = await res.json();
    assert.ok('status' in body);

    const missing = await fetch(`http://127.0.0.1:${port}/api/nope`);
    assert.equal(missing.status, 404);

    const guest = await fetch(`http://127.0.0.1:${port}/api/auth/me`);
    assert.deepEqual(await guest.json(), { user: null });
  } finally {
    server.close();
  }
});
