import { useState } from 'react';
import { usePoll } from '../context/PollContext';
import InterveauBadge from '../components/shared/InterveauBadge';
import PollCreator from '../components/teacher/PollCreator';
import LiveDashboard from '../components/teacher/LiveDashboard';
import PollHistory from '../components/teacher/PollHistory';
import ChatPopup from '../components/shared/ChatPopup';

type TeacherView = 'poll' | 'history';

export default function TeacherPage() {
  const { activePoll, isLoading, participants, kickStudent } = usePoll();
  const [view, setView] = useState<TeacherView>('poll');

  // Show poll creator when: no active poll, OR active poll is ended
  const showCreator = !activePoll || activePoll.status === 'ended';
  const showDashboard = activePoll && activePoll.status === 'active';

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

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <InterveauBadge />
        {view === 'poll' && (
          <button
            onClick={() => setView('history')}
            className="flex items-center gap-2 bg-[#7765DA] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#5767D0] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Poll history
          </button>
        )}
        {view === 'history' && (
          <button
            onClick={() => setView('poll')}
            className="text-[#7765DA] text-sm font-semibold hover:text-[#5767D0] transition-colors"
          >
            ← Back to Poll
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="px-8 py-8 max-w-4xl mx-auto">
        {view === 'poll' && (
          <>
            {/* Page intro */}
            <div className="mb-8">
              <h1 className="text-2xl text-[#373737]">
                Let's <span className="font-bold">Get Started</span>
              </h1>
              <p className="text-[#6E6E6E] text-sm mt-1">
                you'll have the ability to create and manage polls, ask questions, and monitor
                your students' responses in real-time.
              </p>
            </div>

            {/* Active poll dashboard */}
            {showDashboard && <LiveDashboard />}

            {/* Poll creator when ended or no poll */}
            {showCreator && !showDashboard && (
              <div>
                {activePoll?.status === 'ended' && (
                  <div className="mb-6">
                    {/* Show ended poll results before new creation */}
                    <LiveDashboard />
                    <hr className="my-8 border-gray-100" />
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-[#373737]">Ask a New Question</h2>
                    </div>
                  </div>
                )}
                <div id="poll-creator-section">
                  <PollCreator />
                </div>
              </div>
            )}
          </>
        )}

        {view === 'history' && <PollHistory />}
      </main>

      {/* Chat popup with participants + kick */}
      <ChatPopup
        participants={participants}
        showKick={true}
        onKick={kickStudent}
      />
    </div>
  );
}
