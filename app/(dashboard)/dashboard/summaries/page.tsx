'use client';

import { FileCheck } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import CreateSummary from '../../../../components/summaries/CreateSummary';

export default function SummariesPage() {
  const theme = getPageTheme('summaries');

  return (
    <DashboardPageWrapper
      icon={FileCheck}
      title="סיכומים"
      description="סכמי מסמכים וטקסטים בקלות"
      theme={theme}
    >
      <CreateSummary />
    </DashboardPageWrapper>
  );
}