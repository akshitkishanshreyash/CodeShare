import { AppError } from '../utils/AppError.js';

export function requireAuth(req, res, next) {
  if (!req.session?.userId) return next(new AppError(401, 'Please sign in', 'UNAUTHENTICATED'));
  next();
}
