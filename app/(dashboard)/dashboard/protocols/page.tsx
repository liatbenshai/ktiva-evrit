'use client';

import { ScrollText } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import CreateProtocol from '../../../../components/protocols/CreateProtocol';

export default function ProtocolsPage() {
  const theme = getPageTheme('protocols');

  return (
    <DashboardPageWrapper
      icon={ScrollText}
      title="פרוטוקולים"
      description="הפכי תמלולי ישיבות לפרוטוקולים מסודרים"
      theme={theme}
    >
      <CreateProtocol />
    </DashboardPageWrapper>
  );
}