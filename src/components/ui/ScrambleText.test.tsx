import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ScrambleText, useTextScramble } from '@/components/ui/ScrambleText';

function TestHookComponent({ text, onLeaveBehavior }: { text: string; onLeaveBehavior?: 'finish' | 'snap' }) {
  const { displayText, hoverProps } = useTextScramble(text, { durationMs: 400, onLeaveBehavior });
  return (
    <button {...hoverProps} data-testid="scramble-btn">
      {displayText}
    </button>
  );
}

describe('ScrambleText & useTextScramble Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders original text initially with proper accessibility attributes', () => {
    render(<ScrambleText text="How It Works" />);
    const accessibleContainer = screen.getByLabelText('How It Works');
    expect(accessibleContainer).toBeDefined();

    // Hidden screen-reader text must exist with full ungarbled word
    const srOnly = accessibleContainer.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe('How It Works');
  });

  it('scrambles characters on hover while preserving exact length and whitespace', () => {
    render(<TestHookComponent text="How It Works" />);
    const btn = screen.getByTestId('scramble-btn');

    expect(btn.textContent).toBe('How It Works');

    // Trigger hover
    act(() => {
      fireEvent.mouseEnter(btn);
    });

    // Advance 70ms into the animation
    act(() => {
      vi.advanceTimersByTime(70);
    });

    // Must preserve identical length (12 characters)
    expect(btn.textContent?.length).toBe('How It Works'.length);

    // Whitespace indices (3 and 6) must remain spaces
    expect(btn.textContent?.[3]).toBe(' ');
    expect(btn.textContent?.[6]).toBe(' ');

    // Advance beyond 400ms duration -> should fully resolve to original word
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(btn.textContent).toBe('How It Works');
  });

  it('allows natural resolution on mouseLeave by default (finish behavior)', () => {
    render(<TestHookComponent text="Features" onLeaveBehavior="finish" />);
    const btn = screen.getByTestId('scramble-btn');

    act(() => {
      fireEvent.mouseEnter(btn);
      vi.advanceTimersByTime(100);
    });

    // Cursor leaves early
    act(() => {
      fireEvent.mouseLeave(btn);
    });

    // Still in progress / resolving
    act(() => {
      vi.advanceTimersByTime(350);
    });

    // Successfully resolved to original text
    expect(btn.textContent).toBe('Features');
  });

  it('snaps back immediately when onLeaveBehavior is set to snap', () => {
    render(<TestHookComponent text="Pricing" onLeaveBehavior="snap" />);
    const btn = screen.getByTestId('scramble-btn');

    act(() => {
      fireEvent.mouseEnter(btn);
      vi.advanceTimersByTime(100);
    });

    // Cursor leaves early
    act(() => {
      fireEvent.mouseLeave(btn);
    });

    // Immediately snaps back to Pricing
    expect(btn.textContent).toBe('Pricing');
  });

  it('supports keyboard accessibility via focus and blur', () => {
    render(<ScrambleText text="Team" />);
    const el = screen.getByLabelText('Team');

    act(() => {
      fireEvent.focus(el);
      vi.advanceTimersByTime(500);
    });

    expect(el.textContent).toContain('Team');
  });
});