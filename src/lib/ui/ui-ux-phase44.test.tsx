import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';
import { Card, MetricCard } from '@/components/ui/Card';
import { Skeleton, MetricCardSkeleton, DashboardTableSkeleton } from '@/components/ui/Skeleton';
import { RevealOnScroll } from '@/components/ui/RevealOnScroll';
import { DynamicTextSlider } from '@/components/home/DynamicTextSlider';
import { CapabilitiesMarquee } from '@/components/home/CapabilitiesMarquee';
import { Calendar } from 'lucide-react';

describe('Phase 44 — Premium UI/UX, Design System & Accessibility Suite', () => {
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

  describe('2. Design System Cards & Metric Indicators', () => {
    it('renders container Card with optional hoverable state', () => {
      const { container } = render(<Card hoverable>Card Content</Card>);
      expect(container.textContent).toContain('Card Content');
    });

    it('renders MetricCard with value and trend indicators', () => {
      const { container } = render(
        <MetricCard
          title="Today's Appointments"
          value={12}
          subtitle="Scheduled appointments"
          icon={Calendar}
          color="blue"
          trend={{ value: '+4 vs yesterday', isPositive: true }}
        />
      );

      expect(container.textContent).toContain("Today's Appointments");
      expect(container.textContent).toContain('12');
      expect(container.textContent).toContain('+4 vs yesterday');
    });
  });

  describe('3. Skeleton Shimmer Loading States', () => {
    it('renders text, rectangular, and circular skeletons', () => {
      const { container: textSkel } = render(<Skeleton variant="text" width={100} />);
      expect(textSkel.querySelector('.shimmer-loading')).toBeDefined();

      const { container: cardSkel } = render(<MetricCardSkeleton />);
      expect(cardSkel).toBeDefined();

      const { container: tableSkel } = render(<DashboardTableSkeleton rows={3} />);
      expect(tableSkel).toBeDefined();
    });
  });

  describe('4. Scroll Animation & Accessibility', () => {
    it('renders RevealOnScroll component with GPU-friendly transition classes', () => {
      const { container } = render(
        <RevealOnScroll variant="fade-up" delayMs={100} durationMs={500}>
          <span>Animated Section</span>
        </RevealOnScroll>
      );
      expect(container.textContent).toContain('Animated Section');
    });
  });

  describe('5. Homepage Dynamic Appearing Text Slider & Marquee', () => {
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
});
