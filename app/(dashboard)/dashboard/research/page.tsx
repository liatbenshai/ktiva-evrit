'use client';

import Research from '@/components/research/Research';
import PageHeader from '@/components/layout/PageHeader';
import { Search } from 'lucide-react';

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Search}
        title="מחקר מעמיק"
        description="שאל שאלה וקבל מחקר מעמיק עם מידע ממקורות שונים ברשת, כולל הפניות למקורות"
      />
      <Research />
    </div>
  );
}

