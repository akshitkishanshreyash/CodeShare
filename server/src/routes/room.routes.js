import { Router } from 'express';
import * as rooms from '../controllers/room.controller.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.post('/', h(rooms.create));
router.get('/mine', requireAuth, h(rooms.mine)); // must stay above /:roomId
router.get('/:roomId', h(rooms.getOne));
router.post('/:roomId/claim', requireAuth, h(rooms.claim));
router.patch('/:roomId', requireAuth, h(rooms.rename));
router.delete('/:roomId', requireAuth, h(rooms.remove));
export default router;
