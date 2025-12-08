# Tech-Spec: Quick Wins & Bug Fixes - Winter Wonderland Edition

**Created:** 2025-12-08
**Status:** Ready for Development
**Priority:** Bugs first, then enhancements

---

## Overview

### Problem Statement

The MVP is complete and functional, but there are quality issues and polish opportunities:

1. **Bug**: Loading messages are static instead of rotating, reducing engagement during wait time
2. **Bug**: AI Santa message generates twice, with the second replacing the first after a delay
3. **Enhancement**: Scoring is too harsh - users consistently score lower than expected, reducing shareability
4. **Enhancement**: Current Christmas color scheme (red/green) needs refreshing to winter wonderland theme (blues/whites/silvers)
5. **Enhancement**: Landing page lacks the snowfall animation mentioned in PRD nice-to-haves

### Solution

Implement targeted fixes and enhancements to improve UX, fix bugs, and refresh visual design while maintaining festive spirit.

### Scope

**In Scope:**
- Fix loading message rotation logic
- Debug and fix AI message duplication issue
- Adjust scoring thresholds to be 5-10 points more lenient across the board
- Update color scheme to winter wonderland palette
- Add optional snowfall animation with toggle

**Out of Scope:**
- Adding new scoring categories
- Changing core functionality
- Backend architecture changes

---

## Context for Development

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **React**: React 19
- **Styling**: Tailwind CSS
- **Animations**: CSS animations for snowfall

### Codebase Patterns
- Client components use `'use client'` directive
- Components in `/components` directory
- API routes in `/app/api`
- Styling via Tailwind utility classes
- Color variables defined in `globals.css` and Tailwind config

### Files to Reference

**Bug Fixes:**
- `components/LoadingSpinner.tsx` - Loading message display
- `app/[username]/page.tsx` - Results page (AI summary rendering)
- `lib/ai.ts` - AI verdict generation
- `app/api/analyze/[username]/route.ts` - API endpoint

**Scoring Adjustments:**
- `lib/scoring.ts` - All scoring logic and thresholds

**Color Scheme:**
- `app/globals.css` - CSS variables and body gradient
- `tailwind.config.ts` - Tailwind theme extension
- `app/page.tsx` - Landing page styling
- `components/*.tsx` - Component-level color classes

**Snowfall Animation:**
- `app/page.tsx` - Landing page (add snowfall)
- Create new `components/SnowfallEffect.tsx`

### Technical Decisions

1. **Loading messages**: Use React state with setInterval to rotate messages every 2-3 seconds
2. **AI duplication**: Need to investigate - likely React Strict Mode double-render or useEffect dependency issue
3. **Scoring**: Adjust thresholds by 5 points across the board, increase base scores in individual categories
4. **Colors**: Keep existing festive emojis, only change color palette
5. **Snowfall**: Pure CSS animation for performance, localStorage for toggle persistence

---

## Implementation Plan

### Phase 1: Bug Fixes (Priority)

#### Task 1.1: Fix Loading Message Rotation
**File**: `components/LoadingSpinner.tsx`

**Current State:**
```tsx
<p className="text-gray-400 animate-pulse">Consulting the elves...</p>
```

**Requirements:**
- Rotate through 3 messages every 2-3 seconds:
  1. "Checking your commits..."
  2. "Reviewing your PRs..."
  3. "Consulting the elves..."
- Use `useState` for current message index
- Use `useEffect` with `setInterval` for rotation
- Clean up interval on unmount

**Acceptance Criteria:**
- [ ] Messages rotate automatically every 2.5 seconds
- [ ] Rotation starts with first message
- [ ] No memory leaks (interval cleanup)
- [ ] Animation remains smooth

---

#### Task 1.2: Debug and Fix AI Message Duplication
**Files**: `app/[username]/page.tsx`, `lib/ai.ts`

**Current Behavior:**
- AI message generates, displays, then gets replaced by a second generation after a few seconds

**Investigation Steps:**
1. Check if `fetchAnalysis` in `useEffect` is running twice
2. Verify `useEffect` dependencies array
3. Check for React Strict Mode double-mounting (development only)
4. Confirm API is only called once via Network tab
5. Ensure `generateAIVerdict` isn't called multiple times

**Likely Causes:**
- Missing dependencies in useEffect causing re-fetch
- React 19 Strict Mode double-mounting (expected in dev)
- State update triggering re-render and re-fetch

