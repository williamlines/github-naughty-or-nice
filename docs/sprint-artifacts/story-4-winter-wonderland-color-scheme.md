# Story 4: Winter Wonderland Color Scheme

Status: drafted

## Story

As a **user experiencing the holiday app**,
I want **a refreshed winter wonderland color palette (blues, whites, silvers)**,
so that **the visual design feels modern and cohesive while maintaining festive spirit**.

## Acceptance Criteria

1. All green colors replaced with blue shades (blue-400/500/600)
2. All red accent colors replaced with silver/white tones
3. Background gradient uses winter blues (#0f172a → #1e3a8a)
4. Festive emojis and copy remain unchanged (🎅, 🎄, "Santa Says...", etc.)
5. Visual coherence across all pages (landing, results, loading states)
6. Accessibility maintained - all text meets WCAG AA contrast ratios (4.5:1)
7. Manual visual testing confirms clean, cohesive appearance

## Tasks / Subtasks

- [ ] Update global CSS variables and body gradient (AC: #2, #3)
  - [ ] Modify `app/globals.css` lines 5-15 (CSS variables)
  - [ ] Change `--accent: #22c55e` → `--accent: #60a5fa` (ice blue)
  - [ ] Change `--accent-red: #ef4444` → `--accent-secondary: #cbd5e1` (silver)
  - [ ] Update body gradient: `#1e1b4b` → `#1e3a8a` (winter blue)

- [ ] Update landing page colors (AC: #1, #4)
  - [ ] Modify `app/page.tsx` line 33 (title gradient)
  - [ ] Change: `from-green-400 via-white to-red-400` → `from-blue-400 via-slate-50 to-blue-300`
  - [ ] Modify `app/page.tsx` line 67 (button gradient)
  - [ ] Change: `from-green-500 to-green-600 hover:from-green-600 hover:to-green-700`
  - [ ] To: `from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700`
  - [ ] Verify festive emojis remain unchanged

- [ ] Update component colors (AC: #1)
  - [ ] Modify `components/LoadingSpinner.tsx` line 4
  - [ ] Change: `border-green-500` → `border-blue-400`
  - [ ] Scan other components for green/red colors and update to blue/silver

- [ ] Accessibility verification (AC: #6)
  - [ ] Test text contrast ratios with WebAIM Contrast Checker
  - [ ] Verify white text on blue backgrounds meets 4.5:1 minimum
  - [ ] Check button text contrast in all states (default, hover, active)
  - [ ] Document any accessibility issues and fix

- [ ] Manual visual testing (AC: #5, #7)
  - [ ] Landing page: verify blue gradient on title and button
  - [ ] Loading state: verify blue spinner
  - [ ] Results page: verify cohesive winter color scheme
  - [ ] Test across browsers (Chrome, Firefox, Safari)
  - [ ] Test on mobile devices for color consistency

- [ ] Optional: Visual regression tests (AC: #7)
  - [ ] Capture screenshots with Playwright/Chromatic (if available)
  - [ ] Compare before/after color changes
  - [ ] Document visual changes in completion notes

## Dev Notes

### New Color Palette

**Winter Wonderland Theme:**
- Primary: Ice Blue (#60a5fa / blue-400)
- Secondary: Snow White (#f8fafc / slate-50)
- Accent: Silver (#cbd5e1 / slate-300)
- Background: Deep Winter Night (#0f172a → #1e3a8a) gradient
- Text: Soft White (#f1f5f9)
- Borders: Frosted Glass (white/10-20)

### Files to Modify

**1. app/globals.css**

Location: Lines 5-15 (CSS variables) and body gradient

```css
/* BEFORE */
--accent: #22c55e;        /* green */
--accent-red: #ef4444;    /* red */

body {
  background: linear-gradient(to bottom, #0f172a, #1e1b4b);
}

/* AFTER */
--accent: #60a5fa;        /* ice blue */
--accent-secondary: #cbd5e1; /* silver */

body {
  background: linear-gradient(to bottom, #0f172a, #1e3a8a);
}
```

**2. app/page.tsx**

Location: Line 33 (title gradient), Line 67 (button)

```tsx
{/* BEFORE - Line 33 */}
<h1 className="... bg-gradient-to-r from-green-400 via-white to-red-400 ...">

{/* AFTER - Line 33 */}
<h1 className="... bg-gradient-to-r from-blue-400 via-slate-50 to-blue-300 ...">

{/* BEFORE - Line 67 */}
<button className="... bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 ...">

{/* AFTER - Line 67 */}
<button className="... bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 ...">
```

**3. components/LoadingSpinner.tsx**

Location: Line 4 (spinner border color)

```tsx
{/* BEFORE */}
<div className="... border-green-500 ..."></div>

{/* AFTER */}
<div className="... border-blue-400 ..."></div>
```

**4. Other Component Files**

Search for and replace:
- Any `green-*` Tailwind classes → `blue-*` equivalents
- Any `red-*` accent colors → `slate-*` or `white` equivalents
- Keep all emojis, festive copy, and tone unchanged

### What NOT to Change

✅ **Keep unchanged:**
- All emoji (🎅, 🎄, ❄️, 🎁, etc.)
- Festive copy ("Santa Says...", "Naughty or Nice", etc.)
- Tone and personality of the app
- Layout and structure
- Typography and spacing
- Animation timing and effects

### Testing Strategy

**Visual Testing Checklist:**
1. Landing page:
   - [ ] Title uses blue gradient (not green/red)
   - [ ] Button is blue (not green)
   - [ ] Background is winter blue gradient
2. Loading state:
   - [ ] Spinner is blue (not green)
   - [ ] Loading messages display correctly
3. Results page:
   - [ ] Overall color scheme is cohesive
   - [ ] Blue tones used consistently
   - [ ] Festive elements preserved

**Accessibility Testing:**
- Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Test combinations:
  - White text (#f1f5f9) on blue backgrounds (#60a5fa, #1e3a8a)
  - Button text in all states
- Minimum ratio: 4.5:1 for WCAG AA compliance

**Browser Testing:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Edge Cases

- Dark mode (if exists): Verify winter colors work in dark mode
- High contrast mode: Test with OS-level high contrast settings
- Print styles: Ensure colors don't break print layout (if applicable)

### Rollback Plan

If visual issues arise:
```bash
git revert <commit-hash>
```

Only these files affected:
- `app/globals.css`
- `app/page.tsx`
- `components/LoadingSpinner.tsx`
- Any other component files with color updates

### Impact Analysis

**What changes:**
- Visual appearance (colors only)
- User perception (modern winter theme vs classic Christmas)

**What stays the same:**
- All functionality
- All festive copy and emojis
- Layout and structure
- Performance
- Accessibility (maintained or improved)

### Project Structure Notes

- Next.js 15 with Tailwind CSS for styling
- Global styles in `app/globals.css`
- Component styles via Tailwind utility classes
- No CSS-in-JS libraries (pure Tailwind)
- Color consistency maintained via Tailwind config

### References

- [Source: docs/sprint-artifacts/tech-spec-quick-wins-and-fixes.md#Task 2.2: Winter Wonderland Color Scheme]
- Files: `app/globals.css`, `tailwind.config.ts`, `app/page.tsx`, `components/*.tsx`
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

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
