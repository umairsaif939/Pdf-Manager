"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Clock,
  Sparkles,
  BarChart2,
  Folder,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { DEMO_DOCUMENTS, DEMO_FOLDERS } from "@/lib/demoData";
import { DocumentCard } from "@/components/shared/DocumentCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImportModal } from "@/components/shared/ImportModal";
import { getActiveDocuments, toggleFavorite } from "@/lib/storage/documentService";
import { DbDocument } from "@/lib/storage/db";

export default function HomePage() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [realDocs, setRealDocs] = useState<DbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDemoIfEmpty, setShowDemoIfEmpty] = useState(false);

  const loadDocuments = async () => {
    try {
      const active = await getActiveDocuments();
      setRealDocs(active);
    } catch (err) {
      console.error("Error loading documents from IndexedDB:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();

    const handleDocsChanged = () => {
      loadDocuments();
    };

    window.addEventListener("pdf-flux-documents-changed", handleDocsChanged);
    return () => {
      window.removeEventListener("pdf-flux-documents-changed", handleDocsChanged);
    };
  }, []);

  const handleFavoriteToggle = async (id: string) => {
    await toggleFavorite(id);
    loadDocuments();
  };

  const hasRealDocs = realDocs.length > 0;
  const currentDoc = hasRealDocs ? realDocs[0] : null;

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => loadDocuments()}
      />

      {/* Workspace Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface border border-line rounded-control text-xs font-sans">
        <div className="flex items-center gap-2 text-muted">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span>
            {hasRealDocs
              ? `IndexedDB Active: ${realDocs.length} document${realDocs.length > 1 ? "s" : ""} stored locally on this device.`
              : showDemoIfEmpty
              ? "Previewing sample study workspace demo data."
              : "IndexedDB clean workspace ready. Import a PDF to begin."}
          </span>
        </div>

        {!hasRealDocs && (
          <button
            onClick={() => setShowDemoIfEmpty(!showDemoIfEmpty)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper hover:bg-line text-ink rounded-control font-medium border border-line transition-colors self-start sm:self-auto"
          >
            {showDemoIfEmpty ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Show Clean Workspace</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Sample Data</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Editorial Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-hand text-terracotta text-lg sm:text-xl font-bold">
            Good day, scholar
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink mt-1">
            Make room for a good read.
          </h1>
          <p className="font-sans text-sm sm:text-base text-muted mt-2 max-w-xl">
            A quiet, local study environment. Import research papers, annotate
            manuscripts, and track your focus without clutter.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-sm font-medium flex items-center gap-2 shadow-sm transition-all duration-150 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Import PDF</span>
          </button>
          <Link
            href="/library"
            className="px-4 py-2.5 bg-surface hover:bg-line text-ink rounded-control font-sans text-sm font-medium border border-line transition-colors"
          >
            Open Library
          </Link>
        </div>
      </div>

      {hasRealDocs ? (
        <>
          {/* Top Grid: Continue Reading Hero + Study Time Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Continue Reading Card */}
            {currentDoc && (
              <div className="lg:col-span-2 p-6 bg-surface border border-line rounded-card shadow-soft flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper text-terracotta text-xs font-sans font-semibold rounded-control border border-line">
                      <Sparkles className="w-3.5 h-3.5" />
                      Continue Reading
                    </span>
                    <span className="text-xs font-sans text-muted">
                      {new Date(currentDoc.lastOpenedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink mb-2">
                    {currentDoc.name}
                  </h3>

                  <p className="font-sans text-xs sm:text-sm text-muted mb-4">
                    Pages: <span className="text-ink font-medium">{currentDoc.pageCount}</span> • {formatSize(currentDoc.sizeBytes)}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-line">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-sans">
                      <span className="text-muted">
                        Page {currentDoc.lastReadPage} of {currentDoc.pageCount}
                      </span>
                      <span className="font-semibold text-ink">
                        {Math.round((currentDoc.lastReadPage / currentDoc.pageCount) * 100)}% Completed
                      </span>
                    </div>
                    <div className="w-full h-2 bg-paper rounded-full overflow-hidden border border-line">
                      <div
                        className="h-full bg-terracotta rounded-full"
                        style={{
                          width: `${(currentDoc.lastReadPage / currentDoc.pageCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Local-first IndexedDB
                    </span>
                    <Link
                      href={`/reader/${currentDoc.id}`}
                      className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>Resume Page {currentDoc.lastReadPage}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Study Time Summary Card */}
            <div className="p-6 bg-surface border border-line rounded-card shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-control bg-paper flex items-center justify-center text-forest border border-line">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-sans font-medium text-muted">
                    Focus Overview
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-ink mb-1">
                  Active Study Time
                </h3>
                <p className="font-sans text-xs text-muted mb-4">
                  Tracked privately in your browser without telemetry.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-paper rounded-control border border-line">
                    <span className="text-[11px] font-sans text-muted block mb-1">
                      Saved Documents
                    </span>
                    <span className="font-serif text-2xl font-bold text-ink">
                      {realDocs.length}
                    </span>
                  </div>
                  <div className="p-3 bg-paper rounded-control border border-line">
                    <span className="text-[11px] font-sans text-muted block mb-1">
                      Total Pages
                    </span>
                    <span className="font-serif text-2xl font-bold text-ink">
                      {realDocs.reduce((acc, d) => acc + d.pageCount, 0)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/analytics"
                className="w-full py-2 bg-paper hover:bg-line text-ink rounded-control font-sans text-xs font-medium border border-line flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Study Analytics</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Real Imported PDFs Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                  Your Documents ({realDocs.length})
                </h2>
                <p className="font-sans text-xs text-muted">
                  Imported and preserved across browser sessions.
                </p>
              </div>
              <Link
                href="/library"
                className="text-xs font-sans font-medium text-terracotta hover:underline"
              >
                View all in Library →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {realDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    id: doc.id,
                    name: doc.name,
                    pageCount: doc.pageCount,
                    lastReadPage: doc.lastReadPage,
                    size: formatSize(doc.sizeBytes),
                    lastOpened: new Date(doc.lastOpenedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    folder: "Local Library",
                    isFavorite: doc.isFavorite,
                    studyMinutes: 0,
                  }}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          </section>
        </>
      ) : showDemoIfEmpty ? (
        /* Demo Mode View */
        <section className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_DOCUMENTS.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        </section>
      ) : (
        /* Honest Initial Empty State */
        <EmptyState
          icon={BookOpen}
          accentNote="A clean slate awaits"
          title="Your library is currently empty"
          description="PDF Flux stores your PDFs locally in your browser with zero server uploads. Import your first textbook, paper, or document to begin."
          actionText="Import your first PDF"
          onAction={() => setIsImportModalOpen(true)}
        />
      )}
    </div>
  );
}