**Fix Strategy:**
- Add proper dependency array to useEffect
- Consider using a ref to track if fetch is in progress
- If Strict Mode only, document as expected dev behavior

**Acceptance Criteria:**
- [ ] AI message generates exactly once per page load
- [ ] No visible "flicker" or replacement of the message
- [ ] Network tab shows single API call to OpenAI
- [ ] Works correctly in production build

---

### Phase 2: Enhancements

#### Task 2.1: Adjust Scoring to Be Kinder
**File**: `lib/scoring.ts`

**Changes Required:**

**A. Overall Thresholds** (function `getVerdictTier`, lines 441-448):
```typescript
// OLD → NEW
if (score >= 90) return 'extremely-nice';     // 90 → 85
if (score >= 75) return 'very-nice';          // 75 → 70
if (score >= 60) return 'sort-of-nice';       // 60 → 55
if (score >= 45) return 'borderline';         // 45 → 40
if (score >= 30) return 'sort-of-naughty';    // 30 → 25
if (score >= 15) return 'very-naughty';       // 15 → 12
return 'extremely-naughty';                   // 0-14 → 0-11
```

**B. Individual Category Adjustments:**

1. **Commit Consistency** (lines 26-74):
   - Increase base score from 0 to 10
   - Reduce variance penalty weight

2. **Message Quality** (lines 76-125):
   - Increase base score from 50 to 55
   - Reduce penalties for short messages

3. **PR Hygiene** (lines 127-213):
   - Base score stays at 50 (already generous)
   - Slightly increase merge rate bonuses

4. **Review Karma** (lines 215-252):
   - Increase base score from 30 to 35
   - Increase per-review bonus from 4 to 5

5. **Issue Citizenship** (lines 254-301):
   - Increase base score from 40 to 45

6. **Collaboration Spirit** (lines 311-406):
   - Increase base score from 30 to 35
   - Adjust external contribution bonuses

**Acceptance Criteria:**
- [ ] Overall thresholds reduced by 5 points
- [ ] Individual category base scores increased by 5 points
- [ ] Test with sample usernames shows higher scores
- [ ] No scores exceed 100 or go below 0
- [ ] Existing tests updated if needed

---

#### Task 2.2: Winter Wonderland Color Scheme
**Files**: `app/globals.css`, `tailwind.config.ts`, `app/page.tsx`, component files

**New Color Palette:**

```
Winter Wonderland Theme:
- Primary: Ice Blue (#60a5fa / blue-400)
- Secondary: Snow White (#f8fafc / slate-50)
- Accent: Silver (#cbd5e1 / slate-300)
- Background: Deep Winter Night (#0f172a → #1e3a8a) gradient
- Text: Soft White (#f1f5f9)
- Borders: Frosted Glass (white/10-20)
```

**Changes:**

**A. globals.css** (lines 5-15):
```css
/* OLD */
--accent: #22c55e;        /* green */
--accent-red: #ef4444;    /* red */

/* NEW */
--accent: #60a5fa;        /* ice blue */
--accent-secondary: #cbd5e1; /* silver */
```

```css
/* OLD */
body {
  background: linear-gradient(to bottom, #0f172a, #1e1b4b);
}

/* NEW */
body {
  background: linear-gradient(to bottom, #0f172a, #1e3a8a);
}
```

**B. Landing Page** (`app/page.tsx`, line 33):
```tsx
{/* OLD */}
bg-gradient-to-r from-green-400 via-white to-red-400

{/* NEW */}
bg-gradient-to-r from-blue-400 via-slate-50 to-blue-300
```

**C. Button Colors** (`app/page.tsx`, line 67):
```tsx
{/* OLD */}
bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700

{/* NEW */}
bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
```

**D. LoadingSpinner** (`components/LoadingSpinner.tsx`, line 4):
```tsx
{/* OLD */}
border-green-500

{/* NEW */}
border-blue-400
```

**E. Keep Festive Elements:**
- ✅ Keep all emoji (🎅, 🎄, etc.)
- ✅ Keep "Santa Says..." text
- ✅ Keep festive copy and tone
- ✅ Only change colors, not theme

**Acceptance Criteria:**
- [ ] All green colors replaced with blue shades
- [ ] All red accent colors replaced with silver/white
- [ ] Background gradient uses winter blues
- [ ] Festive emojis and copy remain unchanged
- [ ] Visual coherence across all pages
- [ ] Accessibility maintained (contrast ratios WCAG AA)

