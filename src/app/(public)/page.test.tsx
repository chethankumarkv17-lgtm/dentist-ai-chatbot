import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Home from './page';

describe('Home page', () => {
  it('renders correctly', () => {
    render(<Home />);
    // Just a placeholder test to ensure vitest runs
    expect(document.body).toBeDefined();
  });
});
