import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

export function originCheck(req, res, next) {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== env.CLIENT_URL) return next(new AppError(403, 'Origin not allowed', 'BAD_ORIGIN'));
  next();
}
