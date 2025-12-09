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
    <div className="bg-white rounded-2xl p-6 border-2 border-[#e6be9a] shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Score Breakdown</h2>
      <div className="divide-y divide-[#e6be9a]">
        {categoryOrder.map((id) => (
          <CategoryRow key={id} id={id} data={categories[id]} />
        ))}
      </div>
    </div>
  );
}

