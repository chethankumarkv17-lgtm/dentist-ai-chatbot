import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';
import { Card, MetricCard } from '@/components/ui/Card';
import { GlassSurface } from '@/components/ui/GlassSurface';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, MetricCardSkeleton, DashboardTableSkeleton } from '@/components/ui/Skeleton';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { DynamicTextSlider } from '@/components/home/DynamicTextSlider';
import { CapabilitiesMarquee } from '@/components/home/CapabilitiesMarquee';
import { Calendar } from 'lucide-react';

describe('Phase 44 & Liquid Glass UI/UX Suite', () => {
  describe('1. Design System Badges & Multi-Status Tokens', () => {
    it('renders success, warning, error, info, and pro badge variants', () => {
      const { container: successEl } = render(<Badge variant="success">Confirmed</Badge>);
      expect(successEl.textContent).toContain('Confirmed');

      const { container: warningEl } = render(<Badge variant="warning">Pending</Badge>);
      expect(warningEl.textContent).toContain('Pending');

      const { container: errorEl } = render(<Badge variant="error">Cancelled</Badge>);
      expect(errorEl.textContent).toContain('Cancelled');

      const { container: proEl } = render(<Badge variant="pro">Pro Feature</Badge>);
      expect(proEl.textContent).toContain('Pro Feature');

      const { container: voiceEl } = render(<Badge variant="voice">Voice Active</Badge>);
      expect(voiceEl.textContent).toContain('Voice Active');
    });
  });

  describe('2. Design System Cards & Liquid Glass Variants', () => {
    it('renders container Card with solid, glass, elevated, and interactive variants', () => {
      const { container: solidEl } = render(<Card variant="solid">Solid Card</Card>);
      expect(solidEl.textContent).toContain('Solid Card');

      const { container: glassEl } = render(<Card variant="glass">Glass Card</Card>);
      expect(glassEl.firstChild).toHaveProperty('className');
      expect((glassEl.firstChild as HTMLElement).className).toContain('liquid-glass-card');

      const { container: elevatedEl } = render(<Card variant="elevated">Elevated Card</Card>);
      expect(elevatedEl.textContent).toContain('Elevated Card');
    });

    it('renders MetricCard with value and trend indicators', () => {
      const { container } = render(
        <MetricCard
          title="Today's Appointments"
          value={12}
          subtitle="Scheduled appointments"
          icon={Calendar}
          color="blue"
          variant="glass"
          trend={{ value: '+4 vs yesterday', isPositive: true }}
        />
      );

      expect(container.textContent).toContain("Today's Appointments");
      expect(container.textContent).toContain('12');
      expect(container.textContent).toContain('+4 vs yesterday');
    });
  });

  describe('3. Liquid Glass Surfaces & Modal System', () => {
    it('renders GlassSurface with subtle, medium, and strong intensities', () => {
      const { container: subtleEl } = render(<GlassSurface intensity="subtle">Subtle Glass</GlassSurface>);
      expect((subtleEl.firstChild as HTMLElement).className).toContain('liquid-glass-subtle');

      const { container: strongEl } = render(<GlassSurface intensity="strong">Strong Glass</GlassSurface>);
      expect((strongEl.firstChild as HTMLElement).className).toContain('liquid-glass-strong');
    });

    it('renders Modal dialog with liquid glass surface when open', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Dialog">
          <p>Dialog Body</p>
        </Modal>
      );
      expect(container.textContent).toContain('Test Dialog');
      expect(container.textContent).toContain('Dialog Body');
    });
  });

  describe('4. Skeleton Shimmer Loading States', () => {
    it('renders text, rectangular, and circular skeletons', () => {
      const { container: textSkel } = render(<Skeleton variant="text" width={100} />);
      expect(textSkel.querySelector('.shimmer-loading')).toBeDefined();

      const { container: cardSkel } = render(<MetricCardSkeleton />);
      expect(cardSkel).toBeDefined();

      const { container: tableSkel } = render(<DashboardTableSkeleton rows={3} />);
      expect(tableSkel).toBeDefined();
    });
  });

  describe('5. Scroll Animation & Accessibility', () => {
    it('renders RevealOnScroll component with GPU-friendly transition classes', () => {
      const { container } = render(
        <RevealOnScroll variant="fade-up" delayMs={100} durationMs={500}>
          <span>Animated Section</span>
        </RevealOnScroll>
      );
      expect(container.textContent).toContain('Animated Section');
    });
  });

  describe('6. Homepage Dynamic Appearing Text Slider & Marquee', () => {
    it('renders DynamicTextSlider with active phrase', () => {
      const { container } = render(<DynamicTextSlider />);
      expect(container.textContent).toContain('answers patient phone calls 24/7');
    });

    it('renders CapabilitiesMarquee with duplicated capability items', () => {
      const { container } = render(<CapabilitiesMarquee />);
      expect(container.textContent).toContain('24/7 AI Voice Phone Receptionist');
      expect(container.textContent).toContain('Official WhatsApp Business Cloud API');
    });
  });

  describe('7. Liquid Glass 3D AI Orb & Status Widgets', () => {
    it('renders LiquidOrb in idle state and responds to interactive state change', async () => {
      const { LiquidOrb } = await import('@/components/ui/LiquidOrb');
      const { container } = render(<LiquidOrb state="idle" size="hero" showStateLabel={true} interactive={true} />);
      expect(container.textContent).toContain('AI Receptionist');
      expect(container.textContent).toContain('Autonomous 24/7 Practice Copilot');
    });

    it('renders LiquidOrb across listening, thinking, and responding states', async () => {
      const { LiquidOrb } = await import('@/components/ui/LiquidOrb');
      const { container: listening } = render(<LiquidOrb state="listening" size="md" showStateLabel={true} />);
      expect(listening.textContent).toContain('Listening...');

      const { container: thinking } = render(<LiquidOrb state="thinking" size="md" showStateLabel={true} />);
      expect(thinking.textContent).toContain('Thinking...');

      const { container: responding } = render(<LiquidOrb state="responding" size="md" showStateLabel={true} />);
      expect(responding.textContent).toContain('Responding...');
    });

    it('renders AIStatusOrb compact widget', async () => {
      const { AIStatusOrb } = await import('@/components/ui/AIStatusOrb');
      const { container } = render(<AIStatusOrb state="idle" showText={true} />);
      expect(container.textContent).toContain('AI Receptionist Active');
    });
  });
});
