import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 rounded',
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      aria-hidden="true"
      style={style}
      className={`shimmer-loading bg-slate-200/75 animate-pulse ${variantStyles[variant]} ${className}`}
    />
  );
}

export function DashboardTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="w-9 h-9" />
            <div className="space-y-1.5">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <Skeleton className="w-24 h-6" />
        </div>
      ))}
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-28 h-4" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton className="w-16 h-8" />
      <Skeleton className="w-36 h-3" />
    </div>
  );
}
