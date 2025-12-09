import OpenAI from 'openai';
import { CategoryScores, VerdictTier } from '@/types';

// Lazy initialization to avoid errors when OPENAI_API_KEY is not set
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface VerdictInput {
  username: string;
  overallScore: number;
  verdictTier: VerdictTier;
  categories: CategoryScores;
  summary: {
    totalCommits: number;
    totalPRs: number;
    totalReviews: number;
    totalIssues: number;
  };
}

export async function generateAIVerdict(input: VerdictInput): Promise<string> {
  const systemPrompt = input.overallScore < 50
    ? `You are Krampus writing a darkly humorous message after reviewing a developer's GitHub activity for the year.

CRITICAL RULES:
- NEVER mention the rating scores (e.g., "77/100", "100/100") - the user already sees those
- DO reference raw activity counts (total commits, PRs, reviews, issues) as fresh information
- Tell a SHORT STORY with dark humor about their lackluster coding year
- Be playfully menacing but ultimately motivational - threaten coal but hint at redemption
- Use underworld/punishment metaphors instead of North Pole ones
- End with a darkly comedic threat OR a chance for redemption next year
- Keep it 3-4 sentences maximum

Write as if Krampus is reviewing their GitHub activity with disappointed amusement.`
    : `You are Santa Claus writing a personalized, whimsical letter after reviewing a developer's GitHub activity for the year.

CRITICAL RULES:
- NEVER mention the rating scores (e.g., "77/100", "100/100") - the user already sees those
- DO reference raw activity counts (total commits, PRs, reviews, issues) as fresh information
- Tell a SHORT STORY about what you observed in their coding year using North Pole/workshop metaphors
- Be warm, playful, and specific to their actual behavior patterns
- End with encouragement for next year
- Keep it 3-4 sentences maximum

Write as if Santa is sharing observations from his workshop, not reading a report card.`;

  const userPrompt = `Developer: @${input.username}
Verdict Tier: ${input.verdictTier}

Activity This Year:
- Total Commits: ${input.summary.totalCommits}
- Total PRs: ${input.summary.totalPRs}
- Total Reviews: ${input.summary.totalReviews}
- Total Issues: ${input.summary.totalIssues}

Category Performance Context (for your awareness, DO NOT cite these scores):
- Commit Consistency: ${input.categories.commitConsistency.score}/100
- Message Quality: ${input.categories.messageQuality.score}/100
- PR Hygiene: ${input.categories.prHygiene.score}/100
- Review Karma: ${input.categories.reviewKarma.score}/100
- Issue Citizenship: ${input.categories.issueCitizenship.score}/100
- Collaboration Spirit: ${input.categories.collaborationSpirit.score}/100

Based on their activity and the areas where they excel or need improvement, write Santa's whimsical conclusion.`;

  // Create timeout promise (15 seconds for AI generation)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('OpenAI timeout')), 15000);
  });

  try {
    const responsePromise = getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    // Race between API call and timeout
    const response = await Promise.race([responsePromise, timeoutPromise]);

    return response.choices[0]?.message?.content || getFallbackVerdict(input);
  } catch (error) {
    console.error('OpenAI error:', error);
    return getFallbackVerdict(input);
  }
}

export function getFallbackVerdict(input: VerdictInput): string {
  const templates: Record<VerdictTier, string> = {
    'extremely-nice': `Ho ho ho! @${input.username}, you've been absolutely wonderful this year with ${input.summary.totalCommits} commits! Santa's workshop could use someone like you. Keep spreading the code cheer in the new year!`,
    'very-nice': `@${input.username}, Santa is impressed! ${input.summary.totalCommits} commits and ${input.summary.totalPRs} PRs show real dedication. You're definitely on the nice list this year. Keep up the great work!`,
    'sort-of-nice': `@${input.username}, you've been mostly nice this year. ${input.summary.totalCommits} commits show effort, though the elves noticed some room for improvement. A little more consistency next year and you'll be golden!`,
    borderline: `@${input.username}, I've been watching from the shadows... ${input.summary.totalCommits} commits barely kept you off my list. The chains rattle louder with each inactive week. Prove me wrong next year, or I'll be back with my bundle of switches.`,
    'sort-of-naughty': `@${input.username}, my sack of coal has your name on it. ${input.summary.totalCommits} commits and ${input.summary.totalReviews} reviews? Pathetic. I'm sharpening my horns as we speak. Redeem yourself next year... if you dare.`,
    'very-naughty': `@${input.username}, *rattles chains menacingly* Your GitHub looks like a graveyard. ${input.summary.totalCommits} commits? I've seen more activity from a hibernating bear. My coal reserves are overflowing thanks to developers like you. Next year, code like your keyboard depends on it.`,
    'extremely-naughty': `@${input.username}... *cracks knuckles* I found cobwebs in your GitHub profile. Did you forget how to commit? ${input.summary.totalCommits} contributions won't even fill my smallest punishment sack. Next year, I'll be watching. Make it count, or I'm upgrading from coal to corrupted databases.`,
  };
  return templates[input.verdictTier];
}
