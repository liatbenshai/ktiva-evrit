'use client';

import { FileText } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import CreateStory from '../../../../components/stories/CreateStory';

export default function StoriesPage() {
  const theme = getPageTheme('stories');

  return (
    <DashboardPageWrapper
      icon={FileText}
      title="סיפורים ויצירה"
      description="כתיבה יצירתית - סיפורים מרתקים בעברית תקנית"
      theme={theme}
    >
      <CreateStory />
    </DashboardPageWrapper>
  );
}