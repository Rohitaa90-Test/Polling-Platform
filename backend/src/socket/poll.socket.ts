import { Server, Socket } from 'socket.io';
import * as pollService from '../services/poll.service';
import type {
  JoinAsStudentPayload,
  CreatePollPayload,
  SubmitVotePayload,
  KickStudentPayload,
  Participant,
  ChatMessage,
  VoteResult,
} from '../types';

// In-memory participants map: studentId → Participant
const participants = new Map<string, Participant>();

// In-memory teacher socket id (only one teacher at a time for simplicity)
let teacherSocketId: string | null = null;

/* ------------------------------------------------------------------ */
/*  Helper: broadcast updated participants list to all                  */
/* ------------------------------------------------------------------ */
function broadcastParticipants(io: Server) {
  const list: Participant[] = Array.from(participants.values());
  io.emit('participants-update', list);
}

/* ------------------------------------------------------------------ */
/*  Helper: broadcast poll-update (results + participants) to all      */
/* ------------------------------------------------------------------ */
async function broadcastPollUpdate(io: Server, pollId: string) {
  const results = await pollService.getResults(pollId);
  const list: Participant[] = Array.from(participants.values());
  io.emit('poll-update', { results, participants: list });
}

/* ------------------------------------------------------------------ */
/*  Register poll-end callback on service layer                         */
/*  Called when server-side setTimeout fires                            */
/* ------------------------------------------------------------------ */
export function registerPollEndCallback(io: Server) {
  pollService.registerPollEndCallback(async (pollId: string, results: VoteResult[]) => {
    io.emit('poll-ended', { pollId, results });
  });
}

/* ------------------------------------------------------------------ */
/*  Main socket handler — called for each new connection               */
/* ------------------------------------------------------------------ */
export function handleSocketConnection(io: Server, socket: Socket) {

  /* ---------- join-as-teacher ---------- */
  socket.on('join-as-teacher', async () => {
    try {
      teacherSocketId = socket.id;
      socket.join('teachers');

      // Send current state for state recovery
      const state = await pollService.getActivePoll();
      const list: Participant[] = Array.from(participants.values());
      socket.emit('poll-started', {
        poll: state.poll,
        results: state.results,
        remainingTime: state.remainingTime,
        participants: list,
      });
    } catch (err) {
      socket.emit('error', { message: 'Failed to join as teacher.' });
    }
  });

  /* ---------- join-as-student ---------- */
  socket.on('join-as-student', async (data: JoinAsStudentPayload) => {
    try {
      const { studentId, studentName } = data;
      if (!studentId || !studentName) return;

      // Track participant
      participants.set(studentId, { studentId, studentName, socketId: socket.id });
      socket.join('students');

      // Send current state with server-synced remaining time + hasVoted
      const state = await pollService.getActivePoll(studentId);
      socket.emit('poll-started', {
        poll: state.poll,
        results: state.results,
        remainingTime: state.remainingTime,
        hasVoted: state.hasVoted,
        studentVote: state.studentVote,
      });

      // Broadcast updated participants list to all
      broadcastParticipants(io);
    } catch (err) {
      socket.emit('error', { message: 'Failed to join session.' });
    }
  });

  /* ---------- create-poll ---------- */
  socket.on('create-poll', async (data: CreatePollPayload) => {
    try {
      const { question, options, duration } = data;

      if (!question?.trim() || !options?.length || !duration) {
        socket.emit('error', { message: 'Invalid poll data.' });
        return;
      }

      const { poll, remainingTime } = await pollService.createPoll(
        question.trim(),
        options,
        duration
      );

      // Broadcast new poll to ALL connected clients (teachers + students)
      io.emit('poll-started', { poll, results: [], remainingTime });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create poll.';
      socket.emit('error', { message });
    }
  });

  /* ---------- submit-vote ---------- */
  socket.on('submit-vote', async (data: SubmitVotePayload) => {
    try {
      const { pollId, studentId, studentName, optionIndex } = data;

      if (!pollId || !studentId || optionIndex === undefined) {
        socket.emit('vote-error');
        return;
      }

      await pollService.submitVote(pollId, studentId, studentName, optionIndex);

      // Broadcast updated results + participants to all
      await broadcastPollUpdate(io, pollId);
    } catch (err) {
      // Duplicate vote or ended poll — revert optimistic UI
      socket.emit('vote-error');
      const message = err instanceof Error ? err.message : 'Vote failed.';
      socket.emit('error', { message });
    }
  });

  /* ---------- kick-student ---------- */
  socket.on('kick-student', (data: KickStudentPayload) => {
    try {
      const { studentId } = data;
      if (!studentId) return;

      const participant = participants.get(studentId);
      if (!participant) return;

      // Emit kicked event to that specific socket
      io.to(participant.socketId).emit('kicked');

      // Remove from participants
      participants.delete(studentId);

      // Broadcast updated participants list
      broadcastParticipants(io);
    } catch (err) {
      // Error kicking student
    }
  });

  /* ---------- send-chat ---------- */
  socket.on('send-chat', (msg: ChatMessage) => {
    try {
      // Broadcast to all EXCEPT sender (sender already added locally)
      socket.broadcast.emit('chat-message', msg);
    } catch (err) {
      // Error sending chat
    }
  });

  /* ---------- disconnect ---------- */
  socket.on('disconnect', () => {
    // Remove from participants if it was a student
    let removedStudentId: string | null = null;
    for (const [sid, participant] of participants.entries()) {
      if (participant.socketId === socket.id) {
        removedStudentId = sid;
        break;
      }
    }

    if (removedStudentId) {
      participants.delete(removedStudentId);
      broadcastParticipants(io);
    }

    if (teacherSocketId === socket.id) {
      teacherSocketId = null;
    }
  });
}
