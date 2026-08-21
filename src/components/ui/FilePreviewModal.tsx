"use client";

import { useState, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Download, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePreviewModalProps {
  file: {
    name?: string;
    fileName?: string;
    type?: string;
    fileType?: string;
    preview?: string;
    url?: string;
  };
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle both file object formats
  const fileName = file?.name || file?.fileName || "";
  const fileType = file?.type || file?.fileType || "";
  const filePreview = file?.preview || file?.url;
  const fileUrl = file?.url || file?.preview;

  // Enhanced file type detection using both MIME type and extension
  const getFileType = () => {
    const mimeType = fileType.toLowerCase();
    const extension = fileName.split('.').pop()?.toLowerCase() || "";
    
    // Image types
    const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'];
    
    // PDF types
    const pdfMimeTypes = ['application/pdf'];
    const pdfExtensions = ['pdf'];
    
    if (imageMimeTypes.includes(mimeType) || imageExtensions.includes(extension)) {
      return 'image';
    }
    
    if (pdfMimeTypes.includes(mimeType) || pdfExtensions.includes(extension)) {
      return 'pdf';
    }
    
    return 'unknown';
  };

  const detectedFileType = getFileType();
  const isImage = detectedFileType === 'image';
  const isPdf = detectedFileType === 'pdf';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E7DFD4]">
          <div className="flex items-center gap-3 min-w-0">
            <Maximize2 size={20} className="text-[#6B6258] shrink-0" />
            <p className="text-sm font-medium text-[#2F2A25] truncate">{fileName}</p>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-[#F8F6F2] rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={18} className="text-[#6B6258]" />
                </button>
                <span className="text-sm text-[#6B6258] min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-[#F8F6F2] rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={18} className="text-[#6B6258]" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="p-2 hover:bg-[#F8F6F2] rounded-lg transition-colors text-xs"
                  title="Reset zoom"
                >
                  Reset
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-[#F8F6F2] rounded-lg transition-colors"
              title="Download"
            >
              <Download size={18} className="text-[#6B6258]" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 hover:bg-[#F8F6F2] rounded-lg transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={18} className="text-[#6B6258]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} className="text-red-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 bg-[#F8F6F2] flex items-center justify-center">
          {isImage ? (
            <img
              src={filePreview || fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain transition-transform"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col min-h-0">
              {fileUrl ? (
                <embed
                  src={fileUrl}
                  type="application/pdf"
                  title={fileName}
                  className="w-full h-full border-0 min-h-0"
                  onError={(e) => {
                    // Fallback to download button if embed fails
                    const target = e.target as HTMLEmbedElement;
                    target.style.display = 'none';
                    const fallbackDiv = target.parentElement?.querySelector('.pdf-fallback') as HTMLElement;
                    if (fallbackDiv) fallbackDiv.style.display = 'block';
                  }}
                />
              ) : null}
              <div className="pdf-fallback hidden text-center p-4 flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-[#E7DFD4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Maximize2 size={40} className="text-[#6B6258]" />
                </div>
                <p className="text-[#2F2A25] font-medium mb-2">PDF Document</p>
                <p className="text-sm text-[#6B6258] mb-4">
                  PDF preview is not available. Please download the file to view it.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#B38B59] text-white rounded-lg hover:bg-[#9A7A48] transition-colors flex items-center gap-2 mx-auto"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-[#E7DFD4] rounded-full flex items-center justify-center mx-auto mb-4">
                <Maximize2 size={40} className="text-[#6B6258]" />
              </div>
              <p className="text-[#2F2A25] font-medium mb-2">File Preview</p>
              <p className="text-sm text-[#6B6258] mb-4">
                Preview is not available for this file type.
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-[#B38B59] text-white rounded-lg hover:bg-[#9A7A48] transition-colors flex items-center gap-2 mx-auto"
              >
                <Download size={16} />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}