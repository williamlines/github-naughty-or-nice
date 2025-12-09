'use client';
import { useState, useEffect } from 'react';

const messages = [
  "Checking your commits...",
  "Reviewing your PRs...",
  "Consulting the elves..."
];

export function LoadingSpinner() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#8b181d] border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-700 animate-pulse">{messages[messageIndex]}</p>
    </div>
  );
}

