"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  loadPdf,
  renderPdfPage,
  renderPdfTextLayer,
  generateThumbnailUrl,
} from "@/lib/pdf/pdfService";
import { DbDocument } from "@/lib/storage/db";
import { AnnotationOverlay } from "./AnnotationOverlay";
import { AnnotationItem, ToolType, ShapeType, StampType } from "@/lib/annotations/types";

interface PdfViewerProps {
  doc: DbDocument;
  currentPage: number;
  zoomLevel: number; // e.g. 100 for 100%
  activeTool: ToolType;
  selectedShape: ShapeType;
  selectedStamp: StampType;
  selectedColor: string;
  strokeWidth: number;
  opacity: number;
  showAnnotations: boolean;
  annotations: AnnotationItem[];
  onAnnotationsChange: (newAnns: AnnotationItem[]) => void;
  onPageChange?: (newPage: number) => void;
  onTotalPagesLoaded?: (total: number) => void;
  onThumbnailsReady?: (thumbnails: { page: number; url: string }[]) => void;
}

export function PdfViewer({
  doc,
  currentPage,
  zoomLevel,
  activeTool,
  selectedShape,
  selectedStamp,
  selectedColor,
  strokeWidth,
  opacity,
  showAnnotations,
  annotations,
  onAnnotationsChange,
  onPageChange,
  onTotalPagesLoaded,
  onThumbnailsReady,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

  // 1. Load PDF Document from Blob
  useEffect(() => {
    let isCancelled = false;

    async function initPdf() {
      try {
        setLoading(true);
        setError(null);

        const loadedPdf = await loadPdf(doc.originalBlob);
        if (isCancelled) return;

        setPdfDoc(loadedPdf);
        onTotalPagesLoaded?.(loadedPdf.numPages);

        generateAllThumbnails(loadedPdf);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to load PDF:", err);
          setError(err.message || "Failed to load and parse PDF document");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    initPdf();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id, doc.originalBlob]);

  const generateAllThumbnails = async (loadedPdf: any) => {
    try {
      const thumbs: { page: number; url: string }[] = [];
      const count = Math.min(loadedPdf.numPages, 20);

      for (let i = 1; i <= count; i++) {
        const url = await generateThumbnailUrl(loadedPdf, i, 160);
        if (url) {
          thumbs.push({ page: i, url });
        }
      }

      onThumbnailsReady?.(thumbs);
    } catch (e) {
      console.warn("Could not generate page thumbnails:", e);
    }
  };

  // 2. Render Page Canvas & PDF Text Layer
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setRendering(true);
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const scale = zoomLevel / 100;
        const rendered = await renderPdfPage(page, canvasRef.current, scale);

        if (!isCancelled) {
          setPageSize({ width: rendered.width, height: rendered.height });

          if (textLayerRef.current) {
            await renderPdfTextLayer(page, textLayerRef.current, scale);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Render error for page", currentPage, err);
          setError(`Could not render page ${currentPage}: ${err.message}`);
        }
      } finally {
        if (!isCancelled) {
          setRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, currentPage, zoomLevel]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta mb-3" />
        <span className="font-sans text-sm font-medium text-ink">
          Loading {doc.name}...
        </span>
        <span className="text-xs text-muted mt-1">
          Rendering PDF pages using client-side PDF.js
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-surface border border-line rounded-card shadow-soft">
        <AlertCircle className="w-8 h-8 text-danger mb-2" />
        <h3 className="font-serif text-lg font-bold text-ink">PDF Render Error</h3>
        <p className="font-sans text-xs text-muted mt-1 mb-4 leading-relaxed">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-paper text-ink rounded-control text-xs font-medium border border-line hover:bg-line transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const allowTextSelection = activeTool === "select" || activeTool === "highlighter";

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full py-6">
      {/* Canvas Wrapper with paper shadow */}
      <div
        ref={containerRef}
        className="relative bg-white shadow-soft rounded-xs border border-line/60 transition-shadow duration-200 select-text"
        style={{
          width: pageSize ? `${pageSize.width}px` : "auto",
          height: pageSize ? `${pageSize.height}px` : "auto",
        }}
      >
        {/* 1. Underlying PDF.js Canvas */}
        <canvas ref={canvasRef} className="block rounded-xs" />

        {/* 2. Selectable PDF Text Layer */}
        <div
          ref={textLayerRef}
          className={`textLayer ${allowTextSelection ? "pointer-events-auto" : "pointer-events-none"}`}
        />

        {/* 3. Annotation Overlay */}
        {pageSize && (
          <AnnotationOverlay
            pageWidth={pageSize.width}
            pageHeight={pageSize.height}
            documentId={doc.id}
            pageIndex={currentPage}
            activeTool={activeTool}
            selectedShape={selectedShape}
            selectedStamp={selectedStamp}
            selectedColor={selectedColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            showAnnotations={showAnnotations}
            annotations={annotations}
            onAnnotationsChange={onAnnotationsChange}
            containerRef={containerRef}
          />
        )}

        {/* Subtle page indicator at bottom */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-sans text-muted">
          Page {currentPage} of {doc.pageCount}
        </div>
      </div>
    </div>
  );
}
