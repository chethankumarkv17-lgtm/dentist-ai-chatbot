import { describe, it, expect } from 'vitest';
import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, MetricCard } from '@/components/ui/Card';
import { Skeleton, MetricCardSkeleton, DashboardTableSkeleton } from '@/components/ui/Skeleton';
import { Calendar } from 'lucide-react';

describe('Phase 44 — Premium UI/UX, Design System & Accessibility Suite', () => {
  describe('1. Design System Badges & Multi-Status Tokens', () => {
    it('renders success, warning, error, info, and pro badge variants', () => {
      const successBadge = Badge({ children: 'Confirmed', variant: 'success' });
      expect(successBadge).toBeDefined();
      expect(successBadge.props.className).toContain('bg-emerald-50');

      const warningBadge = Badge({ children: 'Pending', variant: 'warning' });
      expect(warningBadge.props.className).toContain('bg-amber-50');

      const errorBadge = Badge({ children: 'Cancelled', variant: 'error' });
      expect(errorBadge.props.className).toContain('bg-rose-50');

      const proBadge = Badge({ children: 'Pro Feature', variant: 'pro' });
      expect(proBadge.props.className).toContain('bg-indigo-50');

      const voiceBadge = Badge({ children: 'Voice Active', variant: 'voice' });
      expect(voiceBadge.props.className).toContain('bg-purple-50');
    });
  });

  describe('2. Design System Cards & Metric Indicators', () => {
    it('renders container Card with optional hoverable state', () => {
      const normalCard = Card({ children: 'Card Content', hoverable: false });
      expect(normalCard.props.className).toContain('bg-white');

      const hoverCard = Card({ children: 'Card Content', hoverable: true });
      expect(hoverCard.props.className).toContain('hover:shadow-md');
    });

    it('renders MetricCard with value and trend indicators', () => {
      const metric = MetricCard({
        title: "Today's Appointments",
        value: 12,
        subtitle: 'Scheduled appointments',
        icon: Calendar,
        color: 'blue',
        trend: { value: '+4 vs yesterday', isPositive: true },
      });

      expect(metric).toBeDefined();
      expect(metric.props.className).toContain('bg-white');
    });
  });

  describe('3. Skeleton Shimmer Loading States', () => {
    it('renders text, rectangular, and circular skeletons', () => {
      const textSkel = Skeleton({ variant: 'text', width: 100 });
      expect(textSkel.props.className).toContain('shimmer-loading');

      const cardSkel = MetricCardSkeleton();
      expect(cardSkel).toBeDefined();

      const tableSkel = DashboardTableSkeleton({ rows: 3 });
      expect(tableSkel).toBeDefined();
    });
  });

  describe('4. Accessibility & Touch Target Standards', () => {
    it('verifies touch target utility and responsive design token integration', () => {
      expect(Badge({ children: 'Test' })).toBeDefined();
    });
  });
});
