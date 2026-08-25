"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { useTranslation } from "@/contexts/LanguageContext";
import PdfExports from "@/components/reports/PdfExports";

export default function ReportsPage() {
  const { reports: t, common, isLoaded } = useTranslation();

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} subtitle={common('loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        subtitle="Reservation, invoice, current guests and guest profile PDF documents"
      />
      <PdfExports />
    </div>
  );
}
