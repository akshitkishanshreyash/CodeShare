import session from 'express-session';
import { env } from './env.js';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// `store` is a connect-mongo store in production, MemoryStore (default) in tests.
export function createSessionMiddleware(store) {
  return session({
    name: 'cs.sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: env.isProd, // trust X-Forwarded-Proto behind Render/Nginx
    store,
    cookie: {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: env.COOKIE_SAMESITE,
      maxAge: SEVEN_DAYS,
    },
  });
}