---

#### Task 2.3: Add Snowfall Animation with Toggle
**Files**: `app/page.tsx`, new `components/SnowfallEffect.tsx`

**Requirements:**

**A. Create SnowfallEffect Component:**
- Pure CSS animation (no external libraries)
- Renders 50 snowflakes with staggered animations
- Each snowflake:
  - Random horizontal position
  - Random animation duration (10-20s)
  - Random delay (0-10s)
  - Falls from top to bottom with slight horizontal drift
- Uses `pointer-events: none` to avoid blocking clicks

**B. Add Toggle Control:**
- Checkbox/toggle in top-right of landing page
- Label: "Snowfall ❄️"
- State persisted to localStorage
- Default: ON (enabled)

**C. Implementation:**

**SnowfallEffect.tsx:**
```tsx
'use client';

import { useEffect, useState } from 'react';

export function SnowfallEffect() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('snowfall-enabled');
    if (saved !== null) setEnabled(saved === 'true');
  }, []);

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem('snowfall-enabled', String(newValue));
  };

  return (
    <>
      {/* Toggle Control */}
      <div className="fixed top-4 right-4 z-50">
        <label className="flex items-center gap-2 cursor-pointer bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            className="w-4 h-4"
          />
          <span className="text-sm text-white">Snowfall ❄️</span>
        </label>
      </div>

      {/* Snowflakes */}
      {enabled && (
        <div className="snowfall-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="snowflake" style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}>
              ❄
            </div>
          ))}
        </div>
      )}
    </>
  );
}
```

**CSS in globals.css:**
```css
.snowfall-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.snowflake {
  position: absolute;
  top: -10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  animation: snowfall linear infinite;
  pointer-events: none;
}

@keyframes snowfall {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) translateX(50px);
    opacity: 0.3;
  }
}
```

**Add to app/page.tsx:**
```tsx
import { SnowfallEffect } from '@/components/SnowfallEffect';

export default function Home() {
  return (
    <>
      <SnowfallEffect />
      <main className="...">
        {/* existing content */}
      </main>
    </>
  );
}
```

**Acceptance Criteria:**
- [ ] Snowflakes fall from top to bottom smoothly
- [ ] Toggle control visible and functional
- [ ] Preference persists across page reloads
- [ ] No performance issues (60fps)
- [ ] Snowflakes don't block UI interactions
- [ ] Works on mobile devices
- [ ] Default state is ON

---

## Unit Testing Requirements

### Test File Structure

```
components/
├── LoadingSpinner.test.tsx       # NEW/UPDATED
├── SnowfallEffect.test.tsx       # NEW
lib/
├── scoring.test.ts               # UPDATED
```

---

### Task 1.1: LoadingSpinner Unit Tests
**File**: `components/LoadingSpinner.test.tsx`

