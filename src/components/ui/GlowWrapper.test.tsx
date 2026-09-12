import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlowWrapper } from '@/components/ui/GlowWrapper';

describe('GlowWrapper Component Suite', () => {
  it('renders primary rotating gradient glow around child button', () => {
    render(
      <GlowWrapper variant="primary">
        <button>Test CTA</button>
      </GlowWrapper>
    );

    const btn = screen.getByRole('button', { name: /Test CTA/i });
    expect(btn).toBeDefined();

    const halo = screen.getByTestId('rotating-glow-halo');
    expect(halo).toBeDefined();
    expect(halo.firstElementChild?.className).toContain('animate-spin-glow');
  });

  it('renders secondary variant with softer contrast glow', () => {
    render(
      <GlowWrapper variant="secondary" durationSeconds={4}>
        <button>Secondary CTA</button>
      </GlowWrapper>
    );

    const halo = screen.getByTestId('rotating-glow-halo');
    expect(halo.firstElementChild?.className).toContain('animate-spin-glow');
  });

  it('allows click events to reach the child button without obstruction', () => {
    let clicked = false;
    render(
      <GlowWrapper>
        <button onClick={() => { clicked = true; }}>Click Me</button>
      </GlowWrapper>
    );

    const btn = screen.getByRole('button', { name: /Click Me/i });
    fireEvent.click(btn);
    expect(clicked).toBe(true);
  });
});