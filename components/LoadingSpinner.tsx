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
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 animate-pulse">{messages[messageIndex]}</p>
    </div>
  );
}