**Test Cases:**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders first message initially', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Checking your commits...')).toBeInTheDocument();
  });

  test('rotates to second message after 2.5 seconds', async () => {
    render(<LoadingSpinner />);
    vi.advanceTimersByTime(2500);
    await waitFor(() => {
      expect(screen.getByText('Reviewing your PRs...')).toBeInTheDocument();
    });
  });

  test('rotates to third message after 5 seconds', async () => {
    render(<LoadingSpinner />);
    vi.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(screen.getByText('Consulting the elves...')).toBeInTheDocument();
    });
  });

  test('cycles back to first message after all three', async () => {
    render(<LoadingSpinner />);
    vi.advanceTimersByTime(7500);
    await waitFor(() => {
      expect(screen.getByText('Checking your commits...')).toBeInTheDocument();
    });
  });

  test('cleans up interval on unmount', () => {
    const { unmount } = render(<LoadingSpinner />);
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  test('spinner element is always visible', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
```

**Required Coverage:**
- ✅ Initial render state
- ✅ Message rotation timing
- ✅ Message cycling logic
- ✅ Cleanup on unmount
- ✅ Visual elements present

---

### Task 1.2: AI Message Duplication Tests
**File**: `app/[username]/page.test.tsx`

**Test Cases:**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import ResultsPage from './page';
import { use } from 'react';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: vi.fn(),
  };
});

global.fetch = vi.fn();

describe('ResultsPage - AI Summary', () => {
  beforeEach(() => {
    vi.mocked(use).mockReturnValue({ username: 'testuser' });
    vi.clearAllMocks();
  });

  test('fetches analysis only once on mount', async () => {
    const mockResponse = {
      success: true,
      data: {
        username: 'testuser',
        verdict: { aiSummary: 'Test summary' },
        // ... other required fields
      },
    };

    (global.fetch as vi.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<ResultsPage params={Promise.resolve({ username: 'testuser' })} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('renders AI summary exactly once', async () => {
    const mockResponse = {
      success: true,
      data: {
        username: 'testuser',
        verdict: { aiSummary: 'Test AI summary message' },
        // ... other required fields
      },
    };

    (global.fetch as vi.Mock).mockResolvedValueOnce({
      json: async () => mockResponse,
    });

    render(<ResultsPage params={Promise.resolve({ username: 'testuser' })} />);

    await waitFor(() => {
      const summaries = screen.getAllByText(/Test AI summary message/i);
      expect(summaries).toHaveLength(1);
    });
  });

  test('does not re-fetch when component re-renders', async () => {
    const mockResponse = {
      success: true,
      data: {
        username: 'testuser',
        verdict: { aiSummary: 'Test summary' },
        // ... other required fields
      },
    };

    (global.fetch as vi.Mock).mockResolvedValue({
      json: async () => mockResponse,
    });

    const { rerender } = render(
      <ResultsPage params={Promise.resolve({ username: 'testuser' })} />
    );

    await waitFor(() => screen.getByText(/Test summary/i));

    rerender(<ResultsPage params={Promise.resolve({ username: 'testuser' })} />);

    // Should still only have called fetch once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
```

**Required Coverage:**
- ✅ Single API call verification
- ✅ No duplicate AI summary rendering
- ✅ Re-render stability
- ✅ useEffect dependency correctness

---

### Task 2.1: Scoring Adjustments Tests
**File**: `lib/scoring.test.ts` (UPDATE EXISTING)

**New Test Cases to Add:**

```typescript
import { getVerdictTier, scoreCommitConsistency, scoreMessageQuality, scoreReviewKarma, scoreIssueCitizenship } from './scoring';

describe('Scoring Adjustments - Kinder Thresholds', () => {
  describe('getVerdictTier - Updated Thresholds', () => {
    test('score 85 returns extremely-nice (was 90)', () => {
      expect(getVerdictTier(85)).toBe('extremely-nice');
    });

    test('score 70 returns very-nice (was 75)', () => {
      expect(getVerdictTier(70)).toBe('very-nice');
    });

    test('score 55 returns sort-of-nice (was 60)', () => {
      expect(getVerdictTier(55)).toBe('sort-of-nice');
    });

    test('score 40 returns borderline (was 45)', () => {
      expect(getVerdictTier(40)).toBe('borderline');
    });

    test('score 25 returns sort-of-naughty (was 30)', () => {
      expect(getVerdictTier(25)).toBe('sort-of-naughty');
    });

    test('score 12 returns very-naughty (was 15)', () => {
      expect(getVerdictTier(12)).toBe('very-naughty');
    });

    test('score 11 returns extremely-naughty', () => {
      expect(getVerdictTier(11)).toBe('extremely-naughty');
    });

    test('boundary testing - exactly at threshold', () => {
      expect(getVerdictTier(85)).toBe('extremely-nice');
      expect(getVerdictTier(84)).toBe('very-nice');
    });
  });

  describe('Individual Category Base Score Increases', () => {
    test('commitConsistency: empty commits returns higher base (was 50, now 60)', () => {
      const result = scoreCommitConsistency([]);
      expect(result.score).toBeGreaterThanOrEqual(55);
    });

    test('messageQuality: baseline score increased', () => {
      const mockCommits = [
        { commit: { message: 'test commit', author: { date: '2025-01-01' } } },
      ];
      const result = scoreMessageQuality(mockCommits as any);
      // With base increased from 50 to 55, expect higher scores
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    test('reviewKarma: higher base score for minimal activity', () => {
      const result = scoreReviewKarma(1, 5);
      // With base increased from 30 to 35, expect higher minimum
      expect(result.score).toBeGreaterThanOrEqual(35);
    });

    test('issueCitizenship: higher base score', () => {
      const mockIssues = [
        {
          user: { login: 'testuser' },
          state: 'open',
          pull_request: undefined,
          created_at: '2025-01-01'
        },
      ];
      const result = scoreIssueCitizenship(mockIssues as any, 'testuser');
      // With base increased from 40 to 45, expect higher minimum
      expect(result.score).toBeGreaterThanOrEqual(45);
    });
  });

  describe('Regression Testing - Existing Scores Should Increase', () => {
    test('typical user scenario shows score improvement', () => {
      // Before: User with moderate activity scored ~55
      // After: Same user should score ~60-65

      const mockData = {
        commits: Array(50).fill(null).map((_, i) => ({
          commit: {
            message: 'feat: implemented feature',
            author: { date: `2025-01-${(i % 30) + 1}` }
          }
        })),
      };

      const result = scoreCommitConsistency(mockData.commits as any);
      expect(result.score).toBeGreaterThanOrEqual(60);
    });
  });
});
```

**Tests to Update:**
- Update all existing threshold tests with new values
- Verify no scores exceed 100
- Verify no scores go below 0
- Add regression tests comparing old vs new scores

**Required Coverage:**
- ✅ All new threshold boundaries
- ✅ Edge cases (exactly at threshold)
- ✅ Base score increases in each category
- ✅ Overall scoring improvement verification
- ✅ No breaking changes to scoring logic

---

### Task 2.3: Snowfall Effect Unit Tests
**File**: `components/SnowfallEffect.test.tsx` (NEW)

**Test Cases:**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SnowfallEffect } from './SnowfallEffect';

describe('SnowfallEffect', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders toggle control', () => {
    render(<SnowfallEffect />);
    expect(screen.getByText(/Snowfall ❄️/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('snowfall is enabled by default', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');
    expect(snowflakes.length).toBe(50);
  });

  test('toggle disables snowfall', async () => {
    const { container } = render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);

    await waitFor(() => {
      const snowflakes = container.querySelectorAll('.snowflake');
      expect(snowflakes.length).toBe(0);
    });
    expect(checkbox.checked).toBe(false);
  });

  test('toggle enables snowfall when disabled', async () => {
    localStorage.setItem('snowfall-enabled', 'false');
    const { container } = render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);

    await waitFor(() => {
      const snowflakes = container.querySelectorAll('.snowflake');
      expect(snowflakes.length).toBe(50);
    });
    expect(checkbox.checked).toBe(true);
  });

  test('persists enabled state to localStorage', () => {
    render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);

    expect(localStorage.getItem('snowfall-enabled')).toBe('false');
  });

  test('persists disabled state to localStorage', () => {
    localStorage.setItem('snowfall-enabled', 'false');
    render(<SnowfallEffect />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);

    expect(localStorage.getItem('snowfall-enabled')).toBe('true');
  });

  test('loads saved preference from localStorage', async () => {
    localStorage.setItem('snowfall-enabled', 'false');

    const { container } = render(<SnowfallEffect />);

    await waitFor(() => {
      const snowflakes = container.querySelectorAll('.snowflake');
      expect(snowflakes.length).toBe(0);
    });

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  test('snowflakes have random positions and durations', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakes = Array.from(container.querySelectorAll('.snowflake'));

    const positions = snowflakes.map((el: any) => el.style.left);
    const durations = snowflakes.map((el: any) => el.style.animationDuration);

    // Check that not all positions are the same
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBeGreaterThan(10);

    // Check that not all durations are the same
    const uniqueDurations = new Set(durations);
    expect(uniqueDurations.size).toBeGreaterThan(5);
  });

  test('snowflakes have pointer-events: none via CSS', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakeContainer = container.querySelector('.snowfall-container');

    expect(snowflakeContainer).toHaveStyle({ pointerEvents: 'none' });
  });
});
```

**Required Coverage:**
- ✅ Component rendering
- ✅ Toggle functionality
- ✅ localStorage persistence
- ✅ Default state (enabled)
- ✅ Snowflake randomization
- ✅ Pointer events disabled
- ✅ State restoration from localStorage

---

### Task 2.2: Color Scheme Tests
**Note:** Color scheme changes are primarily visual. Testing approach:

**Visual Regression Tests (Optional but Recommended):**
- Use Playwright/Chromatic for screenshot comparisons
- Capture before/after of landing page
- Verify color values in computed styles

**Unit Tests for Color Constants:**
```typescript
// tailwind.config.test.ts
import config from './tailwind.config';

