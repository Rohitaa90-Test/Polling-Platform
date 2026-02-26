import { useState } from 'react';
import { usePoll } from '../../context/PollContext';
import type { PollOption } from '../../types';

const DURATION_OPTIONS = [
  { label: '30 seconds', value: 30 },
  { label: '60 seconds', value: 60 },
  { label: '90 seconds', value: 90 },
  { label: '120 seconds', value: 120 },
];

const MAX_QUESTION_LENGTH = 100;

export default function PollCreator() {
  const { createPoll } = usePoll();
  const [question, setQuestion] = useState('');
  const [duration, setDuration] = useState(60);
  const [options, setOptions] = useState<PollOption[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx: number, text: string) => {
    setOptions(options.map((opt, i) => i === idx ? { ...opt, text } : opt));
  };

  const setCorrect = (idx: number, value: boolean) => {
    setOptions(options.map((opt, i) => i === idx ? { ...opt, isCorrect: value } : opt));
  };

  const canSubmit = question.trim().length > 0 && options.every((o) => o.text.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    createPoll({ question: question.trim(), options, duration });
    // Reset after brief delay to prevent double-click
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Question label */}
        <label className="text-sm font-semibold text-[#373737]">Enter your question</label>
        {/* Duration dropdown */}
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-[#373737] focus:outline-none focus:ring-2 focus:ring-[#7765DA] cursor-pointer"
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Question textarea */}
      <div className="relative mb-6">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
          rows={3}
          placeholder="Type your question here..."
          className="w-full px-4 py-3 rounded-xl bg-[#F2F2F2] border border-gray-200 text-[#373737] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#7765DA] resize-none transition"
        />
        <span className="absolute bottom-3 right-3 text-xs text-[#6E6E6E]">
          {question.length}/{MAX_QUESTION_LENGTH}
        </span>
      </div>

      {/* Options header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-[#373737]">Edit Options</span>
        <span className="text-sm font-semibold text-[#373737]">Is it Correct?</span>
      </div>

      {/* Option rows */}
      <div className="space-y-3 mb-4">
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {/* Option circle */}
            <span className="w-7 h-7 rounded-full bg-[#7765DA] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {idx + 1}
            </span>
            {/* Text input */}
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#F2F2F2] border border-gray-200 text-[#373737] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#7765DA] text-sm transition"
            />
            {/* Yes/No radio */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <label className="flex items-center gap-1 cursor-pointer text-sm text-[#373737]">
                <input
                  type="radio"
                  name={`correct-${idx}`}
                  checked={opt.isCorrect === true}
                  onChange={() => setCorrect(idx, true)}
                  className="accent-[#7765DA]"
                />
                Yes
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-sm text-[#373737]">
                <input
                  type="radio"
                  name={`correct-${idx}`}
                  checked={opt.isCorrect === false}
                  onChange={() => setCorrect(idx, false)}
                  className="accent-[#7765DA]"
                />
                No
              </label>
            </div>
            {/* Remove button */}
            {options.length > 2 && (
              <button
                onClick={() => removeOption(idx)}
                className="text-[#6E6E6E] hover:text-red-500 text-lg leading-none"
                aria-label="Remove option"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add more option */}
      {options.length < 6 && (
        <button
          onClick={addOption}
          className="text-[#7765DA] text-sm font-semibold hover:text-[#5767D0] transition-colors mb-8"
        >
          + Add More option
        </button>
      )}

      {/* Ask Question button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="bg-gradient-to-r from-[#7765DA] to-[#4F0DCE] text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Asking...' : 'Ask Question'}
        </button>
      </div>
    </div>
  );
}
