"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  HardDrive,
  ArrowRight,
} from "lucide-react";
import { importPdfFiles, validatePdfFile } from "@/lib/storage/documentService";
import { DbDocument } from "@/lib/storage/db";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (imported: DbDocument[]) => void;
}

export function ImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [importErrors, setImportErrors] = useState<
    { filename: string; reason: string }[]
  >([]);
  const [importedDocs, setImportedDocs] = useState<DbDocument[]>([]);

  if (!isOpen) return null;

  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setSelectedFiles(newFiles);
    setImportErrors([]);
    setImportedDocs([]);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleStartImport = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setProgressStatus("Validating files and checking storage...");
    setImportErrors([]);

    try {
      // Storage quota estimation
      if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
        const { quota, usage } = await navigator.storage.estimate();
        if (quota && usage && quota - usage < 10 * 1024 * 1024) {
          setImportErrors([
            {
              filename: "Storage Warning",
              reason: "Browser storage is nearly full. Please free up space before importing.",
            },
          ]);
          setIsProcessing(false);
          return;
        }
      }

      setProgressStatus("Extracting page metrics and saving to IndexedDB...");
      const { successful, errors } = await importPdfFiles(selectedFiles);

      setImportedDocs(successful);
      setImportErrors(errors);

      if (successful.length > 0) {
        // Trigger global custom event so active library views reload
        window.dispatchEvent(new CustomEvent("pdf-flux-documents-changed"));
        onImportComplete?.(successful);
      }
    } catch (err: any) {
      setImportErrors([
        { filename: "System Error", reason: err.message || "Failed to process PDF import" },
      ]);
    } finally {
      setIsProcessing(false);
      setProgressStatus("");
    }
  };

  const handleOpenDoc = (id: string) => {
    onClose();
    router.push(`/reader/${id}`);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setImportErrors([]);
    setImportedDocs([]);
    setIsProcessing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-line rounded-card max-w-lg w-full p-6 sm:p-7 shadow-soft relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-ink rounded-control hover:bg-paper transition-colors"
          aria-label="Close import dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-control bg-paper flex items-center justify-center text-terracotta border border-line shrink-0">
            <UploadCloud className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">
              Import PDF Documents
            </h3>
            <p className="font-sans text-xs text-muted">
              Select one or multiple PDF files to store locally on this device.
            </p>
          </div>
        </div>

        {/* Hidden Native File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelection(e.target.files)}
        />

        {/* Success View */}
        {importedDocs.length > 0 ? (
          <div className="space-y-4">
            <div className="p-4 bg-success/10 border border-success/30 rounded-control flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans text-sm font-semibold text-ink">
                  Successfully imported {importedDocs.length} document{importedDocs.length > 1 ? "s" : ""}!
                </h4>
                <p className="font-sans text-xs text-muted mt-0.5">
                  Saved securely in local IndexedDB. Ready to read and annotate.
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {importedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-paper rounded-control border border-line text-xs font-sans"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-terracotta shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-ink truncate max-w-[240px]">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-muted">
                        {doc.pageCount} pages • {formatFileSize(doc.sizeBytes)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDoc(doc.id)}
                    className="px-3 py-1.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-control text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-line">
              <button
                onClick={handleReset}
                className="text-xs font-sans text-muted hover:text-ink transition-colors"
              >
                Import more files
              </button>
              <button
                onClick={() => {
                  onClose();
                  router.push("/library");
                }}
                className="px-4 py-2 bg-paper hover:bg-line text-ink rounded-control text-xs font-medium border border-line transition-colors"
              >
                View Library
              </button>
            </div>
          </div>
        ) : (
          /* Selection & Drag Area */
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer p-8 border-2 border-dashed rounded-control text-center transition-all ${
                isDragging
                  ? "border-terracotta bg-terracotta/5 scale-[1.01]"
                  : "border-line bg-paper/60 hover:bg-paper hover:border-muted"
              }`}
            >
              <FileText className="w-10 h-10 text-muted mx-auto mb-2 stroke-[1.5]" />
              <div className="font-sans text-sm font-semibold text-ink">
                Click to browse or drop PDF files here
              </div>
              <div className="font-sans text-xs text-muted mt-1">
                Supports multiple files • Standard PDFs up to device memory limits
              </div>
            </div>

            {/* Selected File Previews */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-sans font-medium text-muted">
                  <span>Selected ({selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}):</span>
                  <button
                    onClick={handleReset}
                    className="text-danger hover:underline text-[11px]"
                  >
                    Clear selection
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-paper rounded-control border border-line text-xs font-sans"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-terracotta shrink-0" />
                        <span className="truncate max-w-[260px] text-ink font-medium">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-muted text-[11px] shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Messages */}
            {importErrors.length > 0 && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-control space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Import Warnings / Errors:</span>
                </div>
                {importErrors.map((err, i) => (
                  <div key={i} className="text-[11px] text-danger/90 pl-5">
                    <strong>{err.filename}:</strong> {err.reason}
                  </div>
                ))}
              </div>
            )}

            {/* Storage Info Note */}
            <div className="flex items-center gap-2 text-[11px] font-sans text-muted bg-paper p-2.5 rounded-control border border-line">
              <HardDrive className="w-4 h-4 text-forest shrink-0" />
              <span>
                Files are kept directly in your browser&apos;s IndexedDB. Never uploaded to third parties.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 bg-paper text-muted hover:text-ink rounded-control text-xs font-medium border border-line transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartImport}
                disabled={selectedFiles.length === 0 || isProcessing}
                className="px-5 py-2 bg-terracotta hover:bg-terracotta-hover disabled:opacity-50 text-white rounded-control text-xs font-medium flex items-center gap-2 shadow-sm transition-all"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Import ({selectedFiles.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
