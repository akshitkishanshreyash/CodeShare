import http from 'node:http';
import MongoStore from 'connect-mongo';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createSessionMiddleware } from './config/session.js';
import { createApp } from './app.js';
import { initSockets } from './sockets/index.js';
import { flushAll } from './services/yjs.service.js';
import { logger } from './utils/logger.js';

async function main() {
  const connection = await connectDb();

  const store = MongoStore.create({ client: connection.getClient(), collectionName: 'sessions', ttl: 7 * 24 * 60 * 60 });
  const sessionMiddleware = createSessionMiddleware(store);

  const app = createApp(sessionMiddleware);
  const server = http.createServer(app);
  const io = initSockets(server, sessionMiddleware);

  server.listen(env.PORT, () => logger.info(`API + sockets listening on :${env.PORT} (${env.NODE_ENV})`));

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    io.close();
    await flushAll(); // persist any in-memory docs before exit
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
