# Test Plan: Naughty or Nice

> **Pragmatic testing strategy for hackathon delivery**
>
> **Version:** 1.0  
> **Created:** 2025-12-07  
> **Author:** PM Agent (BMAD Method)  
> **Approach:** Manual testing with structured test cases

---

## 1. Test Objectives

### 1.1 Goals

| Goal                       | Description                           |
| -------------------------- | ------------------------------------- |
| **Functional Correctness** | All features work as specified in PRD |
| **Error Resilience**       | App handles failures gracefully       |
| **User Experience**        | Flow is smooth, no jarring issues     |
| **Demo Readiness**         | App works reliably for presentation   |

### 1.2 Non-Goals (Out of Scope)

- ~~Automated test suite~~ ✅ **Now implemented with Vitest!**
- Performance/load testing
- Security penetration testing
- Cross-browser compatibility (beyond major browsers)

---

## 2. Test Environment

### 2.1 Development Testing

| Environment | Details                                    |
| ----------- | ------------------------------------------ |
| **Local**   | `http://localhost:3000`                    |
| **Browser** | Chrome (primary), Safari (secondary)       |
| **Device**  | Desktop + Chrome DevTools mobile emulation |

### 2.2 Pre-Demo Testing

| Environment    | Details                   |
| -------------- | ------------------------- |
| **Staging**    | Vercel preview deployment |
| **Production** | Vercel production URL     |

### 2.3 Required Credentials

- GitHub PAT with public repo access
- OpenAI API key

---

## 3. Test Data

### 3.1 Test Usernames

| Category              | Username                     | Expected Behavior                 |
| --------------------- | ---------------------------- | --------------------------------- |
| **Active developer**  | Your own username            | Full analysis, varied scores      |
| **Very active**       | `torvalds`                   | High activity, may hit API limits |
| **Moderately active** | `gaearon`                    | Good test case, React maintainer  |
| **Low activity**      | Create test account          | Low scores, "quiet" messaging     |
| **No activity 2025**  | Find inactive account        | `hasActivity: false` handling     |
| **Non-existent**      | `thisisnotarealuser12345xyz` | 404 error handling                |
| **Invalid format**    | `user@name`                  | Client-side validation error      |
| **Empty input**       | ``                           | Validation prevents submit        |

### 3.2 Edge Case Usernames

| Case                   | Username Example | Test Focus                         |
| ---------------------- | ---------------- | ---------------------------------- |
| **Single character**   | `a`              | Min length handling                |
| **Max length (39)**    | `a]` repeated    | Max length handling                |
| **With hyphens**       | `my-username`    | Hyphen validation                  |
| **Starts with hyphen** | `-username`      | Should be invalid                  |
| **Ends with hyphen**   | `username-`      | Should be invalid                  |
| **Case sensitivity**   | `TorVaLdS`       | Should work (lowercase internally) |

---

## 4. Test Cases by Feature

### 4.1 Landing Page (TC-LP)

| ID       | Test Case                    | Steps                       | Expected Result                            | Priority |
| -------- | ---------------------------- | --------------------------- | ------------------------------------------ | -------- |
| TC-LP-01 | Page loads                   | Navigate to `/`             | Page displays with headline, input, button | P0       |
| TC-LP-02 | Input accepts valid username | Type `octocat`              | Input accepts, no error shown              | P0       |
| TC-LP-03 | Input rejects invalid chars  | Type `user@name`            | Error message shown inline                 | P0       |
| TC-LP-04 | Submit disabled when empty   | Clear input                 | Button is disabled                         | P0       |
| TC-LP-05 | Submit enabled when valid    | Type valid username         | Button is enabled                          | P0       |
| TC-LP-06 | Enter key submits            | Type username, press Enter  | Navigates to `/username`                   | P0       |
| TC-LP-07 | Button click submits         | Type username, click button | Navigates to `/username`                   | P0       |
| TC-LP-08 | Responsive layout            | Resize to mobile width      | Layout adapts, still usable                | P1       |

---

### 4.2 Loading State (TC-LS)

