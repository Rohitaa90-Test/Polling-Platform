export type PollStatus = 'active' | 'ended';

export interface PollOption {
  text: string;
  isCorrect: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  duration: number;          // seconds
  startTime: string;         // ISO timestamp
  status: PollStatus;
  createdAt: string;
}

export interface VoteResult {
  optionIndex: number;
  count: number;
  percentage: number;
}

export interface ActivePollResponse {
  poll: Poll | null;
  results: VoteResult[];
  hasVoted: boolean;
  studentVote: number | null;   // optionIndex the student voted
  remainingTime: number;        // seconds left
}

export interface PollHistoryItem {
  id: string;
  question: string;
  options: PollOption[];
  results: VoteResult[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  text: string;
  timestamp: number;
  role: 'teacher' | 'student';
}

export interface Participant {
  studentId: string;
  studentName: string;
  socketId: string;
}

// Socket event payloads
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

export interface SendChatPayload {
  text: string;
  senderName: string;
  senderId: string;
  role: 'teacher' | 'student';
}
