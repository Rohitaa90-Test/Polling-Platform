import { useState, useEffect } from 'react';
import { usePoll } from '../context/PollContext';
import InterveauBadge from '../components/shared/InterveauBadge';
import NameEntry from '../components/student/NameEntry';
import WaitingScreen from '../components/student/WaitingScreen';
import QuestionView from '../components/student/QuestionView';
import ResultView from '../components/student/ResultView';
import KickedOut from '../components/student/KickedOut';
import ChatPopup from '../components/shared/ChatPopup';

type StudentView = 'name-entry' | 'waiting' | 'question' | 'result';

export default function StudentPage() {
  const {
    studentName,
    activePoll,
    hasVoted,
    isLoading,
    isKicked,
  } = usePoll();

  const [timerExpired, setTimerExpired] = useState(false);

  // Reset timerExpired when a new poll comes in
  useEffect(() => {
    if (activePoll?.status === 'active') {
      setTimerExpired(false);
    }
  }, [activePoll?.id, activePoll?.status]);

  // Determine which view to show
  const getView = (): StudentView => {
    if (!studentName) return 'name-entry';
    if (!activePoll) return 'waiting';
    if (activePoll.status === 'ended' || timerExpired || hasVoted) return 'result';
    return 'question';
  };

  const view = getView();

  // Kicked out screen
  if (isKicked) return <KickedOut />;

  // Loading — show spinner immediately on refresh before data arrives
  // Must be before name-entry check to prevent NameEntry flashing on refresh
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#7765DA] border-t-transparent rounded-full spinner" />
          <p className="text-[#6E6E6E] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Name entry — no header needed
  if (view === 'name-entry') return <NameEntry />;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-center px-8 py-5 border-b border-gray-100">
        <InterveauBadge />
      </header>

      {/* Main content */}
      <main className="px-6 py-8 max-w-2xl mx-auto">
        {view === 'waiting' && <WaitingScreen />}
        {view === 'question' && (
          <QuestionView onTimerExpire={() => setTimerExpired(true)} />
        )}
        {view === 'result' && <ResultView />}
      </main>

      {/* Chat popup */}
      <ChatPopup showKick={false} />
    </div>
  );
}
