import React from 'react';
import { LucideIcon } from 'lucide-react';

export type CardVariant = 'solid' | 'glass' | 'elevated' | 'interactive';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  variant?: CardVariant;
}

export function Card({
  children,
  className = '',
  hoverable = false,
  variant = 'solid',
  ...props
}: CardProps) {
  const variantStyles: Record<CardVariant, string> = {
    solid: 'bg-white border border-slate-200/80 shadow-xs',
    glass: 'liquid-glass-card',
    elevated: 'bg-white border border-slate-200 shadow-md',
    interactive: 'bg-white border border-slate-200/80 shadow-xs hover:border-blue-500/50 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer',
  };

  const hoverStyle = hoverable && variant === 'solid'
    ? 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300'
    : '';

  return (
    <div
      className={`rounded-2xl ${variantStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'rose';
  className?: string;
  variant?: CardVariant;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className = '',
  variant = 'solid',
}: MetricCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50/90 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50/90 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50/90 text-purple-600 border-purple-100',
    amber: 'bg-amber-50/90 text-amber-600 border-amber-100',
    indigo: 'bg-indigo-50/90 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50/90 text-rose-600 border-rose-100',
  };

  const baseContainer = variant === 'glass' ? 'liquid-glass-card' : 'bg-white border border-slate-200/80 shadow-xs';

  return (
    <div
      className={`${baseContainer} p-5 rounded-2xl hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-wide">{title}</span>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <span
              className={`text-xs font-bold ${
                trend.isPositive ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
