# Story 3: Kinder Scoring Thresholds

Status: drafted

## Story

As a **GitHub user sharing their Naughty or Nice results**,
I want **scoring to be 5-10 points more lenient across all categories**,
so that **results are more positive and encourage social sharing**.

## Acceptance Criteria

1. Overall verdict thresholds reduced by 5 points across all tiers
2. Individual category base scores increased by 5 points minimum
3. Test with sample usernames shows scores 5-10 points higher than before
4. No scores exceed 100 or fall below 0
5. All existing tests updated and passing
6. New regression tests verify scoring improvements
7. Code coverage maintains 85%+ on scoring.ts

## Tasks / Subtasks

- [ ] Update overall verdict tier thresholds (AC: #1)
  - [ ] Modify `getVerdictTier` function (lines 441-448 in scoring.ts)
  - [ ] Change 'extremely-nice' threshold: 90 → 85
  - [ ] Change 'very-nice' threshold: 75 → 70
  - [ ] Change 'sort-of-nice' threshold: 60 → 55
  - [ ] Change 'borderline' threshold: 45 → 40
  - [ ] Change 'sort-of-naughty' threshold: 30 → 25
  - [ ] Change 'very-naughty' threshold: 15 → 12
  - [ ] Update 'extremely-naughty' to 0-11 range

- [ ] Increase individual category base scores (AC: #2)
  - [ ] Commit Consistency: base 0 → 10, reduce variance penalty
  - [ ] Message Quality: base 50 → 55, reduce short message penalties
  - [ ] PR Hygiene: keep at 50, increase merge rate bonuses slightly
  - [ ] Review Karma: base 30 → 35, per-review bonus 4 → 5
  - [ ] Issue Citizenship: base 40 → 45
  - [ ] Collaboration Spirit: base 30 → 35, adjust external contrib bonuses

- [ ] Update existing tests (AC: #5)
  - [ ] Update all threshold boundary tests with new values
  - [ ] Fix any failing tests due to threshold changes
  - [ ] Verify edge case tests still pass

- [ ] Write new regression tests (AC: #6)
  - [ ] Test: score 85 returns 'extremely-nice' (was 90)
  - [ ] Test: score 70 returns 'very-nice' (was 75)
  - [ ] Test: score 55 returns 'sort-of-nice' (was 60)
  - [ ] Test: score 40 returns 'borderline' (was 45)
  - [ ] Test: score 25 returns 'sort-of-naughty' (was 30)
  - [ ] Test: score 12 returns 'very-naughty' (was 15)
  - [ ] Test: boundary testing at exact thresholds
  - [ ] Test: individual category base score increases
  - [ ] Test: typical user scenario shows 5-10 point improvement

- [ ] Manual verification (AC: #3, #4)
  - [ ] Test with 3-5 sample GitHub usernames
  - [ ] Compare old vs new scores (should be 5-10 points higher)
  - [ ] Verify no scores > 100 or < 0
  - [ ] Document score improvements in completion notes

## Dev Notes

### Current State
- File: `lib/scoring.ts`
- Overall thresholds set at 90/75/60/45/30/15 boundaries
- Individual categories have varying base scores (30-50 range)
- Users consistently score lower than expected

### Required Changes

**A. Overall Thresholds (getVerdictTier function)**

Location: `lib/scoring.ts` lines 441-448

```typescript
// BEFORE
if (score >= 90) return 'extremely-nice';
if (score >= 75) return 'very-nice';
if (score >= 60) return 'sort-of-nice';
if (score >= 45) return 'borderline';
if (score >= 30) return 'sort-of-naughty';
if (score >= 15) return 'very-naughty';
return 'extremely-naughty';

// AFTER
if (score >= 85) return 'extremely-nice';
if (score >= 70) return 'very-nice';
if (score >= 55) return 'sort-of-nice';
if (score >= 40) return 'borderline';
if (score >= 25) return 'sort-of-naughty';
if (score >= 12) return 'very-naughty';
return 'extremely-naughty';
```

**B. Individual Category Base Scores**

| Category | Function | Old Base | New Base | Line Range |
|----------|----------|----------|----------|------------|
| Commit Consistency | `scoreCommitConsistency` | 0 | 10 | 26-74 |
| Message Quality | `scoreMessageQuality` | 50 | 55 | 76-125 |
| PR Hygiene | `scorePRHygiene` | 50 | 50* | 127-213 |
| Review Karma | `scoreReviewKarma` | 30 | 35 | 215-252 |
| Issue Citizenship | `scoreIssueCitizenship` | 40 | 45 | 254-301 |
| Collaboration Spirit | `scoreCollaborationSpirit` | 30 | 35 | 311-406 |

*PR Hygiene base stays at 50, but increase merge rate bonus multipliers slightly

**Additional Adjustments:**
- Reduce variance penalty weight in Commit Consistency
- Reduce penalties for short commit messages in Message Quality
- Increase per-review bonus from 4 to 5 points in Review Karma

### Testing Strategy

**Test File:** `lib/scoring.test.ts`

**Required Test Updates:**
1. Update all existing threshold tests with new values
2. Add boundary tests for exact threshold values (85, 70, 55, etc.)
3. Add regression tests comparing typical scenarios before/after
4. Verify no scores exceed bounds (0-100 range)

**Test Pattern Example:**
```typescript
describe('Scoring Adjustments - Kinder Thresholds', () => {
  test('score 85 returns extremely-nice (was 90)', () => {
    expect(getVerdictTier(85)).toBe('extremely-nice');
  });

  test('commitConsistency has higher base score', () => {
    const result = scoreCommitConsistency([]);
    expect(result.score).toBeGreaterThanOrEqual(10);
  });
});
```

### Edge Cases to Consider
- Empty data sets (no commits, no PRs, etc.)
- Maximum scores (ensure cap at 100)
- Minimum scores (ensure floor at 0)
- Boundary values (exactly 85, 70, 55, etc.)
- Regression: typical user should score higher

### Impact Analysis
**Expected outcomes:**
- Users with moderate activity: ~55 → ~60-65 points
- Users with good activity: ~70 → ~75-80 points
- Users with excellent activity: ~80 → ~85-90 points
- More users reach "nice" tiers, increasing shareability

**No impact on:**
- Scoring calculation logic (formulas stay the same)
- Data fetching or GitHub API integration
- UI/UX presentation of scores

### Files to Modify
1. `lib/scoring.ts` - Update thresholds and base scores
2. `lib/scoring.test.ts` - Update existing tests + add 15+ new test cases

### Project Structure Notes
- Scoring logic is isolated in single file (good for testing)
- Pure functions with clear inputs/outputs
- No external dependencies beyond GitHub API data types
- Easy to verify changes with unit tests

### References
- [Source: docs/sprint-artifacts/tech-spec-quick-wins-and-fixes.md#Task 2.1: Adjust Scoring to Be Kinder]
- [Source: docs/sprint-artifacts/tech-spec-quick-wins-and-fixes.md#Task 2.1: Scoring Adjustments Tests]
- File: `lib/scoring.ts` (lines 26-448 for all scoring functions)

## Dev Agent Record

### Context Reference

<!-- Will be populated by dev agent -->

### Agent Model Used

<!-- Will be populated by dev agent -->

### Debug Log References

<!-- Will be populated by dev agent -->

### Completion Notes List

<!-- Will be populated by dev agent -->

### File List

<!-- Will be populated by dev agent -->
