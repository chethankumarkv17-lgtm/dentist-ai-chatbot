import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { GradientMeshBackground } from '@/components/ui/GradientMeshBackground';

describe('GradientMeshBackground Suite', () => {
  it('renders mesh background with aria-hidden, pointer-events-none, and 4 animated blobs', () => {
    const { container } = render(<GradientMeshBackground />);
    const root = container.firstElementChild as HTMLElement;

    expect(root).not.toBeNull();
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.className).toContain('pointer-events-none');
    expect(root.className).toContain('absolute');

    // Verify all 4 GPU animated mesh blobs exist
    expect(container.querySelector('.animate-mesh-blob-1')).not.toBeNull();
    expect(container.querySelector('.animate-mesh-blob-2')).not.toBeNull();
    expect(container.querySelector('.animate-mesh-blob-3')).not.toBeNull();
    expect(container.querySelector('.animate-mesh-blob-4')).not.toBeNull();
  });

  it('renders noise grain overlay and allows custom grain opacity', () => {
    const { getByTestId } = render(<GradientMeshBackground showGrain={true} grainOpacity={0.07} />);
    const grainEl = getByTestId('mesh-grain');
    expect(grainEl).not.toBeNull();
    expect(grainEl.style.opacity).toBe('0.07');
  });

  it('renders WCAG contrast scrim and dot grid by default', () => {
    const { getByTestId } = render(<GradientMeshBackground showScrim={true} showGrid={true} />);
    expect(getByTestId('mesh-scrim')).not.toBeNull();
    expect(getByTestId('mesh-grid')).not.toBeNull();
  });

  it('allows disabling grain, grid, and scrim for minimal modes', () => {
    const { queryByTestId } = render(
      <GradientMeshBackground showGrain={false} showGrid={false} showScrim={false} />
    );
    expect(queryByTestId('mesh-grain')).toBeNull();
    expect(queryByTestId('mesh-scrim')).toBeNull();
    expect(queryByTestId('mesh-grid')).toBeNull();
  });
});