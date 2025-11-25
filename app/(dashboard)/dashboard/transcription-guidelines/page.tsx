'use client';

import { Lightbulb } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import WritingDecisionHelper from '@/components/transcription/WritingDecisionHelper';

export default function TranscriptionGuidelinesPage() {
  const theme = getPageTheme('transcription-guidelines');

  return (
    <DashboardPageWrapper
      icon={Lightbulb}
      title="עוזר החלטות לניסוח וסימון"
      description="עוזר להחלטות בניסוח וסימון - הציגי דילמה ואני אציע לך אפשרויות מעשיות"
      theme={theme}
    >
      <WritingDecisionHelper />
    </DashboardPageWrapper>
  );
}

