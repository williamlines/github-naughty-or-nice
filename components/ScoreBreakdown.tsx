import { CategoryId, CategoryScores } from '@/types';
import { CategoryRow } from './CategoryRow';

const categoryOrder: CategoryId[] = [
  'commitConsistency',
  'messageQuality',
  'prHygiene',
  'reviewKarma',
  'issueCitizenship',
  'collaborationSpirit',
];

export function ScoreBreakdown({
  categories,
}: {
  categories: CategoryScores;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <h2 className="text-xl font-bold mb-4">Score Breakdown</h2>
      <div className="divide-y divide-white/10">
        {categoryOrder.map((id) => (
          <CategoryRow key={id} id={id} data={categories[id]} />
        ))}
      </div>
    </div>
  );
}

