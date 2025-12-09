export function AISummary({
  summary,
  score,
}: {
  summary: string;
  score: number;
}) {
  const isKrampus = score < 50;
  const header = isKrampus ? '😈 Krampus Says...' : '🎅 Santa Says...';

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-[#e6be9a] shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-slate-800">{header}</h2>
      <blockquote className="text-lg text-slate-700 italic leading-relaxed">
        &ldquo;{summary}&rdquo;
      </blockquote>
    </div>
  );
}

