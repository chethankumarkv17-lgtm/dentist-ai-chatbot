import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from './Navbar';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

const renderNavbar = () => render(<Navbar />);

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '';
    mockUsePathname.mockReturnValue('/');
  });

  it('renders all navigation items and brand elements', () => {
    renderNavbar();

    expect(screen.getByText('Radiant Nobel')).toBeDefined();
    expect(screen.getAllByRole('link', { name: /Features/i })[0]).toBeDefined();
    expect(screen.getAllByRole('link', { name: /How It Works/i })[0]).toBeDefined();
    expect(screen.getAllByRole('link', { name: /Team/i })[0]).toBeDefined();
    expect(screen.getAllByRole('link', { name: /Pricing/i })[0]).toBeDefined();
    expect(screen.getAllByRole('link', { name: /Help/i })[0]).toBeDefined();
  });

  it('highlights the Team link in blue when clicked on the homepage', () => {
    // Setup target section
    const teamSection = document.createElement('div');
    teamSection.id = 'team';
    teamSection.scrollIntoView = vi.fn();
    document.body.appendChild(teamSection);

    renderNavbar();

    const teamLinks = screen.getAllByRole('link', { name: /^Team$/i });
    const desktopTeamLink = teamLinks[0];

    // Initial state: not blue
    expect(desktopTeamLink.className).not.toContain('text-blue-600');

    // Click Team link
    fireEvent.click(desktopTeamLink);

    // Active state: turns blue with active background
    expect(desktopTeamLink.className).toContain('text-blue-600');
    expect(desktopTeamLink.className).toContain('bg-blue-50/80');

    // Cleanup
    document.body.removeChild(teamSection);
  });

  it('resets Team active state when the brand logo is clicked', () => {
    const teamSection = document.createElement('div');
    teamSection.id = 'team';
    teamSection.scrollIntoView = vi.fn();
    document.body.appendChild(teamSection);

    window.scrollTo = vi.fn();

    renderNavbar();

    const desktopTeamLink = screen.getAllByRole('link', { name: /^Team$/i })[0];
    fireEvent.click(desktopTeamLink);
    expect(desktopTeamLink.className).toContain('text-blue-600');

    // Click Brand logo
    const brandLink = screen.getByText('Radiant Nobel').closest('a');
    expect(brandLink).toBeDefined();
    if (brandLink) {
      fireEvent.click(brandLink);
    }

    // Team link is no longer active blue
    expect(desktopTeamLink.className).not.toContain('text-blue-600');

    document.body.removeChild(teamSection);
  });

  it('highlights regular page routes when pathname matches', () => {
    mockUsePathname.mockReturnValue('/features');
    renderNavbar();

    const featuresLink = screen.getAllByRole('link', { name: /^Features$/i })[0];
    expect(featuresLink.className).toContain('text-blue-600');

    const teamLink = screen.getAllByRole('link', { name: /^Team$/i })[0];
    expect(teamLink.className).not.toContain('text-blue-600');
  });

  it('highlights Team link in mobile drawer when tapped', () => {
    const teamSection = document.createElement('div');
    teamSection.id = 'team';
    teamSection.scrollIntoView = vi.fn();
    document.body.appendChild(teamSection);

    renderNavbar();

    // Open mobile menu
    const menuBtn = screen.getByLabelText(/Open menu/i);
    fireEvent.click(menuBtn);

    // Get the mobile team link (second one in DOM)
    const teamLinks = screen.getAllByRole('link', { name: /^Team$/i });
    expect(teamLinks.length).toBeGreaterThan(1);
    const mobileTeamLink = teamLinks[1];

    fireEvent.click(mobileTeamLink);

    // Desktop and mobile states should reflect active blue
    expect(teamLinks[0].className).toContain('text-blue-600');

    document.body.removeChild(teamSection);
  });
});
