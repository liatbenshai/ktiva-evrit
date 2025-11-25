'use client';

import Research from '@/components/research/Research';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import { Search } from 'lucide-react';

export default function ResearchPage() {
  const theme = getPageTheme('research');

  return (
    <DashboardPageWrapper
      icon={Search}
      title="מחקר מעמיק"
      description="שאל שאלה וקבל מחקר מעמיק עם מידע ממקורות שונים ברשת, כולל הפניות למקורות"
      theme={theme}
    >
      <Research />
    </DashboardPageWrapper>
  );
}

