'use client';

import { ReactNode } from 'react';
import { LucideIcon, Home } from 'lucide-react';
import Link from 'next/link';
import PageHeader, { PageHeaderLink } from './PageHeader';
import BotFloatingWidget from './BotFloatingWidget';

export interface PageColorTheme {
  // Background gradients
  bgFrom: string; // e.g., 'from-indigo-50'
  bgVia: string;  // e.g., 'via-purple-50'
  bgTo: string;   // e.g., 'to-pink-50'
  
  // Header gradient text
  headerFrom: string; // e.g., 'from-indigo-600'
  headerTo: string;   // e.g., 'to-purple-600'
  
  // Button colors
  buttonFrom: string; // e.g., 'from-indigo-500'
  buttonTo: string;   // e.g., 'to-purple-600'
  
  // Icon background
  iconBg: string; // e.g., 'bg-indigo-100'
  iconColor: string; // e.g., 'text-indigo-600'
  
  // Border
  borderColor: string; // e.g., 'border-indigo-100'
}

interface DashboardPageWrapperProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  theme: PageColorTheme;
  children: ReactNode;
  showBot?: boolean;
  actions?: ReactNode;
}

export default function DashboardPageWrapper({
  icon: Icon,
  title,
  description,
  theme,
  children,
  showBot = true,
  actions,
}: DashboardPageWrapperProps) {
  return (
    <div 
      className={`min-h-screen bg-gradient-to-br ${theme.bgFrom} ${theme.bgVia} ${theme.bgTo}`}
      dir="rtl"
    >
      <header className={`sticky top-0 z-30 border-b ${theme.borderColor} bg-white/95 backdrop-blur`}>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:py-4">
          <div className="flex items-start gap-3 sm:items-center">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${theme.iconBg} ${theme.iconColor} sm:h-12 sm:w-12`}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1">
              <h1 className={`text-xl font-semibold bg-gradient-to-r ${theme.headerFrom} ${theme.headerTo} bg-clip-text text-transparent sm:text-2xl`}>
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-gradient-to-r ${theme.buttonFrom} ${theme.buttonTo} text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
            >
              <Home className="h-4 w-4" />
              <span>חזרה לדשבורד</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:py-8">
        {children}
      </main>

      {/* Bot Component - Fixed bottom left (RTL) */}
      {showBot && (
        <BotFloatingWidget theme={theme} />
      )}
    </div>
  );
}
