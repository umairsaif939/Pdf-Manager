"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  Download,
  MousePointer,
  PenTool,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  MoveRight,
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
  ChevronDown,
} from "lucide-react";
import { getDocumentById, updateDocument } from "@/lib/storage/documentService";
import { DbDocument } from "@/lib/storage/db";
import { PdfViewer } from "@/components/reader/PdfViewer";
import {
  getAnnotationsForPage,
  getAllAnnotationsForDocument,
  savePageAnnotations,
} from "@/lib/annotations/annotationService";
import { AnnotationItem, ToolType, ShapeType } from "@/lib/annotations/types";
import { exportAnnotatedPdf } from "@/lib/pdf/exportPdf";

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

  // Active Tool & Settings
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#E76F35");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Layout Panels
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [thumbnails, setThumbnails] = useState<{ page: number; url: string }[]>([]);

  // Annotations & Undo/Redo Stacks
  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
  const [undoStack, setUndoStack] = useState<AnnotationItem[][]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationItem[][]>([]);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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

  // 2. Fetch Annotations for current page
  useEffect(() => {
    async function loadPageAnns() {
      if (!doc) return;
      try {
        const pageAnns = await getAnnotationsForPage(doc.id, currentPage);
        setAnnotations(pageAnns);
        setUndoStack([]);
        setRedoStack([]);
      } catch (e) {
        console.error("Failed to load annotations:", e);
      }
    }

    loadPageAnns();
  }, [doc, currentPage]);

  // 3. Handle Annotation Changes with History & Persistence
  const handleAnnotationsChange = useCallback(
    async (newAnns: AnnotationItem[], pushHistory = true) => {
      if (!doc) return;

      if (pushHistory) {
        setUndoStack((prev) => [...prev, annotations]);
        setRedoStack([]);
      }

      setAnnotations(newAnns);
      setSaveStatus("saving");

      try {
        await savePageAnnotations(doc.id, currentPage, newAnns);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Autosave annotations failed:", err);
        setSaveStatus("saved");
      }
    },
    [doc, currentPage, annotations]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0 || !doc) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, annotations]);

    handleAnnotationsChange(previous, false);
  }, [undoStack, annotations, doc, handleAnnotationsChange]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || !doc) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, annotations]);

    handleAnnotationsChange(next, false);
  }, [redoStack, annotations, doc, handleAnnotationsChange]);

  // Keyboard Shortcuts (Undo/Redo & Tools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in textarea or input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === "v") {
        setActiveTool("select");
      } else if (e.key.toLowerCase() === "p") {
        setActiveTool("pen");
      } else if (e.key.toLowerCase() === "h") {
        setActiveTool("highlighter");
      } else if (e.key.toLowerCase() === "e") {
        setActiveTool("eraser");
      } else if (e.key.toLowerCase() === "t") {
        setActiveTool("text");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Update last-read page in IndexedDB
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

  // Export Annotated PDF
  const handleExportPdf = async () => {
    if (!doc) return;

    try {
      setIsExporting(true);
      setExportMessage("Baking vector annotations into PDF copy...");

      const allAnns = await getAllAnnotationsForDocument(doc.id);
      await exportAnnotatedPdf(doc.originalBlob, doc.name, allAnns);

      setExportMessage("Annotated PDF exported and downloaded successfully!");
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err: any) {
      console.error("Export failed:", err);
      setExportMessage(`Export failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const colors = [
    { name: "Terracotta", hex: "#E76F35" },
    { name: "Ink", hex: "#25221F" },
    { name: "Forest", hex: "#24483D" },
    { name: "Blue", hex: "#2563EB" },
    { name: "Amber", hex: "#F59E0B" },
    { name: "Ruby", hex: "#B84036" },
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
            The requested PDF does not exist in your local IndexedDB storage.
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

          {/* Export Annotated PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-3 py-1.5 bg-paper hover:bg-line text-ink rounded-control text-xs font-sans font-medium border border-line flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Download PDF with your annotations"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-terracotta" />
            ) : (
              <Download className="w-3.5 h-3.5 text-terracotta" />
            )}
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className="p-2 text-muted hover:text-ink rounded-control hover:bg-paper"
            title="Inspector / Info"
          >
            {showInspector ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Export Status Banner */}
      {exportMessage && (
        <div className="bg-surface px-4 py-1.5 border-b border-line text-xs font-sans flex items-center justify-between text-ink">
          <span>{exportMessage}</span>
          <button
            onClick={() => setExportMessage(null)}
            className="text-muted hover:text-ink text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Floating iPad/iPhone Style Annotation Toolbar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-surface/95 backdrop-blur-md border border-line rounded-card p-1.5 shadow-soft flex items-center gap-1 max-w-[96vw] overflow-x-auto">
        {/* Select / Hand Tool */}
        <button
          onClick={() => setActiveTool("select")}
          className={`p-2 rounded-control transition-all ${
            activeTool === "select"
              ? "bg-paper text-terracotta font-bold shadow-xs scale-105"
              : "text-muted hover:text-ink"
          }`}
          title="Select / Copy Text (V) - Normal text selection and Ctrl+C"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Pen Tool */}
        <button
          onClick={() => setActiveTool("pen")}
          className={`p-2 rounded-control transition-all ${
            activeTool === "pen"
              ? "bg-paper text-terracotta font-bold shadow-xs scale-105"
              : "text-muted hover:text-ink"
          }`}
          title="Pen (P) - Freehand writing and drawing"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* Highlighter Tool */}
        <button
          onClick={() => setActiveTool("highlighter")}
          className={`p-2 rounded-control transition-all ${
            activeTool === "highlighter"
              ? "bg-paper text-terracotta font-bold shadow-xs scale-105"
              : "text-muted hover:text-ink"
          }`}
          title="Highlighter (H) - Select text to highlight or draw directly"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Vector Eraser */}
        <button
          onClick={() => setActiveTool("eraser")}
          className={`p-2 rounded-control transition-all ${
            activeTool === "eraser"
              ? "bg-paper text-terracotta font-bold shadow-xs scale-105"
              : "text-muted hover:text-ink"
          }`}
          title="Eraser (E) - Click or drag over annotations to delete them"
        >
          <Eraser className="w-4 h-4" />
        </button>

        {/* Shapes Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setActiveTool("shape");
              setShowShapeMenu(!showShapeMenu);
            }}
            className={`p-2 rounded-control flex items-center gap-0.5 transition-all ${
              activeTool === "shape"
                ? "bg-paper text-terracotta font-bold shadow-xs scale-105"
                : "text-muted hover:text-ink"
            }`}
            title="Shapes - Rectangle, Circle, Line, Arrow"
          >
            {selectedShape === "rectangle" && <Square className="w-4 h-4" />}
            {selectedShape === "circle" && <Circle className="w-4 h-4" />}
            {selectedShape === "line" && <Minus className="w-4 h-4" />}
            {selectedShape === "arrow" && <MoveRight className="w-4 h-4" />}
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* Shape Selection Popover */}
          {showShapeMenu && (
            <div className="absolute top-11 left-0 z-40 bg-surface border border-line rounded-control p-1.5 shadow-soft flex items-center gap-1">
              <button
                onClick={() => {
                  setSelectedShape("rectangle");
                  setActiveTool("shape");
                  setShowShapeMenu(false);
                }}
                className={`p-1.5 rounded-md ${
                  selectedShape === "rectangle" ? "bg-paper text-terracotta" : "text-muted hover:text-ink"
                }`}
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedShape("circle");
                  setActiveTool("shape");
                  setShowShapeMenu(false);
                }}
                className={`p-1.5 rounded-md ${
                  selectedShape === "circle" ? "bg-paper text-terracotta" : "text-muted hover:text-ink"
                }`}
                title="Circle / Ellipse"
              >
                <Circle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedShape("line");
                  setActiveTool("shape");
                  setShowShapeMenu(false);
                }}
                className={`p-1.5 rounded-md ${
                  selectedShape === "line" ? "bg-paper text-terracotta" : "text-muted hover:text-ink"
                }`}
                title="Straight Line"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedShape("arrow");
                  setActiveTool("shape");
                  setShowShapeMenu(false);
                }}
                className={`p-1.5 rounded-md ${
                  selectedShape === "arrow" ? "bg-paper text-terracotta" : "text-muted hover:text-ink"
                }`}
                title="Arrow"
              >
                <MoveRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Text Tool */}
        <button
          onClick={() => setActiveTool("text")}
          className={`p-2 rounded-control transition-all ${
            activeTool === "text"
              ? "bg-paper text-terracotta font-bold shadow-xs scale-105"
              : "text-muted hover:text-ink"
          }`}
          title="Text (T) - Click anywhere on page to place a text box"
        >
          <Type className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Color Palette (Click to select) */}
        <div className="flex items-center gap-1.5 px-1">
          {colors.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedColor(c.hex)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                selectedColor === c.hex ? "border-ink scale-125 shadow-xs" : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Stroke Width Selector */}
        <div className="flex items-center gap-1 px-1">
          {[
            { label: "Fine", width: 2 },
            { label: "Med", width: 4 },
            { label: "Bold", width: 8 },
          ].map((w) => (
            <button
              key={w.label}
              onClick={() => setStrokeWidth(w.width)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-sans transition-colors ${
                strokeWidth === w.width
                  ? "bg-paper text-terracotta font-bold shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
              title={`${w.label} stroke width (${w.width}px)`}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="p-2 text-muted hover:text-ink disabled:opacity-30 rounded-control transition-opacity"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-2 text-muted hover:text-ink disabled:opacity-30 rounded-control transition-opacity"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-line mx-1" />

        {/* Show / Hide Annotations Toggle */}
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

        {/* Center PDF.js Canvas & Annotation Viewport */}
        <main className="flex-1 overflow-auto bg-paper flex items-center justify-center p-4 sm:p-6 relative">
          <PdfViewer
            doc={doc}
            currentPage={currentPage}
            zoomLevel={zoomLevel}
            activeTool={activeTool}
            selectedShape={selectedShape}
            selectedColor={selectedColor}
            strokeWidth={strokeWidth}
            showAnnotations={showAnnotations}
            annotations={annotations}
            onAnnotationsChange={handleAnnotationsChange}
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
                Document & Storage Info
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
                  <span className="text-muted block text-[11px]">Storage Engine:</span>
                  <span className="text-success font-medium">IndexedDB (100% Local)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="text-xs font-sans font-semibold text-muted">
                Annotations on Page {currentPage} ({annotations.length})
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {annotations.length > 0 ? (
                  annotations.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-2 bg-paper rounded-control border border-line text-xs font-sans flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: ann.color }}
                        />
                        <span className="capitalize text-ink font-medium">
                          {ann.tool === "shape" ? ann.shapeType : ann.tool}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleAnnotationsChange(
                            annotations.filter((a) => a.id !== ann.id)
                          )
                        }
                        className="text-muted hover:text-danger p-0.5"
                        title="Delete annotation"
                      >
                        <Eraser className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-xs italic">
                    No annotations on this page yet.
                  </p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
