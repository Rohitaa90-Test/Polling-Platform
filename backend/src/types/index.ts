// Shared TypeScript types — must match frontend types/index.ts exactly

export interface PollOption {
  text: string;
  isCorrect: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  duration: number;
  startTime: string;   // ISO string — camelCase to match frontend
  status: 'active' | 'ended';
  createdAt: string;   // ISO string — camelCase to match frontend
}

export interface VoteResult {
  optionIndex: number;
  count: number;
  percentage: number;
}

export interface PollHistoryItem {
  id: string;
  question: string;
  options: PollOption[];
  results: VoteResult[];
  createdAt: string;
}

export interface ActivePollResponse {
  poll: Poll | null;
  results: VoteResult[];
  remainingTime: number;
  hasVoted: boolean;
  studentVote: number | null;
}

export interface Participant {
  studentId: string;
  studentName: string;
  socketId: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: number;
  role: 'teacher' | 'student';
}

// Socket event payloads
export interface JoinAsStudentPayload {
  studentId: string;
  studentName: string;
}

export interface CreatePollPayload {
  question: string;
  options: PollOption[];
  duration: number;
}

export interface SubmitVotePayload {
  pollId: string;
  studentId: string;
  studentName: string;
  optionIndex: number;
}

export interface KickStudentPayload {
  studentId: string;
}
