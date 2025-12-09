'use client';

import { useEffect, useState, useMemo } from 'react';

export function SnowfallEffect() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('snowfall-enabled');
    if (saved !== null) setEnabled(saved === 'true');
  }, []);

  // Memoize snowflake properties to prevent reset on parent re-renders
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 50 }).map((_, i) => {
        const duration = 10 + Math.random() * 10;
        return {
          id: i,
          left: `${Math.random() * 100}%`,
          animationDuration: `${duration}s`,
          // Negative delay makes animation start mid-cycle for "already running" effect
          animationDelay: `${-Math.random() * duration}s`,
        };
      }),
    []
  );

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem('snowfall-enabled', String(newValue));
  };

  return (
    <>
      {/* Toggle Control */}
      <div className="fixed top-4 right-4 z-50">
        <label className="flex items-center gap-2 cursor-pointer bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border-2 border-[#e6be9a] shadow-lg">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="w-4 h-4 accent-[#1d351d]"
          />
          <span className="text-sm font-medium text-slate-800">Snowfall ❄️</span>
        </label>
      </div>

      {/* Snowflakes */}
      {enabled && (
        <div className="snowfall-container" suppressHydrationWarning>
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              className="snowflake"
              style={{
                left: flake.left,
                animationDuration: flake.animationDuration,
                animationDelay: flake.animationDelay,
              }}
              suppressHydrationWarning
            >
              ❄
            </div>
          ))}
        </div>
      )}
    </>
  );
}
