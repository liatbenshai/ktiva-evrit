'use client';

import { FileText, Home } from 'lucide-react';
import PageHeader, { PageHeaderLink } from '@/components/layout/PageHeader';
import CreateWorksheet from '@/components/worksheets/CreateWorksheet';

export default function WorksheetsPage() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <PageHeader
        icon={FileText}
        title="דפי עבודה ללימודים"
        description="יצירת דפי עבודה מקצועיים ומוכנים להדפסה לכל רמת כיתה"
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
        <CreateWorksheet />
      </main>
    </div>
  );
}

