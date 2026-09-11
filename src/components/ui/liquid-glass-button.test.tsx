import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, LiquidButton, MetalButton } from '@/components/ui/liquid-glass-button';
import DemoOne from '@/components/ui/demo';

describe('Liquid Glass & Metal Button Component Suite', () => {
  it('renders standard Button component with default and custom variants', () => {
    render(<Button variant="cool">Cool Action</Button>);
    const btn = screen.getByRole('button', { name: /Cool Action/i });
    expect(btn).toBeDefined();
    expect(btn.className).toContain('text-primary-foreground');
  });

  it('renders LiquidButton with liquid SVG glass filter backdrop', () => {
    const { container } = render(
      <LiquidButton variant="default" size="xl">
        Liquid Glass CTA
      </LiquidButton>
    );
    const btn = screen.getByRole('button', { name: /Liquid Glass CTA/i });
    expect(btn).toBeDefined();
    expect(btn.getAttribute('data-slot')).toBe('button');
    // SVG filter with id container-glass must exist
    const svgFilter = container.querySelector('#container-glass');
    expect(svgFilter).not.toBeNull();
  });

  it('renders MetalButton with variant styles and interaction state changes', () => {
    render(<MetalButton variant="gold">Gold Metal</MetalButton>);
    const btn = screen.getByRole('button', { name: /Gold Metal/i });
    expect(btn).toBeDefined();
    
    // Test mouse interactions
    fireEvent.mouseEnter(btn);
    fireEvent.mouseDown(btn);
    fireEvent.mouseUp(btn);
    fireEvent.mouseLeave(btn);
  });

  it('renders DemoOne component correctly', () => {
    render(<DemoOne />);
    expect(screen.getByText(/Liquid Glass/i)).toBeDefined();
  });
});