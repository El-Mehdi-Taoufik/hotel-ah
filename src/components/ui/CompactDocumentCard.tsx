"use client";

import { useState, useRef } from "react";
import { Upload, Check, X, Eye, RefreshCw } from "lucide-react";

interface CompactDocumentCardProps {
  title: string;
  documentType: string;
  uploadedDocuments: any[];
  onUpload: (files: any[]) => void;
  onDelete: (id: string | number) => void;
  onPreview: (file: any) => void;
  optional?: boolean;
}

export function CompactDocumentCard({
  title,
  documentType,
  uploadedDocuments,
  onUpload,
  onDelete,
  onPreview,
  optional = false
}: CompactDocumentCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const document = uploadedDocuments.find(d => d.documentType === documentType);
  const isUploaded = !!document;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    
    const processedFiles = files.map(file => ({
      id: `${documentType}-${Date.now()}-${Math.random()}`,
      fileData: file,
      documentType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      preview: URL.createObjectURL(file)
    }));

    onUpload(processedFiles);
    setIsUploading(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    if (document?.id) {
      onDelete(document.id);
    }
  };

  const handleReplace = () => {
    if (document?.id) {
      onDelete(document.id);
    }
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        onChange={handleFileSelect}
      />
      
      <div className={`
        relative bg-white/[0.03] border border-white/10 rounded-xl 
        overflow-hidden transition-all duration-200
        ${isUploaded ? 'ring-2 ring-emerald-500/30' : 'hover:border-purple-300/30'}
      `}
        style={{ height: '120px' }}
      >
        {isUploaded ? (
          // Uploaded State
          <div className="absolute inset-0 flex flex-col">
            {/* No Image Preview - Just Success Indicator */}
            <div className="flex-1 relative bg-black/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Check size={16} className="text-emerald-400" />
              </div>
              
              {/* Success Badge */}
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            </div>
            
            {/* File Info */}
            <div className="px-2 py-1.5 bg-white/[0.05] border-t border-white/10">
              <p className="text-[10px] text-text-secondary truncate">
                {document?.fileName || 'Uploaded'}
              </p>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
            <div className="w-10 h-10 rounded-lg bg-purple-300/10 flex items-center justify-center mb-2">
              <Upload size={18} className="text-purple-300" />
            </div>
            <p className="text-[11px] font-medium text-text-primary text-center mb-1">
              {title}
            </p>
            {optional && (
              <p className="text-[9px] text-text-secondary">
                Optional
              </p>
            )}
          </div>
        )}

        {/* Action Buttons Overlay */}
        <div className={`
          absolute inset-0 bg-black/60 backdrop-blur-sm
          flex items-center justify-center gap-2
          transition-opacity duration-200
          ${showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          {isUploaded ? (
            <>
              <button
                onClick={() => {
                  if (document) {
                    // Ensure consistent file structure for preview
                    const previewFile = {
                      name: document.fileName || document.name || "Document",
                      type: document.fileType || document.type || "application/octet-stream",
                      preview: document.preview || document.url,
                      url: document.url || document.preview
                    };
                    onPreview(previewFile);
                  }
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Preview"
              >
                <Eye size={16} className="text-white" />
              </button>
              <button
                onClick={handleReplace}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Replace"
              >
                <RefreshCw size={16} className="text-white" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                title="Delete"
              >
                <X size={16} className="text-white" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUploadClick();
              }}
              disabled={isUploading}
              className="px-3 py-1.5 rounded-lg bg-purple-300 hover:bg-purple-400 text-black text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}