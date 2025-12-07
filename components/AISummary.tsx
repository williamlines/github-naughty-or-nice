export function AISummary({ summary }: { summary: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-bold mb-4">🎅 Santa Says...</h2>
      <blockquote className="text-lg text-gray-300 italic leading-relaxed">
        &ldquo;{summary}&rdquo;
      </blockquote>
    </div>
  );
}