| ID       | Test Case              | Steps                  | Expected Result                      | Priority |
| -------- | ---------------------- | ---------------------- | ------------------------------------ | -------- |
| TC-LS-01 | Loading appears        | Submit valid username  | Loading state displays immediately   | P0       |
| TC-LS-02 | Messages rotate        | Watch loading screen   | Messages change every ~2 seconds     | P1       |
| TC-LS-03 | Minimum duration       | Submit cached username | Loading shows for at least 2 seconds | P1       |
| TC-LS-04 | Transitions to results | Wait for API           | Results page appears after loading   | P0       |

---

### 4.3 Results Page (TC-RP)

| ID       | Test Case                | Steps                  | Expected Result                          | Priority |
| -------- | ------------------------ | ---------------------- | ---------------------------------------- | -------- |
| TC-RP-01 | Verdict displays         | Complete analysis      | Emoji, label, score, flavor text shown   | P0       |
| TC-RP-02 | Avatar displays          | Complete analysis      | User's GitHub avatar visible             | P0       |
| TC-RP-03 | Username links to GitHub | Click username         | Opens GitHub profile in new tab          | P1       |
| TC-RP-04 | All 6 categories shown   | Complete analysis      | All 6 category scores with progress bars | P0       |
| TC-RP-05 | Quips display            | Complete analysis      | Each category has contextual quip        | P0       |
| TC-RP-06 | AI summary displays      | Complete analysis      | 2-3 sentence Santa summary shown         | P0       |
| TC-RP-07 | Envelope animation       | First load of results  | Envelope reveal animation plays          | P1       |
| TC-RP-08 | Animation skippable      | Click during animation | Animation completes immediately          | P2       |
| TC-RP-09 | Responsive layout        | View on mobile         | Layout adapts, all content visible       | P1       |

---

### 4.4 Scoring Accuracy (TC-SC)

| ID       | Test Case                     | Steps                   | Expected Result                                    | Priority |
| -------- | ----------------------------- | ----------------------- | -------------------------------------------------- | -------- |
| TC-SC-01 | Score range valid             | Check any result        | All scores between 0-100                           | P0       |
| TC-SC-02 | Overall is average            | Calculate manually      | Overall ≈ average of 6 categories                  | P1       |
| TC-SC-03 | Tier matches score            | Check verdict tier      | Tier matches score range (e.g., 75-89 = Very Nice) | P0       |
| TC-SC-04 | Active user has varied scores | Check active username   | Not all scores identical                           | P1       |
| TC-SC-05 | Inactive user neutral         | Check inactive username | Scores around 50, appropriate messaging            | P1       |

---

### 4.5 Error Handling (TC-ER)

| ID       | Test Case               | Steps                            | Expected Result                         | Priority |
| -------- | ----------------------- | -------------------------------- | --------------------------------------- | -------- |
| TC-ER-01 | User not found          | Submit `nonexistentuser12345xyz` | Friendly 404 message, retry option      | P0       |
| TC-ER-02 | Invalid username format | Submit `user@name`               | Validation error on input (client-side) | P0       |
| TC-ER-03 | Rate limit handling     | (Hard to test)                   | Friendly rate limit message             | P1       |
| TC-ER-04 | API error handling      | (Hard to test)                   | Generic error with retry option         | P1       |
| TC-ER-05 | AI fallback             | (If OpenAI fails)                | Template verdict displays instead       | P1       |
| TC-ER-06 | Try again works         | Click retry on error             | Returns to landing page or retries      | P0       |

---

### 4.6 Social Sharing (TC-SH)

| ID       | Test Case               | Steps                | Expected Result                           | Priority |
| -------- | ----------------------- | -------------------- | ----------------------------------------- | -------- |
| TC-SH-01 | Share to X button       | Click "Share on X"   | Twitter intent opens with pre-filled text | P0       |
| TC-SH-02 | Pre-filled text correct | Check Twitter intent | Includes score, verdict, URL              | P0       |
| TC-SH-03 | Copy link works         | Click "Copy Link"    | URL copied, confirmation shown            | P0       |
| TC-SH-04 | Copied URL works        | Paste and navigate   | Opens results page for that user          | P0       |
| TC-SH-05 | Check another user      | Click button         | Returns to landing page                   | P0       |

---

### 4.7 OG Image & Meta Tags (TC-OG)

