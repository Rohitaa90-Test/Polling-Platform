import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import type {
  Poll,
  VoteResult,
  ChatMessage,
  Participant,
  PollHistoryItem,
  CreatePollPayload,
} from '../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL!.replace(/\/+$/, '');

/* ------------------------------------------------------------------ */
/*  Context shape                                                        */
/* ------------------------------------------------------------------ */
interface PollContextValue {
  // Identity
  role: 'teacher' | 'student' | null;
  setRole: (r: 'teacher' | 'student') => void;
  studentId: string;
  studentName: string;
  setStudentName: (n: string) => void;

  // Active poll
  activePoll: Poll | null;
  results: VoteResult[];
  remainingTime: number;
  hasVoted: boolean;
  studentVote: number | null;

  // Poll history
  pollHistory: PollHistoryItem[];
  refreshHistory: () => Promise<void>;

  // Participants (teacher view)
  participants: Participant[];

  // Chat
  chatMessages: ChatMessage[];
  sendChatMessage: (text: string) => void;

  // Actions
  createPoll: (payload: CreatePollPayload) => void;
  submitVote: (optionIndex: number) => void;
  kickStudent: (studentId: string) => void;

  // Loading
  isLoading: boolean;

  // Kicked state
  isKicked: boolean;
}

const PollContext = createContext<PollContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                             */
/* ------------------------------------------------------------------ */
export function PollProvider({ children }: { children: React.ReactNode }) {
  const { socket, emit, on, off } = useSocket();

  // Identity
  const [role, setRoleState] = useState<'teacher' | 'student' | null>(null);
  const studentId = useRef<string>('');
  const [studentName, setStudentNameState] = useState('');

  // Poll state
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [remainingTime, setRemainingTime] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [studentVote, setStudentVote] = useState<number | null>(null);

  // History
  const [pollHistory, setPollHistory] = useState<PollHistoryItem[]>([]);

  // Participants
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Loading / kicked
  // Start as true if user is refreshing (role saved) — prevents wrong screen flash
  const [isLoading, setIsLoading] = useState(() => !!sessionStorage.getItem('role'));
  const [isKicked, setIsKicked] = useState(false);

  // Track previous poll ID to detect new polls
  const previousPollIdRef = useRef<string | null>(null);

  /* -- Initialise session identity ---------------------------------- */
  useEffect(() => {
    let id = sessionStorage.getItem('studentId');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('studentId', id);
    }
    studentId.current = id;

    const savedName = sessionStorage.getItem('studentName');
    if (savedName) setStudentNameState(savedName);

    // Restore role from URL on refresh (e.g. teacher refreshes /teacher)
    const path = window.location.pathname;
    const savedRole = sessionStorage.getItem('role') as 'teacher' | 'student' | null;
    if (path.includes('/teacher') && savedRole === 'teacher') {
      setRoleState('teacher');
    } else if (path.includes('/student') && savedRole === 'student') {
      setRoleState('student');
    }
  }, []);

  /* -- Role setter --------------------------------------------------- */
  const setRole = useCallback((r: 'teacher' | 'student') => {
    setRoleState(r);
    sessionStorage.setItem('role', r);
  }, []);

  /* -- Student name setter ------------------------------------------- */
  const setStudentName = useCallback((name: string) => {
    setStudentNameState(name);
    sessionStorage.setItem('studentName', name);
  }, []);

  /* -- Fetch history (teacher) --------------------------------------- */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/polls/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data: PollHistoryItem[] = await res.json();
      setPollHistory(data);
    } catch {
      // silently fail – history is non-critical
    }
  }, []);

  /* -- Fetch current state on mount (state recovery) ---------------- */
  const fetchCurrentState = useCallback(async (roleJoining: 'teacher' | 'student') => {
    setIsLoading(true);
    try {
      const sid = roleJoining === 'student' ? `?studentId=${studentId.current}` : '';
      const res = await fetch(`${BACKEND_URL}/api/polls/current${sid}`);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();

      if (data.poll) {
        // Mark this poll ID as seen — so when socket's poll-started arrives
        // for the same poll, it's treated as recovery, NOT a new poll
        previousPollIdRef.current = data.poll.id;
        setActivePoll(data.poll);
        setResults(data.results || []);
        setRemainingTime(data.remainingTime ?? 0);
        if (roleJoining === 'student') {
          setHasVoted(data.hasVoted ?? false);
          setStudentVote(data.studentVote ?? null);
        }
      }
      // HTTP fetch succeeded — dismiss loading immediately
      setIsLoading(false);
    } catch {
      // HTTP fetch failed (cold start / timeout) — keep isLoading=true
      // Socket's poll-started will confirm state and dismiss loading
    }
  }, []);

  /* -- Join room after role is set ----------------------------------- */
  useEffect(() => {
    if (!role) return;

    fetchCurrentState(role);

    if (role === 'teacher') {
      emit('join-as-teacher');
      fetchHistory();
    } else {
      // Only join as student if we have a name
      // This fix ensures that newly on-boarded students show up for the teacher instantly
      if (studentName) {
        emit('join-as-student', {
          studentId: studentId.current,
          studentName,
        });
      }
    }
  }, [role, studentName, emit, fetchCurrentState, fetchHistory]);

  /* -- Socket reconnect: re-join ------------------------------------ */
  useEffect(() => {
    const handleReconnect = () => {
      if (!role) return;
      if (role === 'teacher') {
        emit('join-as-teacher');
      } else {
        emit('join-as-student', {
          studentId: studentId.current,
          studentName: sessionStorage.getItem('studentName') || '',
        });
      }
    };
    socket.on('reconnect', handleReconnect);
    return () => { socket.off('reconnect', handleReconnect); };
  }, [role, emit, socket]);

  /* -- Socket event listeners --------------------------------------- */
  useEffect(() => {
    const onPollStarted = (data: {
      poll: Poll | null;  // null when no active poll exists
      results: VoteResult[];
      remainingTime: number;
      hasVoted?: boolean;
      studentVote?: number | null;
      participants?: Participant[];
    }) => {
      // Socket confirmed current state — always dismiss loading spinner
      setIsLoading(false);

      // Always populate participants initially, even if there's no active poll
      if (data.participants) {
        setParticipants(data.participants);
      }

      // No active poll — nothing more to do, stay on waiting screen
      if (!data.poll) return;

      const isFirstLoad = previousPollIdRef.current === null;
      const isNewPoll = !isFirstLoad && previousPollIdRef.current !== data.poll.id;
      previousPollIdRef.current = data.poll.id;

      setActivePoll(data.poll);
      setResults(data.results || []);
      setRemainingTime(data.remainingTime);

      if (isNewPoll) {
        // Genuinely new poll created while we were connected — reset voted state for everyone
        setHasVoted(false);
        setStudentVote(null);
        if (role === 'student') {
          toast.success('New question asked!', { id: 'poll-started' });
        }
      } else {
        // First load OR Recovery path (refresh/reconnect) — use server-sent values to
        // ensure we accurately reflect if the user has already voted
        if (data.hasVoted !== undefined) setHasVoted(data.hasVoted);
        if (data.studentVote !== undefined) setStudentVote(data.studentVote ?? null);
      }
    };

    const onPollUpdate = (data: { results: VoteResult[]; participants: Participant[] }) => {
      setResults(data.results);
      if (data.participants) setParticipants(data.participants);
    };

    const onPollEnded = (data: { pollId: string; results: VoteResult[] }) => {
      setActivePoll((prev) => prev ? { ...prev, status: 'ended' } : null);
      setResults(data.results);
      setRemainingTime(0);
      if (role === 'teacher') fetchHistory();
    };

    const onParticipantsUpdate = (data: Participant[]) => {
      setParticipants(data);
    };

    const onChatMessage = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    };

    const onKicked = () => {
      setIsKicked(true);
    };

    const onError = (err: { message: string }) => {
      toast.error(err.message || 'Something went wrong');
    };

    on('poll-started', onPollStarted);
    on('poll-update', onPollUpdate);
    on('poll-ended', onPollEnded);
    on('participants-update', onParticipantsUpdate);
    on('chat-message', onChatMessage);
    on('kicked', onKicked);
    on('error', onError);

    return () => {
      off('poll-started');
      off('poll-update');
      off('poll-ended');
      off('participants-update');
      off('chat-message');
      off('kicked');
      off('error');
    };
  }, [on, off, role, fetchHistory]);

  /* -- Actions ------------------------------------------------------ */
  const createPoll = useCallback((payload: CreatePollPayload) => {
    emit('create-poll', payload);
  }, [emit]);

  const submitVote = useCallback((optionIndex: number) => {
    if (!activePoll) return;
    // Optimistic update
    setHasVoted(true);
    setStudentVote(optionIndex);

    emit('submit-vote', {
      pollId: activePoll.id,
      studentId: studentId.current,
      studentName: sessionStorage.getItem('studentName') || studentName,
      optionIndex,
    });
  }, [activePoll, emit, studentName]);

  const kickStudent = useCallback((sid: string) => {
    emit('kick-student', { studentId: sid });
  }, [emit]);

  const sendChatMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      senderName: role === 'teacher' ? 'Teacher' : studentName,
      senderId: role === 'teacher' ? 'teacher' : studentId.current,
      text,
      timestamp: Date.now(),
      role: role ?? 'student',
    };
    emit('send-chat', msg);
    setChatMessages((prev) => [...prev, msg]);
  }, [role, studentName, emit]);

  /* -- Vote error recovery: revert optimistic update on error ------- */
  useEffect(() => {
    const onVoteError = () => {
      setHasVoted(false);
      setStudentVote(null);
    };
    socket.on('vote-error', onVoteError);
    return () => { socket.off('vote-error', onVoteError); };
  }, [socket]);

  return (
    <PollContext.Provider value={{
      role, setRole,
      studentId: studentId.current,
      studentName, setStudentName,
      activePoll, results, remainingTime, hasVoted, studentVote,
      pollHistory, refreshHistory: fetchHistory,
      participants,
      chatMessages, sendChatMessage,
      createPoll, submitVote, kickStudent,
      isLoading,
      isKicked,
    }}>
      {children}
    </PollContext.Provider>
  );
}

export function usePoll(): PollContextValue {
  const ctx = useContext(PollContext);
  if (!ctx) throw new Error('usePoll must be used within PollProvider');
  return ctx;
}
