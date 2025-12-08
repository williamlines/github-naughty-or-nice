# Story 5: Snowfall Animation with Toggle

Status: drafted

## Story

As a **user visiting the landing page**,
I want **an optional snowfall animation that I can toggle on/off**,
so that **I experience delightful winter ambiance without sacrificing performance or usability**.

## Acceptance Criteria

1. Snowflakes fall from top to bottom smoothly (60fps minimum)
2. Toggle control is visible and functional in top-right corner
3. User preference persists across page reloads (localStorage)
4. Default state is ON (snowfall enabled)
5. No performance issues - maintains 60fps during animation
6. Snowflakes don't block UI interactions (pointer-events: none)
7. Works correctly on mobile devices (iOS/Android)
8. All unit tests pass with 90%+ coverage on new component

## Tasks / Subtasks

- [ ] Create SnowfallEffect component (AC: #1, #2, #6)
  - [ ] Create `components/SnowfallEffect.tsx` file
  - [ ] Add 'use client' directive (client component)
  - [ ] Implement toggle control UI (checkbox + label)
  - [ ] Render 50 snowflakes with random positions/durations
  - [ ] Use pointer-events: none to prevent click blocking
  - [ ] Each snowflake: random horizontal position, random animation duration (10-20s), random delay (0-10s)

- [ ] Implement localStorage persistence (AC: #3, #4)
  - [ ] Add useState for enabled/disabled state
  - [ ] Add useEffect to load preference from localStorage on mount
  - [ ] Default to true (enabled) if no preference exists
  - [ ] Save preference to localStorage on toggle

- [ ] Add CSS animations (AC: #1, #5)
  - [ ] Add snowfall CSS to `app/globals.css`
  - [ ] Define .snowfall-container and .snowflake styles
  - [ ] Create @keyframes snowfall animation (fall + horizontal drift)
  - [ ] Optimize for 60fps (use transform instead of top/left)
  - [ ] Set pointer-events: none on container

- [ ] Integrate into landing page (AC: all)
  - [ ] Import SnowfallEffect in `app/page.tsx`
  - [ ] Render at top level (before <main>)
  - [ ] Test z-index doesn't conflict with other elements

- [ ] Write comprehensive unit tests (AC: #8)
  - [ ] Test: renders toggle control
  - [ ] Test: snowfall enabled by default
  - [ ] Test: toggle disables snowfall
  - [ ] Test: toggle enables snowfall when disabled
  - [ ] Test: persists enabled state to localStorage
  - [ ] Test: persists disabled state to localStorage
  - [ ] Test: loads saved preference from localStorage
  - [ ] Test: snowflakes have random positions and durations
  - [ ] Test: snowflakes have pointer-events: none

- [ ] Performance testing (AC: #5, #7)
  - [ ] Test FPS with Chrome DevTools Performance monitor
  - [ ] Verify 60fps maintained during snowfall
  - [ ] Test on mobile devices (iOS Safari, Chrome Mobile)
  - [ ] Check for jank or dropped frames

## Dev Notes

### Component Structure

**File:** `components/SnowfallEffect.tsx` (NEW)

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
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${10 + Math.random() * 10}s`,
                animationDelay: `${Math.random() * 10}s`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}
    </>
  );
}
```

### CSS Animations

**File:** `app/globals.css` (ADD TO BOTTOM)

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

### Landing Page Integration

**File:** `app/page.tsx` (MODIFY)

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

### Performance Optimization

**Why 60fps matters:**
- Smooth, professional appearance
- No visual jank or stuttering
- Good user experience on all devices

**Optimization techniques:**
- Use CSS `transform` (GPU-accelerated) instead of `top`/`left` (CPU)
- Limit to 50 snowflakes (sweet spot for performance vs visual effect)
- Use `will-change` sparingly (only if needed)
- Pure CSS animations (no JS-based animation loops)

**Performance testing:**
```
1. Open Chrome DevTools
2. Performance → Enable "Show FPS meter"
3. Toggle snowfall ON
4. Monitor FPS (should be 60fps consistently)
```

### Testing Strategy

**File:** `components/SnowfallEffect.test.tsx` (NEW)

**Test cases (minimum 10):**
1. Renders toggle control
2. Snowfall enabled by default
3. Toggle disables snowfall
4. Toggle enables when disabled
5. Persists enabled state to localStorage
6. Persists disabled state to localStorage
7. Loads saved preference from localStorage
8. Snowflakes have random positions
9. Snowflakes have random durations
10. Snowflakes have pointer-events: none

**Testing pattern:**
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SnowfallEffect } from './SnowfallEffect';

describe('SnowfallEffect', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders toggle control', () => {
    render(<SnowfallEffect />);
    expect(screen.getByText(/Snowfall ❄️/i)).toBeInTheDocument();
  });

  test('snowfall is enabled by default', () => {
    const { container } = render(<SnowfallEffect />);
    const snowflakes = container.querySelectorAll('.snowflake');
    expect(snowflakes.length).toBe(50);
  });

  // ... more tests
});
```

### Edge Cases

- **localStorage disabled:** Handle gracefully, default to enabled
- **SSR/hydration:** useEffect ensures localStorage access only on client
- **Z-index conflicts:** Set snowfall z-index to 1 (below nav/modals)
- **Mobile performance:** Test on actual devices, not just emulators
- **Accessibility:** Toggle is keyboard accessible (native checkbox)

### Mobile Considerations

**iOS Safari:**
- Test on iPhone (Safari)
- Verify smooth 60fps animation
- Check touch interactions aren't blocked

**Android Chrome:**
- Test on Android device
- Verify performance on lower-end devices
- Check snowflakes render correctly

### Files to Create/Modify

1. **CREATE:** `components/SnowfallEffect.tsx` (new component)
2. **MODIFY:** `app/globals.css` (add CSS animations)
3. **MODIFY:** `app/page.tsx` (import and render component)
4. **CREATE:** `components/SnowfallEffect.test.tsx` (unit tests)

### Project Structure Notes

- Next.js 15 App Router
- Client component (uses useState, useEffect, localStorage)
- Pure CSS animations for performance
- No external dependencies needed
- Follows existing component patterns

### localStorage Key

**Key:** `snowfall-enabled`
**Values:** `'true'` | `'false'` (stored as strings)
**Default:** `true` (enabled)

### Accessibility

- Native checkbox element (keyboard accessible)
- Visible label with emoji
- Snowflakes don't interfere with screen readers (decorative only)
- Toggle is clearly labeled and functional

### Visual Design

- Toggle positioned top-right (non-intrusive)
- Frosted glass effect on toggle background
- White text on semi-transparent background
- Subtle border for definition
- Snowflake emoji (❄️) for visual clarity

### References

- [Source: docs/sprint-artifacts/tech-spec-quick-wins-and-fixes.md#Task 2.3: Add Snowfall Animation with Toggle]
- [Source: docs/sprint-artifacts/tech-spec-quick-wins-and-fixes.md#Task 2.3: Snowfall Effect Unit Tests]
- New files: `components/SnowfallEffect.tsx`, `components/SnowfallEffect.test.tsx`
- Modified files: `app/globals.css`, `app/page.tsx`

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