| ID       | Test Case              | Steps                      | Expected Result                        | Priority |
| -------- | ---------------------- | -------------------------- | -------------------------------------- | -------- |
| TC-OG-01 | OG image generates     | Visit `/api/og/[username]` | PNG image displays (1200x630)          | P0       |
| TC-OG-02 | OG image content       | Check generated image      | Shows username, avatar, verdict, score | P0       |
| TC-OG-03 | Twitter Card validates | Use Twitter Card Validator | Card preview shows correctly           | P0       |
| TC-OG-04 | Meta tags present      | View page source           | OG and Twitter meta tags present       | P1       |

---

### 4.8 Direct URL Access (TC-URL)

| ID        | Test Case            | Steps                       | Expected Result                           | Priority |
| --------- | -------------------- | --------------------------- | ----------------------------------------- | -------- |
| TC-URL-01 | Direct results URL   | Navigate to `/octocat`      | Results page loads (or loading → results) | P0       |
| TC-URL-02 | Invalid username URL | Navigate to `/invalid@user` | Error page or redirect                    | P1       |
| TC-URL-03 | Back button          | Press back from results     | Returns to previous page                  | P1       |
| TC-URL-04 | Refresh results      | Refresh results page        | Page reloads correctly                    | P1       |

---

### 4.9 API Endpoint (TC-API)

| ID        | Test Case          | Steps                               | Expected Result                    | Priority |
| --------- | ------------------ | ----------------------------------- | ---------------------------------- | -------- |
| TC-API-01 | Valid request      | GET `/api/analyze/octocat`          | 200 with `UserAnalysis` JSON       | P0       |
| TC-API-02 | Invalid username   | GET `/api/analyze/user@name`        | 400 with error JSON                | P0       |
| TC-API-03 | User not found     | GET `/api/analyze/nonexistent12345` | 404 with error JSON                | P0       |
| TC-API-04 | Response structure | Check JSON response                 | Matches `AnalysisResponse` type    | P0       |
| TC-API-05 | Caching works      | Request same user twice             | Second request faster (check logs) | P1       |

---

## 5. Pre-Demo Checklist

### 5.1 Functionality Verification

```markdown
## Core Flow

- [ ] Can enter username on landing page
- [ ] Loading state appears and rotates messages
- [ ] Results display with all sections
- [ ] Envelope animation plays smoothly
- [ ] Share buttons work

## Test Users (verify all work)

- [ ] Your own username: **\*\***\_\_\_\_**\*\***
- [ ] Active developer: `gaearon` or `sindresorhus`
- [ ] Linux creator: `torvalds`

## Error Handling

- [ ] Invalid username shows error: `test@user`
- [ ] Non-existent user shows 404: `zzznotreal12345`

## Sharing

- [ ] "Share on X" opens Twitter with correct text
- [ ] "Copy Link" copies and shows confirmation
- [ ] Copied link works when pasted in new tab
- [ ] OG image shows in Twitter Card Validator
```

### 5.2 Visual/UX Check

```markdown
## Desktop (Chrome)

- [ ] Layout looks correct
- [ ] Fonts load properly
- [ ] Colors match design intent
- [ ] Animations are smooth
- [ ] No console errors

## Mobile (Chrome DevTools → iPhone 12 Pro)

- [ ] Landing page usable
- [ ] Form is tappable
- [ ] Results page scrollable
- [ ] Share buttons accessible
- [ ] Text readable (not too small)

## Tablet (Chrome DevTools → iPad)

- [ ] Layout adapts appropriately
```

### 5.3 Edge Cases

```markdown
## API Resilience

- [ ] Handles slow network (throttle in DevTools)
- [ ] Handles API errors gracefully

## Data Edge Cases

- [ ] User with 0 commits still works
- [ ] User with 1000+ commits doesn't timeout
```

---

## 6. Bug Severity Definitions

| Severity     | Definition                                  | Action                      |
| ------------ | ------------------------------------------- | --------------------------- |
| **Critical** | App crashes, data loss, security issue      | Fix immediately, block demo |
| **High**     | Major feature broken, no workaround         | Fix before demo             |
| **Medium**   | Feature partially broken, workaround exists | Fix if time permits         |
| **Low**      | Cosmetic issue, minor inconvenience         | Note for post-hackathon     |

---

## 7. Known Limitations

These are **not bugs** — they are documented limitations:

