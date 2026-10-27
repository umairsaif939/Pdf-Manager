"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, HardDrive, CheckCircle2, X } from "lucide-react";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("pdf_flux_welcome_seen");
    if (!seen) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("pdf_flux_welcome_seen", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-surface border border-line rounded-card max-w-lg w-full p-6 sm:p-8 shadow-soft relative space-y-5">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-ink rounded-control hover:bg-paper transition-colors"
          aria-label="Close welcome modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with warm editorial serif */}
        <div className="space-y-1.5">
          <span className="font-hand text-terracotta text-lg font-bold">
            Welcome to PDF Flux
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Make room for a good study session.
          </h2>
        </div>

        <p className="font-sans text-sm text-muted leading-relaxed">
          PDF Flux is a private, offline-first study companion. Read, mark up,
          and organize your documents without accounts, tracking, or cloud uploads.
        </p>

        {/* Feature Highlights */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-3 bg-paper rounded-control border border-line">
            <ShieldCheck className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
            <div>
              <h3 className="font-sans text-sm font-semibold text-ink">
                100% Local & Private
              </h3>
              <p className="font-sans text-xs text-muted">
                Your PDFs and annotations are stored securely on your device using IndexedDB. No files are ever sent to an external server.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-paper rounded-control border border-line">
            <HardDrive className="w-5 h-5 text-forest shrink-0 mt-0.5" />
            <div>
              <h3 className="font-sans text-sm font-semibold text-ink">
                Browser Storage Notice
              </h3>
              <p className="font-sans text-xs text-muted">
                Clearing your browser or site data can erase local documents. Use the built-in backup and export tools to keep copies safe.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-6 py-2.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-sm font-medium transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
