'use client';

import LegalCases from '@/components/legal-cases/LegalCases';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import { Scale } from 'lucide-react';

export default function LegalCasesPage() {
  const theme = getPageTheme('legal-cases');

  return (
    <DashboardPageWrapper
      icon={Scale}
      title="חיפוש פסקי דין"
      description="חפשי פסקי דין רלוונטיים לפי נושאים משפטיים, כולל הפניות למקורות"
      theme={theme}
    >
      <LegalCases />
    </DashboardPageWrapper>
  );
}

