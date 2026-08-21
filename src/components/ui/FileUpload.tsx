"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Eye, Download, Trash2, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  url?: string;
  serverId?: number;
  fileData?: File; // Store the actual File object
}

interface FileUploadProps {
  documentType: string;
  reservationId?: number;
  guestId?: number;
  existingDocuments?: UploadedFile[];
  onUpload: (files: UploadedFile[]) => Promise<void>;
  onDelete?: (id: string | number) => Promise<void>;
  onPreview?: (file: UploadedFile) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  allowedTypes?: string[];
  className?: string;
}

export function FileUpload({
  documentType,
  reservationId,
  guestId,
  existingDocuments = [],
  onUpload,
  onDelete,
  onPreview,
  maxFiles = 1,
  maxSizeMB = 10,
  allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"],
  className
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingDocuments);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = (type: string) => type.startsWith("image/");
  const isPdf = (type: string) => type === "application/pdf";

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const validateFile = (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Only ${allowedTypes.join(", ")} are allowed.`);
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit.`);
      return false;
    }
    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    if (files.length + droppedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} file(s) allowed.`);
      return;
    }

    const validFiles = droppedFiles.filter(validateFile);
    if (validFiles.length === 0) return;

    processFiles(validFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);

    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} file(s) allowed.`);
      return;
    }

    const validFiles = selectedFiles.filter(validateFile);
    if (validFiles.length === 0) return;

    processFiles(validFiles);
  };

  const processFiles = async (newFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    const processedFiles: UploadedFile[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const progress = ((i + 1) / newFiles.length) * 100;
      setUploadProgress(progress);

      // Create preview for images
      let preview: string | undefined;
      if (isImage(file.type)) {
        preview = URL.createObjectURL(file);
      }

      processedFiles.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        fileData: file // Store the actual File object
      });
    }

    // Upload to server
    try {
      await onUpload(processedFiles);
      setFiles([...files, ...processedFiles]);
      setUploadProgress(100);
    } catch (err) {
      setError("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      if (onDelete) {
        await onDelete(id);
      }
      setFiles(files.filter(f => f.id !== id && f.serverId !== id));
    } catch (err) {
      setError("Failed to delete file. Please try again.");
    }
  };

  const handlePreview = (file: UploadedFile) => {
    if (onPreview) {
      onPreview(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
          isDragging ? "border-[#B38B59] bg-[#B38B59]/5" : "border-[#E7DFD4] hover:border-[#B38B59] hover:bg-[#F8F6F2]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={allowedTypes?.join(",") || "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,application/pdf"}
          multiple={maxFiles > 1}
          onChange={handleFileSelect}
        />
        
        <Upload size={32} className={cn("mx-auto mb-2", isDragging ? "text-[#B38B59]" : "text-[#6B6258]")} />
        <p className="text-sm text-[#2F2A25] font-medium">
          {isUploading ? "Uploading..." : "Drag & drop files here"}
        </p>
        <p className="text-xs text-[#6B6258] mt-1">
          {isUploading 
            ? `${Math.round(uploadProgress)}% complete`
            : `or click to browse (Max ${maxSizeMB}MB, ${allowedTypes.join(", ")})`
          }
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-white border border-[#E7DFD4] rounded-lg"
            >
              <div className="h-10 w-10 rounded-lg bg-[#F8F6F2] flex items-center justify-center shrink-0">
                {isImage(file.type) && file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="h-full w-full object-cover rounded-lg"
                  />
                ) : isPdf(file.type) ? (
                  <FileText size={20} className="text-[#6B6258]" />
                ) : (
                  <ImageIcon size={20} className="text-[#6B6258]" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#2F2A25] truncate">{file.name}</p>
                <p className="text-xs text-[#6B6258]">{formatFileSize(file.size)}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isImage(file.type) && onPreview && (
                  <button
                    onClick={() => handlePreview(file)}
                    className="p-1.5 hover:bg-[#F8F6F2] rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye size={16} className="text-[#6B6258]" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => handleDelete(file.serverId || file.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}