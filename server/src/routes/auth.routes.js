import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.post('/register', authLimiter, h(auth.register));
router.post('/login', authLimiter, h(auth.login));
router.post('/logout', auth.logout);
router.get('/me', h(auth.me));
export default router;
