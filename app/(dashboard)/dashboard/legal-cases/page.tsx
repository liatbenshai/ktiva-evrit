'use client';

import LegalCases from '@/components/legal-cases/LegalCases';
import PageHeader from '@/components/layout/PageHeader';
import { Scale } from 'lucide-react';

export default function LegalCasesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scale}
        title="חיפוש פסקי דין"
        description="חפשי פסקי דין רלוונטיים לפי נושאים משפטיים, כולל הפניות למקורות"
      />
      <LegalCases />
    </div>
  );
}

