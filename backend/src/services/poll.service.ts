import prisma from '../lib/prisma';
import type {
  Poll,
  PollOption,
  VoteResult,
  ActivePollResponse,
  PollHistoryItem,
} from '../types';

// In-memory timer map: pollId → NodeJS.Timeout
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Callback that socket layer registers — called when poll ends
let onPollEndCallback: ((pollId: string, results: VoteResult[]) => void) | null = null;

export function registerPollEndCallback(
  cb: (pollId: string, results: VoteResult[]) => void
) {
  onPollEndCallback = cb;
}

/* ------------------------------------------------------------------ */
/*  Helper: map Prisma Poll row → frontend Poll shape (camelCase)       */
/* ------------------------------------------------------------------ */
function mapPoll(row: {
  id: string;
  question: string;
  options: unknown;
  duration: number;
  startTime: Date;
  status: string;
  createdAt: Date;
}): Poll {
  return {
    id: row.id,
    question: row.question,
    options: row.options as unknown as PollOption[],
    duration: row.duration,
    startTime: row.startTime.toISOString(),
    status: row.status as 'active' | 'ended',
    createdAt: row.createdAt.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  getResults — server calculates vote counts, never frontend          */
/* ------------------------------------------------------------------ */
export async function getResults(pollId: string): Promise<VoteResult[]> {
  const votes = await prisma.vote.findMany({ where: { pollId } });
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return [];

  const options = poll.options as unknown as PollOption[];
  const totalVotes = votes.length;

  return options.map((_, idx) => {
    const count = votes.filter((v) => v.optionIndex === idx).length;
    const percentage =
      totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
    return { optionIndex: idx, count, percentage };
  });
}

/* ------------------------------------------------------------------ */
/*  scheduleTimer — internal: setTimeout to auto-end poll               */
/* ------------------------------------------------------------------ */
function scheduleTimer(pollId: string, remainingMs: number) {
  // Clear any existing timer for this poll
  const existing = activeTimers.get(pollId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    try {
      activeTimers.delete(pollId);
      const results = await endPoll(pollId);
      onPollEndCallback?.(pollId, results);
    } catch (err) {
      // Timer failed
    }
  }, remainingMs);

  activeTimers.set(pollId, timer);
}

/* ------------------------------------------------------------------ */
/*  createPoll                                                           */
/* ------------------------------------------------------------------ */
export async function createPoll(
  question: string,
  options: PollOption[],
  duration: number
): Promise<{ poll: Poll; remainingTime: number }> {
  // Guard: only 1 active poll allowed at a time
  const existing = await prisma.poll.findFirst({
    where: { status: 'active' },
  });
  if (existing) {
    throw new Error('A poll is already active. End it before creating a new one.');
  }

  const now = new Date();
  const row = await prisma.poll.create({
    data: {
      question,
      options: options as object[],
      duration,
      startTime: now,
      status: 'active',
    },
  });

  const poll = mapPoll(row);

  // Schedule server-side timer
  scheduleTimer(row.id, duration * 1000);

  return { poll, remainingTime: duration };
}

/* ------------------------------------------------------------------ */
/*  getActivePoll — state recovery endpoint                             */
/* ------------------------------------------------------------------ */
export async function getActivePoll(
  studentId?: string
): Promise<ActivePollResponse> {
  const row = await prisma.poll.findFirst({
    where: { status: 'active' },
  });

  if (!row) {
    return { poll: null, results: [], remainingTime: 0, hasVoted: false, studentVote: null };
  }

  const now = Date.now();
  const elapsed = Math.floor((now - row.startTime.getTime()) / 1000);
  const remainingTime = Math.max(0, row.duration - elapsed);

  const results = await getResults(row.id);

  let hasVoted = false;
  let studentVote: number | null = null;

  if (studentId) {
    const existingVote = await prisma.vote.findUnique({
      where: { pollId_studentId: { pollId: row.id, studentId } },
    });
    if (existingVote) {
      hasVoted = true;
      studentVote = existingVote.optionIndex;
    }
  }

  return { poll: mapPoll(row), results, remainingTime, hasVoted, studentVote };
}

/* ------------------------------------------------------------------ */
/*  submitVote                                                           */
/* ------------------------------------------------------------------ */
export async function submitVote(
  pollId: string,
  studentId: string,
  studentName: string,
  optionIndex: number
): Promise<VoteResult[]> {
  // Guard: poll must be active
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) throw new Error('Poll not found.');
  if (poll.status !== 'active') throw new Error('Poll has already ended.');

  // Guard: valid option index
  const optionsArray = poll.options as unknown as unknown[];
  if (optionIndex < 0 || optionIndex >= optionsArray.length) {
    throw new Error('Invalid option selected.');
  }

  // DB insert — UNIQUE(pollId, studentId) will throw on duplicate
  await prisma.vote.create({
    data: { pollId, studentId, studentName, optionIndex },
  });

  return getResults(pollId);
}

/* ------------------------------------------------------------------ */
/*  endPoll                                                             */
/* ------------------------------------------------------------------ */
export async function endPoll(pollId: string): Promise<VoteResult[]> {
  await prisma.poll.update({
    where: { id: pollId },
    data: { status: 'ended' },
  });

  // Clean up timer if manually ended
  const timer = activeTimers.get(pollId);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(pollId);
  }

  return getResults(pollId);
}

/* ------------------------------------------------------------------ */
/*  getPollHistory — DB only, no local storage                          */
/* ------------------------------------------------------------------ */
export async function getPollHistory(): Promise<PollHistoryItem[]> {
  const polls = await prisma.poll.findMany({
    where: { status: 'ended' },
    orderBy: { createdAt: 'desc' },
  });

  const history: PollHistoryItem[] = await Promise.all(
    polls.map(async (row) => {
      const results = await getResults(row.id);
      return {
        id: row.id,
        question: row.question,
        options: row.options as unknown as PollOption[],
        results,
        createdAt: row.createdAt.toISOString(),
      };
    })
  );

  return history;
}

/* ------------------------------------------------------------------ */
/*  restoreActiveTimer — called on server startup                       */
/* ------------------------------------------------------------------ */
export async function restoreActiveTimer(): Promise<void> {
  try {
    const row = await prisma.poll.findFirst({ where: { status: 'active' } });
    if (!row) return;

    const elapsed = Math.floor((Date.now() - row.startTime.getTime()) / 1000);
    const remaining = row.duration - elapsed;

    if (remaining <= 0) {
      // Poll should have ended already — end it now
      const results = await endPoll(row.id);
      onPollEndCallback?.(row.id, results);
    } else {
      // Re-attach timer for remaining time
      scheduleTimer(row.id, remaining * 1000);
    }
  } catch (err) {
    // Timer restoration failed
  }
}
