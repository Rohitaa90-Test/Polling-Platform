import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoll } from '../context/PollContext';
import InterveauBadge from '../components/shared/InterveauBadge';

export default function LandingPage() {
  const [selected, setSelected] = useState<'student' | 'teacher' | null>(null);
  const { setRole } = usePoll();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    setRole(selected);
    navigate(`/${selected}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg flex flex-col items-center gap-10">

        {/* Badge */}
        <InterveauBadge />

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl font-normal text-[#373737] leading-tight">
            Welcome to the{' '}
            <span className="font-bold">Live Polling System</span>
          </h1>
          <p className="text-[#6E6E6E] text-sm mt-3">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <RoleCard
            title="I'm a Student"
            description="Submit answers and view live poll results in real-time."
            isSelected={selected === 'student'}
            onClick={() => setSelected('student')}
          />
          <RoleCard
            title="I'm a Teacher"
            description="Submit answers and view live poll results in real-time."
            isSelected={selected === 'teacher'}
            onClick={() => setSelected('teacher')}
          />
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className="bg-gradient-to-r from-[#7765DA] to-[#4F0DCE] text-white font-semibold py-3 px-14 rounded-full transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Role Card                                                            */
/* ------------------------------------------------------------------ */
interface RoleCardProps {
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}

function RoleCard({ title, description, isSelected, onClick }: RoleCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-5 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
        isSelected
          ? 'border-[#5767D0] bg-purple-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-[#7765DA] hover:bg-purple-50/30'
      }`}
      style={isSelected ? { borderStyle: 'dashed' } : {}}
    >
      <p className="font-bold text-[#373737] text-sm mb-1">{title}</p>
      <p className="text-[#6E6E6E] text-xs leading-relaxed">{description}</p>
    </button>
  );
}
