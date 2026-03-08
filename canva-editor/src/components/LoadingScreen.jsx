import { useEffect, useState } from "react";

export default function LoadingScreen({ onReady }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    const steps = [
      { pct: 20, msg: "Loading fonts...", delay: 200 },
      { pct: 50, msg: "Setting up workspace...", delay: 400 },
      { pct: 75, msg: "Restoring your work...", delay: 600 },
      { pct: 95, msg: "Almost ready...", delay: 900 },
      { pct: 100, msg: "Ready!", delay: 1100 },
    ];

    const timers = steps.map(({ pct, msg, delay }) =>
      setTimeout(() => {
        setProgress(pct);
        setStatus(msg);
        if (pct === 100) {
          setTimeout(onReady, 300);
        }
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [onReady]);

  return (
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-200">
          <span className="text-white text-3xl font-black">C</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900">Velox Decks</h1>
          <p className="text-sm text-gray-400 mt-1">Design anything, anywhere</p>
        </div>
      </div>

      <div className="w-64 flex flex-col gap-2">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 text-center">{status}</p>
      </div>
    </div>
  );
}
