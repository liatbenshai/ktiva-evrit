'use client';

import { MessageSquare } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import CreatePost from '@/components/posts/CreatePost';

export default function PostsPage() {
  const theme = getPageTheme('posts');

  return (
    <DashboardPageWrapper
      icon={MessageSquare}
      title="פוסטים לרשתות חברתיות"
      description="יצירת תוכן ויראלי מותאם לכל פלטפורמה"
      theme={theme}
    >
      <CreatePost />
    </DashboardPageWrapper>
  );
}