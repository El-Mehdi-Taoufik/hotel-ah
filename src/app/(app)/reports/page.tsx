"use client";

import { Download, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/contexts/LanguageContext";

export default function ReportsPage() {
  const { reports: t, common, isLoaded } = useTranslation();
  
  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Reports/current-guests`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(t('failedToGenerateReport'));
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CurrentGuests_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Report generation error:", error);
      alert(t('failedToGenerateReport'));
    }
  };
  
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
        title={t('currentGuestsReport')}
        subtitle={t('currentGuestsReportDescription')}
      />

      <div className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "#2196F31F", color: "#2196F3" }}>
            <UsersRound size={24} />
          </div>
          <div>
            <h4 className="text-lg font-medium text-[#2F2A25]">{t('currentGuestsReport')}</h4>
            <p className="text-sm text-[#6B6258] mt-1">{t('currentGuestsList')}</p>
          </div>
        </div>

        <div className="text-sm text-[#6B6258] mb-6">
          <p>{t('thisReportIncludes')}</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>{t('firstName')}</li>
            <li>{t('lastName')}</li>
            <li>{t('cinPassportNumber')}</li>
            <li>{t('phoneNumber')}</li>
          </ul>
        </div>

        <Button onClick={handleDownloadReport}>
          <Download size={16} className="mr-2" />
          {t('downloadPdfReport')}
        </Button>
      </div>
    </div>
  );
}
