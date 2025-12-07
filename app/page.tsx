'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const validateUsername = (value: string) => {
    const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    if (!value) return 'Username is required';
    if (value.length > 39) return 'Username is too long';
    if (!pattern.test(value)) return 'Invalid username format';
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUsername(username.trim());
    if (validationError) {
      setError(validationError);
      return;
    }
    router.push(`/${username.trim()}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-400 via-white to-red-400 bg-clip-text text-transparent">
          Naughty or Nice?
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8">
          Enter your GitHub username to find out if you&apos;re getting code or
          coal this year 🎄
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="username"
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                autoComplete="off"
                autoFocus
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Check My List 🎅
            </button>
          </div>
        </form>

        {/* Footer hint */}
        <p className="mt-8 text-sm text-gray-500">
          We analyze your public GitHub activity for {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
