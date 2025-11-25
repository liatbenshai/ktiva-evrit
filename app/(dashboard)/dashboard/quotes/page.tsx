'use client';

import { DollarSign } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import CreateQuote from '@/components/quotes/CreateQuote';

export default function QuotesPage() {
  const theme = getPageTheme('quotes');

  return (
    <DashboardPageWrapper
      icon={DollarSign}
      title="הצעות מחיר"
      description="יצירת הצעות מחיר מקצועיות ומנצחות"
      theme={theme}
    >
      <CreateQuote />
    </DashboardPageWrapper>
  );
}