import { usePoll } from '../../context/PollContext';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ResultView() {
  const { activePoll, results, studentVote } = usePoll();

  if (!activePoll) return null;

  const isPollEnded = activePoll.status === 'ended';

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Question label */}
      <div className="mb-1">
        <span className="text-xs text-[#6E6E6E] font-medium uppercase tracking-wide">Question</span>
      </div>

      {/* Question bar */}
      <div className="bg-[#373737] text-white text-sm font-medium px-5 py-3 rounded-t-xl">
        {activePoll.question}
      </div>

      {/* Results */}
      <div className="bg-white border border-gray-200 rounded-b-xl overflow-hidden mb-4">
        {activePoll.options.map((opt, idx) => {
          const result = results.find((r) => r.optionIndex === idx);
          const pct = result?.percentage ?? 0;
          const count = result?.count ?? 0;
          const isMyVote = studentVote === idx;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-5 py-3 border-b border-gray-100 last:border-0 ${
                isMyVote ? 'bg-purple-50' : ''
              }`}
            >
              <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${
                isMyVote ? 'bg-[#7765DA] text-white' : 'bg-[#F2F2F2] text-[#373737]'
              }`}>
                {OPTION_LETTERS[idx]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm truncate ${isMyVote ? 'font-semibold text-[#373737]' : 'text-[#373737]'}`}>
                    {opt.text}
                    {isMyVote && (
                      <span className="ml-2 text-xs text-[#7765DA] font-normal">(Your answer)</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[#373737] ml-2 flex-shrink-0">
                    {pct}%
                    <span className="text-xs text-[#6E6E6E] font-normal ml-1">({count})</span>
                  </span>
                </div>
                <div className="h-2 bg-[#F2F2F2] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7765DA] rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Wait message */}
      <p className="text-center text-[#373737] text-sm mt-4">
        {isPollEnded
          ? 'Wait for the teacher to ask a new question...'
          : 'Live results — poll still active'}
      </p>
    </div>
  );
}