| Limitation              | Reason                | User Impact                       |
| ----------------------- | --------------------- | --------------------------------- |
| Events API 90-day limit | GitHub API constraint | Some data may be incomplete       |
| 300 event max           | GitHub API constraint | Heavy users may have partial data |
| In-memory cache         | Hackathon simplicity  | Cache lost on cold start          |
| Public repos only       | No OAuth implemented  | Private activity not analyzed     |

---

## 8. Test Execution Log

Use this table to track test execution:

| Date | Tester | Environment | Tests Run | Pass | Fail | Notes |
| ---- | ------ | ----------- | --------- | ---- | ---- | ----- |
|      |        |             |           |      |      |       |
|      |        |             |           |      |      |       |
|      |        |             |           |      |      |       |

---

## 9. Automated Unit Tests

### 9.1 Test Framework

| Tool                          | Purpose           |
| ----------------------------- | ----------------- |
| **Vitest**                    | Test runner       |
| **@testing-library/react**    | Component testing |
| **@testing-library/jest-dom** | DOM assertions    |

### 9.2 Running Tests

```bash
npm test              # Watch mode (interactive)
npm run test:run      # Single run (CI-friendly)
npm run test:coverage # With coverage report
```

### 9.3 Current Test Coverage

| File             | Tests    | Status      |
| ---------------- | -------- | ----------- |
| `lib/scoring.ts` | 39 tests | ✅ Complete |
| `lib/utils.ts`   | 8 tests  | ✅ Complete |
| `lib/env.ts`     | 4 tests  | ✅ Complete |
| `lib/ai.ts`      | 10 tests | ✅ Complete |
| `lib/github.ts`  | 16 tests | ✅ Complete |
| `lib/errors.ts`  | 9 tests  | ✅ Complete |
| `components/LoadingSpinner.tsx` | 3 tests | ✅ Complete |
| `components/ErrorState.tsx` | 8 tests | ✅ Complete |
| `components/VerdictCard.tsx` | 8 tests | ✅ Complete |
| `components/CategoryRow.tsx` | 12 tests | ✅ Complete |
| `components/ScoreBreakdown.tsx` | 6 tests | ✅ Complete |
| `components/AISummary.tsx` | 7 tests | ✅ Complete |

**Total: 130 tests passing**

### 9.4 Test File Locations

```
lib/
├── scoring.ts
├── scoring.test.ts         ← 39 unit tests
├── utils.ts
├── utils.test.ts           ← 8 unit tests
├── env.ts
├── env.test.ts             ← 4 unit tests
├── ai.ts
├── ai.test.ts              ← 10 unit tests
├── github.ts
├── github.test.ts          ← 16 unit tests
├── errors.ts
└── errors.test.ts          ← 9 unit tests

components/
├── LoadingSpinner.tsx
├── LoadingSpinner.test.tsx  ← 3 unit tests
├── ErrorState.tsx
├── ErrorState.test.tsx      ← 8 unit tests
├── VerdictCard.tsx
├── VerdictCard.test.tsx     ← 8 unit tests
├── CategoryRow.tsx
├── CategoryRow.test.tsx     ← 12 unit tests
├── ScoreBreakdown.tsx
├── ScoreBreakdown.test.tsx  ← 6 unit tests
├── AISummary.tsx
└── AISummary.test.tsx       ← 7 unit tests
```

---

## 10. Quick Reference: All Commands

```bash
# Start local dev server
npm run dev

# Build and test production
npm run build
npm run start

# Run unit tests
npm run test:run

# Check for TypeScript errors
npm run type-check

# Check for lint errors
npm run lint
```

---

## 11. Demo Day Quick Test (5 minutes)

Run these tests immediately before demo:

```markdown
1. [ ] Open production URL in fresh incognito window
2. [ ] Enter your username → verify results load
3. [ ] Enter `torvalds` → verify handles high-activity user
4. [ ] Enter `zzzfakeuser999` → verify 404 handling
5. [ ] Click "Share on X" → verify Twitter intent opens
6. [ ] Click "Copy Link" → paste in new tab → verify works
7. [ ] Open on phone → verify mobile layout
8. [ ] Check Twitter Card Validator with production URL
```

**If all 8 pass → You're ready to demo! 🎄**

---

_Test Plan generated by BMAD PM Agent — Focused on hackathon success_
