export function validateEnv() {
  const required = ['GITHUB_TOKEN', 'OPENAI_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

export const env = {
  githubToken: process.env.GITHUB_TOKEN!,
  openaiApiKey: process.env.OPENAI_API_KEY!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};