describe('Tailwind Config - Winter Wonderland Theme', () => {
  test('config does not contain green-500 in default colors', () => {
    // Ensure old colors are removed
    const configStr = JSON.stringify(config);
    expect(configStr).not.toContain('green-500');
  });
});
```

**Manual Testing Checklist:**
- [ ] Landing page uses blue gradient
- [ ] Buttons are blue (not green)
- [ ] Loading spinner is blue
- [ ] Background gradient is winter-themed
- [ ] All text remains readable (contrast check)
- [ ] Festive emojis unchanged

---

## Test Coverage Requirements

**Minimum Coverage Targets:**
- Overall: 80%+
- New code (LoadingSpinner, SnowfallEffect): 90%+
- Modified code (scoring.ts): 85%+

**Running Tests:**
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- LoadingSpinner.test.tsx

# Watch mode during development
npm test -- --watch
```

**CI Integration:**
- All tests must pass before merge
- Coverage reports generated automatically
- No decrease in overall coverage allowed

---

## Additional Context

### Dependencies
No new dependencies required - all changes use existing libraries.

### Testing Strategy

**Manual Testing:**
1. Load landing page → verify snowfall, colors, no console errors
2. Enter username → verify loading messages rotate
3. View results → verify AI message appears once, new colors applied
4. Check multiple usernames → verify scores are 5-10 points higher
5. Toggle snowfall → verify persistence after refresh

