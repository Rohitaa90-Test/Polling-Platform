import { Request, Response } from 'express';
import * as pollService from '../services/poll.service';

/* ------------------------------------------------------------------ */
/*  GET /api/polls/current?studentId=                                   */
/*  State recovery — called on every page load/refresh                  */
/* ------------------------------------------------------------------ */
export async function getCurrentPoll(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.query.studentId as string | undefined;
    const data = await pollService.getActivePoll(studentId);
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'Service temporarily unavailable.' });
  }
}

/* ------------------------------------------------------------------ */
/*  GET /api/polls/history                                              */
/*  Teacher poll history — DB only, never local storage                 */
/* ------------------------------------------------------------------ */
export async function getHistory(req: Request, res: Response): Promise<void> {
  try {
    const data = await pollService.getPollHistory();
    res.json(data);
  } catch (err) {
    res.status(503).json({ message: 'Service temporarily unavailable.' });
  }
}
