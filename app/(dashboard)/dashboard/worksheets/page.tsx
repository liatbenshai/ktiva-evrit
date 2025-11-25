'use client';

import { FileText } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import CreateWorksheet from '@/components/worksheets/CreateWorksheet';

export default function WorksheetsPage() {
  const theme = getPageTheme('worksheets');

  return (
    <DashboardPageWrapper
      icon={FileText}
      title="דפי עבודה ללימודים"
      description="יצירת דפי עבודה מקצועיים ומוכנים להדפסה לכל רמת כיתה"
      theme={theme}
    >
      <CreateWorksheet />
    </DashboardPageWrapper>
  );
}

