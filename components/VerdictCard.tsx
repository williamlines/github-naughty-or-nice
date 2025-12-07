import Image from 'next/image';
import { Verdict } from '@/types';

interface VerdictCardProps {
  username: string;
  avatarUrl: string;
  profileUrl: string;
  verdict: Verdict;
}

export function VerdictCard({
  username,
  avatarUrl,
  profileUrl,
  verdict,
}: VerdictCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-center border border-white/10">
      {/* Avatar */}
      <a href={profileUrl} target="_blank" rel="noopener noreferrer">
        <Image
          src={avatarUrl}
          alt={username}
          width={120}
          height={120}
          className="rounded-full mx-auto mb-4 border-4 border-white/20"
        />
      </a>

      {/* Username */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xl text-gray-300 hover:text-white transition-colors"
      >
        @{username}
      </a>

      {/* Emoji */}
      <div className="text-7xl my-6">{verdict.emoji}</div>

      {/* Label and Score */}
      <h1 className="text-3xl md:text-4xl font-bold mb-2">{verdict.label}</h1>
      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-2">
        {verdict.score}/100
      </div>
      <p className="text-gray-400 italic">{verdict.flavor}</p>
    </div>
  );
}

