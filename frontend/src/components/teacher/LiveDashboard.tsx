import { usePoll } from '../../context/PollContext';
import { usePollTimer } from '../../hooks/usePollTimer';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function LiveDashboard() {
  const { activePoll, results, remainingTime } = usePoll();
  const { formatted } = usePollTimer({ initialTime: remainingTime });

  if (!activePoll) return null;

  const totalVotes = results.reduce((sum, r) => sum + r.count, 0);
  const isPollEnded = activePoll.status === 'ended';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Question header */}
      <div className="mb-1">
        <span className="text-xs text-[#6E6E6E] font-medium uppercase tracking-wide">Question</span>
      </div>
      <div className="bg-[#373737] text-white text-sm font-medium px-5 py-3 rounded-t-xl">
        {activePoll.question}
      </div>

      {/* Options with progress bars */}
      <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden mb-6">
        {activePoll.options.map((opt, idx) => {
          const result = results.find((r) => r.optionIndex === idx);
          const pct = result?.percentage ?? 0;
          const count = result?.count ?? 0;

          return (
            <div key={idx} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
              {/* Circle */}
              <span className="w-7 h-7 rounded-full bg-[#7765DA] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {OPTION_LETTERS[idx]}
              </span>
              {/* Bar + label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[#373737] truncate">{opt.text}</span>
                  <span className="text-sm font-semibold text-[#373737] ml-2 flex-shrink-0">
                    {pct}%
                    <span className="text-xs text-[#6E6E6E] font-normal ml-1">({count})</span>
                  </span>
                </div>
                <div className="h-2 bg-[#F2F2F2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7765DA] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-[#6E6E6E]">
          Total votes: <span className="font-semibold text-[#373737]">{totalVotes}</span>
        </span>
        {!isPollEnded && (
          <div className="flex items-center gap-1.5 text-red-500 font-semibold text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatted}
          </div>
        )}
        {isPollEnded && (
          <span className="text-xs text-[#6E6E6E] bg-gray-100 px-3 py-1 rounded-full">Poll ended</span>
        )}
      </div>

    </div>
  );
}
