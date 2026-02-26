import { useState } from 'react';
import { usePoll } from '../../context/PollContext';
import InterveauBadge from '../shared/InterveauBadge';

export default function NameEntry() {
  const { setStudentName } = usePoll();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setStudentName(trimmed);
    // After name is set, context will emit join-as-student automatically
    // (role was already set to 'student' in LandingPage)
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleContinue();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <InterveauBadge />

        <div className="text-center">
          <h1 className="text-3xl text-[#373737]">
            Let's <span className="font-bold">Get Started</span>
          </h1>
          <p className="text-[#6E6E6E] text-sm mt-3 leading-relaxed">
            If you're a student, you'll be able to{' '}
            <strong className="text-[#373737]">submit your answers</strong>, participate in live
            polls, and see how your responses compare with your classmates
          </p>
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-[#373737] mb-2">
            Enter your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rahul Bajaj"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-[#F2F2F2] border border-gray-200 text-[#373737] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#7765DA] transition"
          />
        </div>

        <button
          onClick={handleContinue}
          disabled={!name.trim() || isSubmitting}
          className="bg-gradient-to-r from-[#7765DA] to-[#4F0DCE] text-white font-semibold py-3 px-14 rounded-full hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Joining...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
