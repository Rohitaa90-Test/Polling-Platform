import { useEffect } from 'react';
import { usePoll } from '../../context/PollContext';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function PollHistory() {
  const { pollHistory, refreshHistory } = usePoll();

  // Re-fetch every time this tab is opened — ensures fresh data
  // even if the initial fetch at login failed silently (e.g. Render cold start)
  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  if (pollHistory.length === 0) {
    return (
      <div className="text-center py-12 text-[#6E6E6E] text-sm">
        No poll history yet. Ask your first question!
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Heading */}
      <h2 className="text-2xl text-[#373737] font-normal mb-8">
        View <span className="font-bold">Poll History</span>
      </h2>

      <div className="space-y-8">
        {pollHistory.map((item, qIdx) => (
          <div key={item.id}>
            <p className="text-xs font-semibold text-[#6E6E6E] uppercase tracking-wide mb-2">
              Question {qIdx + 1}
            </p>
            {/* Question bar */}
            <div className="bg-[#373737] text-white text-sm font-medium px-5 py-3 rounded-t-xl">
              {item.question}
            </div>
            {/* Options */}
            <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden">
              {item.options.map((opt, idx) => {
                const result = item.results.find((r) => r.optionIndex === idx);
                const pct = result?.percentage ?? 0;
                const count = result?.count ?? 0;

                return (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0">
                    <span className="w-7 h-7 rounded-full bg-[#7765DA] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {OPTION_LETTERS[idx]}
                    </span>
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
                          className="h-full bg-[#7765DA] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
