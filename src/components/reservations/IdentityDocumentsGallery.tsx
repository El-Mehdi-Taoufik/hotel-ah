"use client";

import { useState } from "react";
import { FilePreviewModal } from "@/components/ui/FilePreviewModal";
import { identityDocumentService } from "@/services/identityDocument.service";
import { useTranslation } from "@/contexts/LanguageContext";
import { FileText, Download, ZoomIn, Printer, AlertCircle } from "lucide-react";

interface IdentityDocumentsGalleryProps {
  documents: any[];
}

export function IdentityDocumentsGallery({ documents }: IdentityDocumentsGalleryProps) {
  const { newReservation: t, common } = useTranslation();
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handlePreview = (file: any) => {
    if (!file) return;
    
    const documentUrl = file.imageUrl;
    setPreviewFile({
      name: file.fileName || file.name || "Document",
      type: file.fileType || file.type || "application/octet-stream",
      url: documentUrl,
      preview: documentUrl
    });
    setShowPreviewModal(true);
  };

  const handleDownload = (file: any) => {
    const documentUrl = file.imageUrl;
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = file.fileName || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (file: any) => {
    const documentUrl = file.imageUrl;
    const printWindow = window.open(documentUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const getDocumentTypeLabel = (documentType: string) => {
    switch (documentType) {
      case 'NationalIdFront':
        return t('nationalIdFront') || 'National ID (Front)';
      case 'NationalIdBack':
        return t('nationalIdBack') || 'National ID (Back)';
      case 'Passport':
        return t('passport') || 'Passport';
      default:
        return documentType || 'Other';
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-4">
        <FileText size={24} className="text-[#6B6258] mx-auto mb-2" />
        <p className="text-xs text-[#6B6258]">No identity documents available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-[#F8F6F2] border border-[#E7DFD4] rounded-lg p-3 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-[#2F2A25] mb-1">
                  {getDocumentTypeLabel(doc.documentType)}
                </p>
                <p className="text-[10px] text-[#6B6258]">
                  {new Date(doc.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Document Info Only - No Image Preview */}
            <div className="aspect-[3/2] bg-white rounded border border-[#E7DFD4] flex items-center justify-center">
              <FileText size={32} className="text-[#6B6258]" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => handlePreview(doc)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white border border-[#E7DFD4] rounded hover:bg-[#F8F6F2] transition-colors"
                title="View"
              >
                <ZoomIn size={12} />
              </button>
              <button
                onClick={() => handleDownload(doc)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white border border-[#E7DFD4] rounded hover:bg-[#F8F6F2] transition-colors"
                title="Download"
              >
                <Download size={12} />
              </button>
              <button
                onClick={() => handlePrint(doc)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-white border border-[#E7DFD4] rounded hover:bg-[#F8F6F2] transition-colors"
                title="Print"
              >
                <Printer size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* File Preview Modal */}
      {showPreviewModal && previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewFile(null);
          }}
        />
      )}
    </div>
  );
}
