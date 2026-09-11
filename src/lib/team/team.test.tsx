import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { teamMembers } from '@/data/teamMembers';
import { TeamSection } from '@/components/team/TeamSection';
import { TeamCard } from '@/components/team/TeamCard';
import { TeamModal } from '@/components/team/TeamModal';
import { TeamCarousel } from '@/components/team/TeamCarousel';

// Mock next/image to render standard img tag with alt & src
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

describe('Editorial Team Members Suite (Light Theme & Infinite Carousel)', () => {
  describe('1. Centralized Team Data Validation', () => {
    it('contains all 6 team members with required editorial fields and webp images', () => {
      expect(teamMembers.length).toBe(6);

      const expectedIds = ['chethan-kumar', 'sanjana', 'suhani', 'shreya', 'kishan', 'srujan'];
      expect(teamMembers.map((m) => m.id)).toEqual(expectedIds);

      teamMembers.forEach((member) => {
        expect(member.id).toBeTruthy();
        expect(member.index).toMatch(/^\d{2}$/);
        expect(member.name).toBeTruthy();
        expect(member.role).toBeTruthy();
        expect(member.image).toMatch(/^\/team\/[a-z0-9-]+\.webp$/);
        expect(member.email).toMatch(/^[a-z0-9.]+@gmail\.com$/);
        expect(member.description).toBeTruthy();
        expect(member.linkedin).toBeTruthy();
      });
    });

    it('includes Chethan Kumar K V as AI/ML Engineer in the core team', () => {
      const chethan = teamMembers.find((m) => m.name.toLowerCase().includes('chethan'));
      expect(chethan).toBeDefined();
      expect(chethan?.role).toContain('AI/ML');
      expect(chethan?.image).toBe('/team/chethan.webp');
      expect(chethan?.email).toBe('chethankumar.ai@gmail.com');
    });
  });

  describe('2. TeamSection Component', () => {
    it('renders the editorial section header, TECH TITAN subtitle, and carousel', () => {
      render(<TeamSection />);

      expect(screen.getByText(/01 \/ TEAM/i)).toBeDefined();
      expect(screen.getByText(/Meet the minds behind the project/i)).toBeDefined();
      expect(screen.getAllByText(/TECH TITAN/i).length).toBeGreaterThan(0);

      teamMembers.forEach((member) => {
        expect(screen.getAllByText(member.name).length).toBeGreaterThan(0);
      });
    });

    it('has id="team" and scroll margin to prevent sticky navbar overlap', () => {
      const { container } = render(<TeamSection />);
      const section = container.querySelector('#team');
      expect(section).not.toBeNull();
      expect(section?.className).toContain('scroll-mt-');
      expect(section?.className).toContain('bg-white');
    });
  });

  describe('3. TeamCarousel Component', () => {
    it('renders duplicated track items for seamless infinite marquee loop', () => {
      render(<TeamCarousel onSelectMember={vi.fn()} />);

      const carousel = screen.getByLabelText(/Team members carousel/i);
      expect(carousel).toBeDefined();

      const prevBtn = screen.getByLabelText(/Previous team member/i);
      const nextBtn = screen.getByLabelText(/Next team member/i);
      expect(prevBtn).toBeDefined();
      expect(nextBtn).toBeDefined();
    });

    it('handles manual previous and next navigation clicks', () => {
      render(<TeamCarousel onSelectMember={vi.fn()} />);

      const nextBtn = screen.getByLabelText(/Next team member/i);
      fireEvent.click(nextBtn);

      const prevBtn = screen.getByLabelText(/Previous team member/i);
      fireEvent.click(prevBtn);
    });

    it('handles mobile touch swipe events without crashing', () => {
      render(<TeamCarousel onSelectMember={vi.fn()} />);

      const carousel = screen.getByLabelText(/Team members carousel/i);

      fireEvent.touchStart(carousel, { touches: [{ clientX: 300, clientY: 100 }] });
      fireEvent.touchMove(carousel, { touches: [{ clientX: 200, clientY: 100 }] });
      fireEvent.touchEnd(carousel);
    });
  });

  describe('4. TeamCard Component', () => {
    it('renders member name, index, role, description, email, and accessible LinkedIn link', () => {
      const mockSelect = vi.fn();
      const member = teamMembers[0];

      render(<TeamCard member={member} onSelect={mockSelect} />);

      expect(screen.getByText(member.index)).toBeDefined();
      expect(screen.getByText(member.name)).toBeDefined();
      expect(screen.getByText(member.role)).toBeDefined();
      expect(screen.getByText(member.email!)).toBeDefined();
      expect(screen.getByText(member.description)).toBeDefined();

      const linkedinLink = screen.getByLabelText(new RegExp(`LinkedIn profile of ${member.name}`, 'i'));
      expect(linkedinLink).toBeDefined();
      expect(linkedinLink.getAttribute('href')).toBe(member.linkedin);
    });

    it('triggers onSelect callback when clicking the card', () => {
      const mockSelect = vi.fn();
      const member = teamMembers[0];

      const { container } = render(<TeamCard member={member} onSelect={mockSelect} />);
      const card = container.querySelector('article');
      if (card) {
        fireEvent.click(card);
        expect(mockSelect).toHaveBeenCalledWith(member);
      }
    });
  });

  describe('5. TeamModal Component', () => {
    it('renders expanded profile details with bio, email, and skill chips when active', () => {
      const mockClose = vi.fn();
      const member = teamMembers[0];

      render(<TeamModal member={member} onClose={mockClose} />);

      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText(member.name)).toBeDefined();
      expect(screen.getByText(member.email!)).toBeDefined();
      expect(screen.getByText(/Overview & Focus/i)).toBeDefined();

      member.skills?.forEach((skill) => {
        expect(screen.getByText(skill)).toBeDefined();
      });
    });

    it('calls onClose when close button is clicked', () => {
      const mockClose = vi.fn();
      const member = teamMembers[0];

      render(<TeamModal member={member} onClose={mockClose} />);
      const closeBtn = screen.getByLabelText(/Close profile details/i);
      fireEvent.click(closeBtn);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const mockClose = vi.fn();
      const member = teamMembers[0];

      render(<TeamModal member={member} onClose={mockClose} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when member is null', () => {
      const { container } = render(<TeamModal member={null} onClose={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
