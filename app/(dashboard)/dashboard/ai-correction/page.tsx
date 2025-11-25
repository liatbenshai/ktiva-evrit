'use client';

import { useState } from 'react';
import { Brain, BookOpen } from 'lucide-react';
import Link from 'next/link';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import AICorrector from '@/components/ai-correction/AICorrector';

export default function AICorrectPage() {
  const [currentText, setCurrentText] = useState('');
  const theme = getPageTheme('ai-correction');

  return (
    <DashboardPageWrapper
      icon={Brain}
      title="תיקון כתיבת AI"
      description="תיקון וניתוח טקסטים שנוצרו על ידי AI - המערכת לומדת מהתיקונים שלך"
      theme={theme}
      actions={
        <Link
          href="/dashboard/ai-correction/learned-patterns"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <BookOpen className="h-4 w-4" />
          <span>דפוסים שנלמדו</span>
        </Link>
      }
    >
      <AICorrector />
    </DashboardPageWrapper>
  );
}

