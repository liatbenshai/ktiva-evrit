'use client';

import { Brain } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import ClaudeAssistant from '@/components/claude-assistant/ClaudeAssistant';

export default function ClaudeAssistantPage() {
  const theme = getPageTheme('claude-assistant');

  return (
    <DashboardPageWrapper
      icon={Brain}
      title="liatAI"
      description="שאלי כל שאלה או כתבי מה את צריכה, ואני אענה בעברית תקנית. אפשר לשאול שאלות המשך."
      theme={theme}
    >
      <ClaudeAssistant />
    </DashboardPageWrapper>
  );
}
