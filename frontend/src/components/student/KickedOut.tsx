import InterveauBadge from '../shared/InterveauBadge';

export default function KickedOut() {
  const handleRetry = () => {
    // Clear session and reload
    sessionStorage.removeItem('studentId');
    sessionStorage.removeItem('studentName');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#373737] px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <InterveauBadge />
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">
            You've been Kicked out !
          </h1>
          <p className="text-[#6E6E6E] text-sm leading-relaxed">
            Looks like the teacher had removed you from the poll system. Please
            <br />
            Try again sometime.
          </p>
        </div>
        <button
          onClick={handleRetry}
          className="mt-4 bg-white text-[#7765DA] font-semibold py-2 px-8 rounded-full hover:bg-gray-100 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
