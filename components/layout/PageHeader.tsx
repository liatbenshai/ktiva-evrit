'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  hint?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  icon: Icon,
  title,
  description,
  hint,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={[
        'sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:py-4">
        <div className="flex items-start gap-3 sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 sm:h-12 sm:w-12">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex-1">
            {hint ? (
              <p className="text-xs text-gray-500 sm:text-sm">{hint}</p>
            ) : null}
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

interface PageHeaderLinkProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export function PageHeaderLink({
  href,
  label,
  icon: Icon,
  variant = 'secondary',
  className,
}: PageHeaderLinkProps) {
  const classes = [
    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  ];
  const variants: Record<typeof variant, string> = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 focus-visible:ring-offset-white',
    secondary:
      'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400 focus-visible:ring-offset-white',
    outline:
      'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400 focus-visible:ring-offset-white',
  };
  classes.push(variants[variant]);
  if (className) classes.push(className);

  return (
    <Link
      href={href}
      className={classes.filter(Boolean).join(' ')}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{label}</span>
    </Link>
  );
}

