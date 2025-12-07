import Link from 'next/link';
import { ErrorCode } from '@/types';

const errorMessages: Record<ErrorCode, { title: string; message: string }> = {
  USER_NOT_FOUND: {
    title: "Hmm, Santa can't find that username",
    message: 'Are you sure they exist on GitHub?',
  },
  NO_ACTIVITY: {
    title: 'This account has been very quiet...',
    message: 'No public activity found for this year.',
  },
  RATE_LIMITED: {
    title: 'The elves are overwhelmed!',
    message: 'Too many requests. Try again in a few minutes.',
  },
  GITHUB_ERROR: {
    title: "GitHub's workshop is closed",
    message: 'Having trouble reaching GitHub. Try again soon.',
  },
  OPENAI_ERROR: {
    title: 'Santa lost his glasses',
    message:
      "Couldn't generate the AI verdict, but scores are still available.",
  },
  INTERNAL_ERROR: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

export function ErrorState({ code }: { code: ErrorCode }) {
  const { title, message } =
    errorMessages[code] || errorMessages.INTERNAL_ERROR;

  return (
    <div className="text-center">
      <div className="text-6xl mb-4">😅</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{message}</p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
      >
        Try Another Username
      </Link>
    </div>
  );
}

