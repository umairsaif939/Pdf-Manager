"use client";

import React from "react";
import { UploadCloud, CheckCircle2, ArrowRight, X } from "lucide-react";

export function ImportPromptModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div className="bg-surface border border-line rounded-card max-w-md w-full p-6 shadow-soft space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-ink rounded-control hover:bg-paper"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center text-terracotta border border-line">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-serif text-xl font-bold text-ink">
            Import PDF
          </h3>
          <p className="font-sans text-xs text-muted mt-1">
            Phase 1 establishes the UI shell, design tokens, and navigation. Real multi-file PDF import, IndexedDB blob persistence, and the PDF.js client reader are scheduled for Phase 2.
          </p>
        </div>

        <div className="p-3 bg-paper rounded-control border border-line text-xs font-sans text-muted space-y-1.5">
          <div className="flex items-center gap-2 text-ink font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Phase 1: Shell & Visual Design (Active)</span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <ArrowRight className="w-3.5 h-3.5 text-terracotta" />
            <span>Phase 2: PDF Import & IndexedDB Viewer (Next)</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-paper hover:bg-line text-ink rounded-control font-sans text-xs font-medium border border-line transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
