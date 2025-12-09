# 🎅 GitHub Naughty or Nice

A festive Next.js app that analyzes your GitHub activity for the year and delivers a verdict from Santa... or Krampus.

## ✨ Features

- **Smart Scoring System**: Analyzes 6 categories of GitHub activity (commits, PRs, reviews, issues, collaboration)
- **Dual Personalities**: Get encouragement from Santa for good scores (≥50) or darkly humorous messages from Krampus for low scores (<50)
- **AI-Powered Summaries**: Personalized verdicts using OpenAI GPT-4o-mini
- **Beautiful UI**: Festive design with snowfall animation and responsive layout
- **Comprehensive Analysis**: Tracks external contributions, merge rates, and collaboration patterns

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **GitHub Account** (to generate a Personal Access Token)
- **OpenAI Account** (to generate an API key)

### 1. Clone the Repository

```bash
git clone https://github.com/williamlines/github-naughty-or-nice.git
cd github-naughty-or-nice
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Required API Keys

#### GitHub Personal Access Token (PAT)

The app needs a GitHub token to fetch user activity data.

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Configure the token:
   - **Note**: `GitHub Naughty or Nice App`
   - **Expiration**: Choose your preferred expiration (90 days recommended)
   - **Scopes**: Select the following:
     - ✅ `public_repo` (to read public repositories)
     - ✅ `read:user` (to read user profile data)
4. Click **"Generate token"**
5. **Important**: Copy the token immediately (you won't be able to see it again)

#### OpenAI API Key

The app uses OpenAI to generate personalized verdicts.

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Give it a name: `GitHub Naughty or Nice`
5. Click **"Create secret key"**
6. **Important**: Copy the key immediately (starts with `sk-...`)

> **Note**: OpenAI API usage is pay-as-you-go. The app uses GPT-4o-mini which is very cost-effective (~$0.15 per 1M input tokens). Each verdict costs approximately $0.0001-0.0003.

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your keys:

```env
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_your_github_token_here

# OpenAI API Key
OPENAI_API_KEY=sk-your_openai_key_here
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Try It Out!

1. Enter a GitHub username (try your own!)
2. Click "Check the List"
3. View your verdict from Santa or Krampus 🎅😈

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **AI**: OpenAI GPT-4o-mini
- **APIs**: GitHub REST API

## 📦 Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   └── [username]/        # Dynamic username results page
├── components/            # React components
├── lib/                   # Core logic
│   ├── ai.ts             # OpenAI integration
│   ├── github.ts         # GitHub API client
│   ├── scoring.ts        # Scoring algorithms
│   └── errors.ts         # Error handling
├── types/                 # TypeScript types
└── public/               # Static assets
```

## 🎯 Scoring Categories

The app analyzes 6 categories of GitHub activity:

1. **Commit Consistency** (0-100): Regularity and distribution of commits throughout the year
2. **Message Quality** (0-100): Quality and descriptiveness of commit messages
3. **PR Hygiene** (0-100): PR size, merge rate, and external contributions
4. **Review Karma** (0-100): Code review participation relative to PRs authored
5. **Issue Citizenship** (0-100): Issue creation and resolution rate
6. **Collaboration Spirit** (0-100): External contributions and repo diversity

**Overall Score**: Average of all 6 categories

**Verdict Tiers**:
- 🎅 **85-100**: Extremely Nice
- 😇 **70-84**: Very Nice
- 🙂 **55-69**: Sort of Nice
- 😬 **40-54**: Borderline (Krampus appears!)
- 😈 **25-39**: Sort of Naughty
- 👿 **12-24**: Very Naughty
- 💀 **0-11**: Extremely Naughty

## 🔧 Configuration

### Adjusting Scoring Thresholds

Edit `lib/scoring.ts` to customize:
- Base scores for each category
- Threshold values for verdict tiers
- Penalty and bonus multipliers

### Customizing AI Prompts

Edit `lib/ai.ts` to modify:
- Santa's system prompt (line 43)
- Krampus's system prompt (line 31)
- Fallback message templates

## 🐛 Troubleshooting

### "GitHub token not configured" Error

- Verify `.env.local` exists in the root directory
- Check that `GITHUB_TOKEN` is set correctly
- Restart the dev server after adding environment variables

### "OpenAI timeout" or Fallback Messages

- Check that `OPENAI_API_KEY` is set correctly
- Verify your OpenAI account has credits
- The app will use fallback messages if OpenAI is unavailable

### Rate Limiting

- GitHub API has rate limits (5000 requests/hour for authenticated users)
- The app is optimized to minimize API calls
- If rate limited, wait an hour or use a different GitHub account

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 🎄 Happy Holidays!

Built with ❤️ for the holiday season. May your commits be merry and your PRs be merged!
