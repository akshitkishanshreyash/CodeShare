import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

// Regenerate the session id on login/register to prevent session fixation.
const startSession = (req, user) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.save((e) => (e ? reject(e) : resolve()));
    });
  });

export async function register(req, res) {
  const { name, email, password } = registerSchema.parse(req.body);
  if (await User.exists({ email })) throw new AppError(409, 'That email is already registered', 'EMAIL_TAKEN');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash });
  await startSession(req, user);
  res.status(201).json({ user: user.toPublic() });
}

// Same message for unknown email and wrong password.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Email or password is incorrect', 'BAD_CREDENTIALS');
  await startSession(req, user);
  res.json({ user: user.toPublic() });
}

export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('cs.sid');
    res.status(204).end();
  });
}

// Returns 200 with user:null for guests so the browser console stays clean.
export async function me(req, res) {
  if (!req.session?.userId) return res.json({ user: null });
  const user = await User.findById(req.session.userId);
  res.json({ user: user ? user.toPublic() : null });
}
