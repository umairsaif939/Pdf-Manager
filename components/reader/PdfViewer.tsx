"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { loadPdf, renderPdfPage, generateThumbnailUrl } from "@/lib/pdf/pdfService";
import { DbDocument } from "@/lib/storage/db";

interface PdfViewerProps {
  doc: DbDocument;
  currentPage: number;
  zoomLevel: number; // e.g. 100 for 100%
  onPageChange?: (newPage: number) => void;
  onTotalPagesLoaded?: (total: number) => void;
  onThumbnailsReady?: (thumbnails: { page: number; url: string }[]) => void;
}

export function PdfViewer({
  doc,
  currentPage,
  zoomLevel,
  onPageChange,
  onTotalPagesLoaded,
  onThumbnailsReady,
}: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

        // Generate thumbnails asynchronously
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

  // Generate thumbnails for up to the first 20 pages
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

  // 2. Render Page to Canvas
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

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full py-6">
      {/* Canvas Wrapper with paper shadow */}
      <div
        className="relative bg-white shadow-soft rounded-xs border border-line/60 transition-shadow duration-200"
        style={{
          width: pageSize ? `${pageSize.width}px` : "auto",
          height: pageSize ? `${pageSize.height}px` : "auto",
        }}
      >
        <canvas ref={canvasRef} className="block rounded-xs" />

        {/* Small subtle page indicator at bottom */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-sans text-muted">
          Page {currentPage} of {doc.pageCount}
        </div>
      </div>
    </div>
  );
}
