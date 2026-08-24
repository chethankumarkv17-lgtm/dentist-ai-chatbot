import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, Sparkles, Shield, Phone, MessageSquare } from 'lucide-react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'pro'
  | 'voice'
  | 'whatsapp';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: boolean | React.ReactNode;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  icon = true,
  className = '',
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; defaultIcon: React.ReactNode }> = {
    success: {
      container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      defaultIcon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    warning: {
      container: 'bg-amber-50 text-amber-800 border-amber-200/80',
      defaultIcon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" />,
    },
    error: {
      container: 'bg-rose-50 text-rose-700 border-rose-200/80',
      defaultIcon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
    info: {
      container: 'bg-blue-50 text-blue-700 border-blue-200/80',
      defaultIcon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200',
      defaultIcon: null,
    },
    pro: {
      container: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm',
      defaultIcon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
    },
    voice: {
      container: 'bg-purple-50 text-purple-700 border-purple-200',
      defaultIcon: <Phone className="w-3.5 h-3.5 text-purple-600" />,
    },
    whatsapp: {
      container: 'bg-green-50 text-green-700 border-green-200',
      defaultIcon: <MessageSquare className="w-3.5 h-3.5 text-green-600" />,
    },
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const current = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${current.container} ${sizeStyles[size]} ${className}`}
    >
      {icon === true ? current.defaultIcon : icon}
      <span>{children}</span>
    </span>
  );
}
