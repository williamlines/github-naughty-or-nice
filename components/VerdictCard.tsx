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
    <div className="bg-white rounded-2xl p-6 md:p-8 text-center border-2 border-[#e6be9a] shadow-xl">
      {/* Avatar */}
      <a href={profileUrl} target="_blank" rel="noopener noreferrer">
        <Image
          src={avatarUrl}
          alt={username}
          width={120}
          height={120}
          className="rounded-full mx-auto mb-4 border-4 border-[#325632]"
        />
      </a>

      {/* Username */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xl text-slate-700 hover:text-[#8b181d] transition-colors"
      >
        @{username}
      </a>

      {/* Emoji */}
      <div className="text-7xl my-6">{verdict.emoji}</div>

      {/* Label and Score */}
      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-800">{verdict.label}</h1>
      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#8b181d] to-[#1d351d] bg-clip-text text-transparent mb-2">
        {verdict.score}/100
      </div>
      <p className="text-slate-700 italic">{verdict.flavor}</p>
    </div>
  );
}

