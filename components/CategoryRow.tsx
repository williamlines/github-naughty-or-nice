import { CategoryId, CategoryScore } from '@/types';

const categoryIcons: Record<CategoryId, string> = {
  commitConsistency: '📅',
  messageQuality: '📝',
  prHygiene: '✂️',
  reviewKarma: '🤝',
  issueCitizenship: '🧹',
  collaborationSpirit: '🌍',
};

const categoryLabels: Record<CategoryId, string> = {
  commitConsistency: 'Commit Consistency',
  messageQuality: 'Message Quality',
  prHygiene: 'PR Hygiene',
  reviewKarma: 'Review Karma',
  issueCitizenship: 'Issue Citizenship',
  collaborationSpirit: 'Collaboration Spirit',
};

interface CategoryRowProps {
  id: CategoryId;
  data: CategoryScore;
}

export function CategoryRow({ id, data }: CategoryRowProps) {
  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-[#325632]';
    if (score >= 40) return 'bg-[#e6be9a]';
    return 'bg-[#8b181d]';
  };

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{categoryIcons[id]}</span>
          <span className="font-medium text-slate-700">{categoryLabels[id]}</span>
        </div>
        <span className="font-bold text-slate-900">{data.score}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full ${getBarColor(data.score)} transition-all duration-500`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Quip */}
      <p className="text-sm text-slate-700 italic">{data.quip}</p>
    </div>
  );
}