**Automated Testing:**
- Update existing tests for color class changes
- Add test for loading message rotation
- Update scoring tests with new thresholds

### Performance Considerations
- Snowfall: 50 snowflakes @ 60fps = minimal impact (CSS animations)
- Loading rotation: setInterval every 2.5s = negligible
- No impact on API or scoring performance

### Rollback Plan
If issues arise:
1. Bugs: Revert specific component files
2. Scoring: Revert `lib/scoring.ts` only
3. Colors: Revert `globals.css` and Tailwind config
4. Snowfall: Remove import from landing page

---

## Checklist

### Bugs
- [ ] Task 1.1: Fix loading message rotation
  - [ ] Implement rotation logic
  - [ ] Write unit tests (LoadingSpinner.test.tsx)
  - [ ] Verify cleanup on unmount
- [ ] Task 1.2: Debug and fix AI message duplication
  - [ ] Investigate root cause
  - [ ] Implement fix
  - [ ] Write unit tests (page.test.tsx)
  - [ ] Verify single API call

### Enhancements
- [ ] Task 2.1: Adjust scoring thresholds (overall + individual)
  - [ ] Update getVerdictTier thresholds
  - [ ] Increase base scores in all categories
  - [ ] Write/update unit tests (scoring.test.ts)
  - [ ] Verify regression tests pass
- [ ] Task 2.2: Apply winter wonderland color scheme
  - [ ] Update CSS variables in globals.css
  - [ ] Update Tailwind config
  - [ ] Update component color classes
  - [ ] Manual visual testing
- [ ] Task 2.3: Add snowfall animation with toggle
  - [ ] Create SnowfallEffect component
  - [ ] Implement toggle with localStorage
  - [ ] Add CSS animations
  - [ ] Write unit tests (SnowfallEffect.test.tsx)
  - [ ] Performance test (60fps)

### Unit Testing
- [ ] LoadingSpinner.test.tsx - 6 test cases (rotation, cleanup)
- [ ] SnowfallEffect.test.tsx - 10 test cases (toggle, persistence, rendering)
- [ ] scoring.test.ts - Update existing + 15 new test cases
- [ ] app/[username]/page.test.tsx - 3 test cases (AI duplication fix)
- [ ] Achieve 80%+ overall coverage
- [ ] Achieve 90%+ coverage on new code
- [ ] All tests pass in CI

### Manual Testing
- [ ] Manual testing on all pages
- [ ] Test scoring with sample users (verify 5-10 point increase)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive testing
- [ ] Performance check (Lighthouse score maintained)
- [ ] Snowfall animation smoothness (60fps)
- [ ] Color contrast accessibility (WCAG AA)

### Documentation
- [ ] Update README if color scheme mentioned
- [ ] Document localStorage key for snowfall toggle
- [ ] Add comments in scoring.ts explaining threshold changes
- [ ] Document test coverage requirements

---

## Notes

- **Priority**: Fix bugs first (1.1, 1.2), then enhancements (2.1, 2.2, 2.3)
- **Quick wins**: All tasks are small, targeted changes
- **Risk**: Low - isolated changes, easy to revert
- **Time estimate**: 2-3 hours total for experienced developer
- **Festive spirit**: Maintained - only colors change, tone stays warm and playful

---

_Tech-spec ready for implementation by dev agent or manual development._
