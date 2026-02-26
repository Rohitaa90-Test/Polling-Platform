import { useState } from 'react';
import { usePoll } from '../../context/PollContext';
import { usePollTimer } from '../../hooks/usePollTimer';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

interface QuestionViewProps {
  onTimerExpire: () => void;
}

export default function QuestionView({ onTimerExpire }: QuestionViewProps) {
  const { activePoll, remainingTime, hasVoted, studentVote, submitVote } = usePoll();
  const [selectedOption, setSelectedOption] = useState<number | null>(studentVote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { formatted } = usePollTimer({
    initialTime: remainingTime,
    onExpire: onTimerExpire,
  });

  if (!activePoll) return null;

  const handleOptionClick = (idx: number) => {
    if (hasVoted || isSubmitting) return;
    setSelectedOption(idx);
  };

  const handleSubmit = () => {
    if (selectedOption === null || hasVoted || isSubmitting) return;
    setIsSubmitting(true);
    submitVote(selectedOption);
  };

  // If already voted (optimistic or recovered), show disabled view
  const isDisabled = hasVoted || isSubmitting;

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Question number + timer */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#373737]">Question 1</span>
        <div className="flex items-center gap-1.5 text-red-500 font-semibold text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatted}
        </div>
      </div>

      {/* Question card */}
      <div
        className={`rounded-2xl border-2 overflow-hidden mb-6 transition-all ${
          selectedOption !== null ? 'border-[#5767D0]' : 'border-transparent'
        }`}
        style={selectedOption !== null ? { borderStyle: 'dashed' } : {}}
      >
        {/* Dark question bar */}
        <div className="bg-[#373737] text-white text-sm font-medium px-5 py-3">
          {activePoll.question}
        </div>

        {/* Options */}
        <div className="bg-white divide-y divide-gray-100">
          {activePoll.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isVoted = studentVote === idx;

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={isDisabled}
                className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all duration-150 focus:outline-none ${
                  isDisabled
                    ? 'cursor-not-allowed'
                    : 'hover:bg-purple-50 cursor-pointer'
                } ${isSelected || isVoted ? 'bg-purple-50' : 'bg-white'}`}
              >
                <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${
                  isSelected || isVoted
                    ? 'bg-[#7765DA] text-white'
                    : 'bg-[#F2F2F2] text-[#373737]'
                }`}>
                  {OPTION_LETTERS[idx]}
                </span>
                <span className={`text-sm ${isDisabled ? 'opacity-60' : ''} ${isSelected || isVoted ? 'font-semibold text-[#373737]' : 'text-[#373737]'}`}>
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button — only if not voted */}
      {!hasVoted && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null || isSubmitting}
            className="bg-gradient-to-r from-[#7765DA] to-[#4F0DCE] text-white font-semibold py-3 px-12 rounded-full hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}

      {/* Already voted hint */}
      {hasVoted && activePoll.status === 'active' && (
        <p className="text-center text-[#6E6E6E] text-sm mt-2">
          Answer submitted. Waiting for others...
        </p>
      )}
    </div>
  );
}
