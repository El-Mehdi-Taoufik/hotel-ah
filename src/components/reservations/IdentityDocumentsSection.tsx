"use client";

import { useState, useEffect } from "react";
import { CompactDocumentCard } from "@/components/ui/CompactDocumentCard";
import { FilePreviewModal } from "@/components/ui/FilePreviewModal";
import { identityDocumentService, IdentityDocument } from "@/services/identityDocument.service";
import { useTranslation } from "@/contexts/LanguageContext";
import { FileText, AlertCircle, Eye } from "lucide-react";

interface IdentityDocumentsSectionProps {
  reservationId: number;
  guestId: number;
}

export function IdentityDocumentsSection({ reservationId, guestId }: IdentityDocumentsSectionProps) {
  const { newReservation: t, common } = useTranslation();
  const [documents, setDocuments] = useState<IdentityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [reservationId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      // Don't try to load documents if reservationId is not set (new reservation)
      if (!reservationId || reservationId <= 0) {
        setDocuments([]);
        return;
      }
      const docs = await identityDocumentService.getDocumentsByReservation(reservationId);
      setDocuments(docs);
    } catch (err: any) {
      console.error("Failed to load identity documents:", err);
      // Don't show error for new reservations (404 is expected)
      if (err.message?.includes('Not Found') || err.message?.includes('404')) {
        setDocuments([]);
      } else {
        setError("Failed to load documents");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: any[]) => {
    try {
      for (const file of files) {
        if (file.fileData instanceof File) {
          await identityDocumentService.uploadDocument(
            file.fileData,
            reservationId,
            guestId,
            file.documentType
          );
        }
      }
      await loadDocuments();
    } catch (err) {
      console.error("Failed to upload document:", err);
      throw new Error("Failed to upload document");
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await identityDocumentService.deleteDocument(Number(id));
      await loadDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
      throw new Error("Failed to delete document");
    }
  };

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

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block w-6 h-6 border-2 border-[#B38B59] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#6B6258] mt-2">{common('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <AlertCircle size={16} className="text-red-500 mx-auto mb-2" />
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <CompactDocumentCard
          title={t('nationalIdFront')}
          documentType="NationalIdFront"
          uploadedDocuments={documents}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onPreview={handlePreview}
        />
        <CompactDocumentCard
          title={t('nationalIdBack')}
          documentType="NationalIdBack"
          uploadedDocuments={documents}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onPreview={handlePreview}
        />
        <CompactDocumentCard
          title={t('passport')}
          documentType="Passport"
          uploadedDocuments={documents}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onPreview={handlePreview}
          optional
        />
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