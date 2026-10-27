"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Download,
  PenTool,
  Highlighter,
  Eraser,
  Square,
  Type,
  StickyNote,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
} from "lucide-react";
import { getDocumentById, updateDocument } from "@/lib/storage/documentService";
import { DbDocument } from "@/lib/storage/db";
import { PdfViewer } from "@/components/reader/PdfViewer";

type ActiveTool =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "shape"
  | "text"
  | "note";

export default function ReaderPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const resolvedParams = use(params);
  const documentId = resolvedParams.documentId;

  const [doc, setDoc] = useState<DbDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTool, setActiveTool] = useState<ActiveTool>("pen");
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#E76F35");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ page: number; url: string }[]>([]);

  // 1. Fetch Document from IndexedDB
  useEffect(() => {
    async function loadDoc() {
      try {
        setLoading(true);
        const storedDoc = await getDocumentById(documentId);

        if (storedDoc) {
          setDoc(storedDoc);
          setCurrentPage(storedDoc.lastReadPage || 1);
          setZoomLevel(storedDoc.lastZoom || 100);

          // Update last opened timestamp
          await updateDocument(documentId, { lastOpenedAt: Date.now() });
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error loading document:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadDoc();
  }, [documentId]);

  // Update last-read page in IndexedDB when user flips pages
  const handlePageChange = async (newPage: number) => {
    if (!doc) return;
    const clamped = Math.max(1, Math.min(doc.pageCount, newPage));
    setCurrentPage(clamped);
    setSaveStatus("saving");

    try {
      await updateDocument(doc.id, { lastReadPage: clamped });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("saved");
    }
  };

  const colors = [
    { name: "Terracotta", hex: "#E76F35" },
    { name: "Ink", hex: "#25221F" },
    { name: "Forest", hex: "#24483D" },
    { name: "Blue", hex: "#2563EB" },
    { name: "Yellow", hex: "#F59E0B" },
    { name: "Danger", hex: "#B84036" },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-paper flex flex-col items-center justify-center p-4">
        <Loader2 className="w-9 h-9 animate-spin text-terracotta mb-3" />
        <span className="font-serif text-lg font-bold text-ink">
          Opening Document...
        </span>
        <span className="font-sans text-xs text-muted mt-1">
          Loading original PDF bytes from IndexedDB
        </span>
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="fixed inset-0 z-50 bg-paper flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-surface border border-line rounded-card max-w-md w-full p-8 shadow-soft space-y-4">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-ink">
            Document Not Found
          </h2>
          <p className="font-sans text-xs sm:text-sm text-muted leading-relaxed">
            The requested PDF does not exist in your local IndexedDB storage. It may have been permanently removed or imported on another browser.
          </p>
          <div className="pt-2">
            <Link
              href="/library"
              className="px-5 py-2.5 bg-terracotta hover:bg-terracotta-hover text-white rounded-control font-sans text-xs font-semibold shadow-sm inline-block"
            >
              Back to Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-paper flex flex-col overflow-hidden select-none">
      {/* 1. Top Document & View Toolbar */}
      <header className="h-14 bg-surface border-b border-line px-4 flex items-center justify-between shrink-0 z-20 transition-colors">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/library"
            className="p-2 text-muted hover:text-ink rounded-control hover:bg-paper transition-colors"
            title="Return to Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="p-1.5 text-muted hover:text-ink rounded-control hover:bg-paper hidden sm:flex"
            title={showThumbnails ? "Hide Thumbnails" : "Show Thumbnails"}
          >
            {showThumbnails ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="flex flex-col min-w-0">
            <h1 className="font-serif text-sm sm:text-base font-bold text-ink truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {doc.name}
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-sans text-muted">
              <span>{doc.pageCount} pages</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="w-3 h-3" /> {saveStatus === "saved" ? "Local Saved" : "Saving..."}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Page Controls & Zoom */}
        <div className="hidden md:flex items-center gap-1.5 bg-paper p-1 rounded-control border border-line text-xs font-sans">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 text-muted hover:text-ink disabled:opacity-30 rounded-md"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 text-ink font-medium">
            Page {currentPage} of {doc.pageCount}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= doc.pageCount}
            className="p-1.5 text-muted hover:text-ink disabled:opacity-30 rounded-md"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-line mx-1" />

          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
            className="p-1.5 text-muted hover:text-ink rounded-md"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="px-1 text-muted text-[11px]">{zoomLevel}%</span>

          <button
            onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
            className="p-1.5 text-muted hover:text-ink rounded-md"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-control border transition-colors ${
              isBookmarked
                ? "bg-warning/10 text-warning border-warning/30"
                : "text-muted hover:text-ink border-transparent hover:bg-paper"
            }`}
            title="Bookmark this page"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-warning" : ""}`} />
          </button>

          <button
            onClick={() => alert("Annotated PDF export engine activates in Phase 4.")}
            className="px-3 py-1.5 bg-paper hover:bg-line text-ink rounded-control text-xs font-sans font-medium border border-line flex items-center gap-1.5 transition-colors"
            title="Export PDF with annotations"
          >
            <Download className="w-3.5 h-3.5 text-terracotta" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className="p-2 text-muted hover:text-ink rounded-control hover:bg-paper"
            title="Inspector / Outline"
          >
            {showInspector ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Floating Annotation Toolbar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-surface/95 backdrop-blur-md border border-line rounded-card p-1.5 shadow-soft flex items-center gap-1 max-w-[95vw] overflow-x-auto">
        <button
          onClick={() => setActiveTool("pen")}
          className={`p-2 rounded-control transition-colors ${
            activeTool === "pen"
              ? "bg-paper text-terracotta font-bold shadow-xs"
              : "text-muted hover:text-ink"
          }`}
          title="Pen (Freehand drawing)"
        >
          <PenTool className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool("highlighter")}
          className={`p-2 rounded-control transition-colors ${
            activeTool === "highlighter"
              ? "bg-paper text-terracotta font-bold shadow-xs"
              : "text-muted hover:text-ink"
          }`}
          title="Highlighter (Semi-transparent)"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool("eraser")}
          className={`p-2 rounded-control transition-colors ${
            activeTool === "eraser"
              ? "bg-paper text-terracotta font-bold shadow-xs"
              : "text-muted hover:text-ink"
          }`}
          title="Eraser (Deletes annotation objects)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool("shape")}
          className={`p-2 rounded-control transition-colors ${
            activeTool === "shape"
              ? "bg-paper text-terracotta font-bold shadow-xs"
              : "text-muted hover:text-ink"
          }`}
          title="Shapes (Rectangle, Ellipse, Line)"
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool("text")}
          className={`p-2 rounded-control transition-colors ${
            activeTool === "text"
              ? "bg-paper text-terracotta font-bold shadow-xs"
              : "text-muted hover:text-ink"
          }`}
          title="Text Overlay"
        >
          <Type className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool("note")}
          className={`p-2 rounded-control transition-colors ${
            activeTool === "note"
              ? "bg-paper text-terracotta font-bold shadow-xs"
              : "text-muted hover:text-ink"
          }`}
          title="Sticky Note Pin"
        >
          <StickyNote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Color Presets */}
        <div className="flex items-center gap-1.5 px-1">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedColor(c.hex)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                selectedColor === c.hex ? "border-ink scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-line mx-1" />

        <button
          onClick={() => alert("Undo activates in Phase 3 with vector history stack.")}
          className="p-2 text-muted hover:text-ink rounded-control"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => alert("Redo activates in Phase 3 with vector history stack.")}
          className="p-2 text-muted hover:text-ink rounded-control"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className={`p-2 rounded-control transition-colors ${
            !showAnnotations ? "text-terracotta bg-paper" : "text-muted hover:text-ink"
          }`}
          title={showAnnotations ? "Hide Annotations (View only)" : "Show Annotations"}
        >
          {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* 3. Main Workspace: Thumbnails + PDF Canvas + Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Thumbnails Rail */}
        {showThumbnails && (
          <aside className="w-48 bg-surface border-r border-line p-3 flex flex-col overflow-y-auto space-y-3 shrink-0 hidden sm:flex">
            <span className="text-xs font-sans font-semibold text-muted px-1">
              Thumbnails ({doc.pageCount} pages)
            </span>

            {thumbnails.length > 0 ? (
              thumbnails.map((t) => (
                <div
                  key={t.page}
                  onClick={() => handlePageChange(t.page)}
                  className={`p-2 rounded-control cursor-pointer border text-center transition-all ${
                    currentPage === t.page
                      ? "border-terracotta bg-paper ring-1 ring-terracotta/40"
                      : "border-line bg-surface hover:bg-paper/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.url}
                    alt={`Page ${t.page}`}
                    className="w-full h-auto rounded-xs border border-line/50 shadow-xs"
                  />
                  <span className="text-[11px] font-sans text-muted mt-1 block">
                    {t.page}
                  </span>
                </div>
              ))
            ) : (
              // Fast fallback thumbnails while rendering
              Array.from({ length: Math.min(doc.pageCount, 12) }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <div
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`p-2 rounded-control cursor-pointer border text-center transition-all ${
                      currentPage === pageNum
                        ? "border-terracotta bg-paper ring-1 ring-terracotta/40"
                        : "border-line bg-surface hover:bg-paper/50"
                    }`}
                  >
                    <div className="w-full h-28 bg-white rounded-xs border border-line/60 shadow-xs flex items-center justify-center text-xs text-muted font-serif">
                      Pg {pageNum}
                    </div>
                    <span className="text-[11px] font-sans text-muted mt-1 block">
                      {pageNum}
                    </span>
                  </div>
                );
              })
            )}
          </aside>
        )}

        {/* Center PDF.js Canvas Viewport */}
        <main className="flex-1 overflow-auto bg-paper flex items-center justify-center p-4 sm:p-6 relative">
          <PdfViewer
            doc={doc}
            currentPage={currentPage}
            zoomLevel={zoomLevel}
            onPageChange={handlePageChange}
            onThumbnailsReady={(thumbs) => setThumbnails(thumbs)}
          />
        </main>

        {/* Right Inspector Panel */}
        {showInspector && (
          <aside className="w-64 bg-surface border-l border-line p-4 flex flex-col space-y-4 shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <h3 className="font-serif text-base font-bold text-ink">Inspector</h3>
              <button
                onClick={() => setShowInspector(false)}
                className="p-1 rounded-control text-muted hover:text-ink"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-sans font-semibold text-muted">
                Storage & Document Info
              </span>
              <div className="p-3 bg-paper rounded-control border border-line text-xs font-sans space-y-1.5">
                <div>
                  <span className="text-muted block text-[11px]">Filename:</span>
                  <span className="text-ink font-medium break-all">{doc.name}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Pages:</span>
                  <span className="text-ink">{doc.pageCount}</span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Size:</span>
                  <span className="text-ink">
                    {(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Storage Engine:</span>
                  <span className="text-success font-medium">IndexedDB (Local Device)</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
