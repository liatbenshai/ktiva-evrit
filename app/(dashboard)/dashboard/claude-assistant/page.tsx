'use client';

import { Home, Brain } from 'lucide-react';
import PageHeader, { PageHeaderLink } from '@/components/layout/PageHeader';
import ClaudeAssistant from '@/components/claude-assistant/ClaudeAssistant';

export default function ClaudeAssistantPage() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <PageHeader
        icon={Brain}
        title="עוזר כתיבה AI"
        description="שאלי כל שאלה או כתבי מה את צריכה, ואני אענה בעברית תקנית. אפשר לשאול שאלות המשך."
        actions={
          <PageHeaderLink
            href="/dashboard"
            label="חזרה לדשבורד"
            icon={Home}
            variant="outline"
          />
        }
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:py-8">
        <ClaudeAssistant />
      </main>
    </div>
  );
}
