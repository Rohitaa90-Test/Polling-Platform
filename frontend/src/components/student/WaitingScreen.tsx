import InterveauBadge from '../shared/InterveauBadge';

export default function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <InterveauBadge />
      {/* Spinner */}
      <div className="w-14 h-14 border-4 border-[#7765DA] border-t-transparent rounded-full spinner" />
      <p className="text-[#373737] text-lg font-medium text-center">
        Wait for the teacher to ask questions..
      </p>
    </div>
  );
}
