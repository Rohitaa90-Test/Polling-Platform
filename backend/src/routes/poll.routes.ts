import { Router } from 'express';
import { getCurrentPoll, getHistory } from '../controllers/poll.controller';

const router = Router();

router.get('/current', getCurrentPoll);
router.get('/history', getHistory);

export default router;
