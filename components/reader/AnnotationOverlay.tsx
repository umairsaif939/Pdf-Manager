"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  Move,
  Check,
  StickyNote,
  X,
  Star,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import {
  AnnotationItem,
  Point,
  Rect,
  ToolType,
  ShapeType,
  StampType,
} from "@/lib/annotations/types";

interface AnnotationOverlayProps {
  pageWidth: number;
  pageHeight: number;
  documentId: string;
  pageIndex: number;
  activeTool: ToolType;
  selectedShape: ShapeType;
  selectedStamp: StampType;
  selectedColor: string;
  strokeWidth: number;
  opacity: number;
  showAnnotations: boolean;
  annotations: AnnotationItem[];
  onAnnotationsChange: (newAnns: AnnotationItem[]) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function AnnotationOverlay({
  pageWidth,
  pageHeight,
  documentId,
  pageIndex,
  activeTool,
  selectedShape,
  selectedStamp,
  selectedColor,
  strokeWidth,
  opacity,
  showAnnotations,
  annotations,
  onAnnotationsChange,
  containerRef,
}: AnnotationOverlayProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [shapeCurrent, setShapeCurrent] = useState<Point | null>(null);

  // Active text box being edited
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Convert pixel coordinates to normalized (0..1)
  const getNormalizedPoint = (e: React.PointerEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  // 1. Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!showAnnotations) return;
    if (activeTool === "select") return;

    const point = getNormalizedPoint(e);

    if (activeTool === "pen" || activeTool === "highlighter") {
      setIsDrawing(true);
      setCurrentPoints([point]);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } else if (activeTool === "shape") {
      setIsDrawing(true);
      setShapeStart(point);
      setShapeCurrent(point);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } else if (activeTool === "eraser") {
      eraseAtPoint(point);
      setIsDrawing(true);
    } else if (activeTool === "text") {
      const newTextId = `ann-text-${Date.now()}`;
      const newAnnotation: AnnotationItem = {
        id: newTextId,
        documentId,
        pageIndex,
        tool: "text",
        rect: { x: point.x, y: point.y, width: 0.28, height: 0.08 },
        text: "Click to write...",
        color: selectedColor,
        strokeWidth: 1,
        opacity,
        fontSize: 16,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };
      onAnnotationsChange([...annotations, newAnnotation]);
      setEditingTextId(newTextId);
    } else if (activeTool === "note") {
      // Place a Sticky Note Pin
      const newNoteId = `ann-note-${Date.now()}`;
      const newAnnotation: AnnotationItem = {
        id: newNoteId,
        documentId,
        pageIndex,
        tool: "note",
        rect: { x: point.x, y: point.y, width: 0.26, height: 0.16 },
        title: "Study Note",
        text: "Write your study note here...",
        color: selectedColor || "#E76F35",
        strokeWidth: 1,
        opacity: 1,
        isExpanded: true,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };
      onAnnotationsChange([...annotations, newAnnotation]);
    } else if (activeTool === "stamp") {
      // Place a Stamp
      const newStampId = `ann-stamp-${Date.now()}`;
      const newAnnotation: AnnotationItem = {
        id: newStampId,
        documentId,
        pageIndex,
        tool: "stamp",
        stampType: selectedStamp || "APPROVED",
        rect: { x: point.x - 0.08, y: point.y - 0.03, width: 0.18, height: 0.06 },
        color: selectedColor || (selectedStamp === "APPROVED" ? "#16A34A" : selectedStamp === "IMPORTANT" ? "#DC2626" : "#E76F35"),
        strokeWidth: 2,
        opacity,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };
      onAnnotationsChange([...annotations, newAnnotation]);
    }
  };

  // 2. Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const point = getNormalizedPoint(e);

    if (activeTool === "pen" || activeTool === "highlighter") {
      setCurrentPoints((prev) => [...prev, point]);
    } else if (activeTool === "shape") {
      setShapeCurrent(point);
    } else if (activeTool === "eraser") {
      eraseAtPoint(point);
    }
  };

  // 3. Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if ((activeTool === "pen" || activeTool === "highlighter") && currentPoints.length > 1) {
      const newAnn: AnnotationItem = {
        id: `ann-${activeTool}-${Date.now()}`,
        documentId,
        pageIndex,
        tool: activeTool,
        points: currentPoints,
        color: selectedColor,
        strokeWidth: activeTool === "highlighter" ? Math.max(12, strokeWidth * 4) : strokeWidth,
        opacity: activeTool === "highlighter" ? Math.min(0.5, opacity) : opacity,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };
      onAnnotationsChange([...annotations, newAnn]);
      setCurrentPoints([]);
    } else if (activeTool === "shape" && shapeStart && shapeCurrent) {
      const x = Math.min(shapeStart.x, shapeCurrent.x);
      const y = Math.min(shapeStart.y, shapeCurrent.y);
      const width = Math.abs(shapeCurrent.x - shapeStart.x);
      const height = Math.abs(shapeCurrent.y - shapeStart.y);

      if (width > 0.005 || height > 0.005 || selectedShape === "line" || selectedShape === "arrow") {
        const newAnn: AnnotationItem = {
          id: `ann-shape-${Date.now()}`,
          documentId,
          pageIndex,
          tool: "shape",
          shapeType: selectedShape,
          rect: { x, y, width, height },
          points: [shapeStart, shapeCurrent],
          color: selectedColor,
          strokeWidth,
          opacity,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        };
        onAnnotationsChange([...annotations, newAnn]);
      }

      setShapeStart(null);
      setShapeCurrent(null);
    }
  };

  // Erase vector annotations intersected by eraser
  const eraseAtPoint = (pt: Point) => {
    const threshold = 0.035; // ~3.5% of page tolerance
    const remaining = annotations.filter((ann) => {
      // 1. Check points (pen / freehand / line)
      if (ann.points && ann.points.length > 0) {
        for (const p of ann.points) {
          const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
          if (dist < threshold) return false;
        }
      }

      // 2. Check rect (shapes, text box, sticky notes, stamps)
      if (ann.rect) {
        const r = ann.rect;
        if (
          pt.x >= r.x - 0.02 &&
          pt.x <= r.x + r.width + 0.02 &&
          pt.y >= r.y - 0.02 &&
          pt.y <= r.y + r.height + 0.02
        ) {
          return false;
        }
      }

      // 3. Check multi-rects (text highlights)
      if (ann.rects && ann.rects.length > 0) {
        for (const r of ann.rects) {
          if (
            pt.x >= r.x &&
            pt.x <= r.x + r.width &&
            pt.y >= r.y &&
            pt.y <= r.y + r.height
          ) {
            return false;
          }
        }
      }

      return true;
    });

    if (remaining.length !== annotations.length) {
      onAnnotationsChange(remaining);
    }
  };

  // Listen for native text selection highlighting when highlighter tool is active
  useEffect(() => {
    if (activeTool !== "highlighter" || !containerRef.current) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const range = selection.getRangeAt(0);

      if (!container.contains(range.commonAncestorContainer)) return;

      const clientRects = Array.from(range.getClientRects());
      if (clientRects.length === 0) return;

      const normalizedRects: Rect[] = clientRects.map((r) => ({
        x: Math.max(0, (r.left - containerRect.left) / containerRect.width),
        y: Math.max(0, (r.top - containerRect.top) / containerRect.height),
        width: Math.min(1, r.width / containerRect.width),
        height: Math.min(1, r.height / containerRect.height),
      }));

      const newHighlight: AnnotationItem = {
        id: `ann-highlight-${Date.now()}`,
        documentId,
        pageIndex,
        tool: "highlighter",
        rects: normalizedRects,
        color: selectedColor,
        strokeWidth: 1,
        opacity: Math.min(0.4, opacity),
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };

      onAnnotationsChange([...annotations, newHighlight]);
      selection.removeAllRanges();
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeTool, annotations, containerRef, documentId, pageIndex, selectedColor, opacity, onAnnotationsChange]);

  const pointsToSvgPath = (pts: Point[]): string => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x * pageWidth} ${pts[0].y * pageHeight}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x * pageWidth} ${pts[i].y * pageHeight}`;
    }
    return d;
  };

  // Item drag handling (for Text, Sticky Notes, Stamps)
  const handleItemDragStart = (e: React.MouseEvent, annId: string, currentRect: Rect) => {
    e.stopPropagation();
    setMovingItemId(annId);
    if (!containerRef.current) return;
    const cont = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - cont.left) / cont.width - currentRect.x,
      y: (e.clientY - cont.top) / cont.height - currentRect.y,
    });
  };

  const handleItemDragMove = (e: React.MouseEvent) => {
    if (!movingItemId || !containerRef.current) return;
    const cont = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(0.85, (e.clientX - cont.left) / cont.width - dragOffset.x));
    const newY = Math.max(0, Math.min(0.92, (e.clientY - cont.top) / cont.height - dragOffset.y));

    onAnnotationsChange(
      annotations.map((a) =>
        a.id === movingItemId && a.rect
          ? { ...a, rect: { ...a.rect, x: newX, y: newY } }
          : a
      )
    );
  };

  const handleItemDragEnd = () => {
    setMovingItemId(null);
  };

  const isInteractiveDrawingTool =
    activeTool === "pen" ||
    activeTool === "highlighter" ||
    activeTool === "shape" ||
    activeTool === "eraser" ||
    activeTool === "text" ||
    activeTool === "note" ||
    activeTool === "stamp";

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseMove={movingItemId ? handleItemDragMove : undefined}
      onMouseUp={movingItemId ? handleItemDragEnd : undefined}
      className={`absolute inset-0 z-10 transition-opacity duration-150 ${
        showAnnotations ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${
        isInteractiveDrawingTool
          ? "cursor-crosshair pointer-events-auto"
          : "pointer-events-none"
      }`}
      style={{ touchAction: isInteractiveDrawingTool ? "none" : "auto" }}
    >
      {/* SVG Layer for Vector Pen, Highlighters, and Shapes */}
      <svg
        width={pageWidth}
        height={pageHeight}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Render Saved Annotations */}
        {annotations.map((ann) => {
          // 1. Pen freehand paths
          if (ann.tool === "pen" && ann.points && ann.points.length > 1) {
            return (
              <path
                key={ann.id}
                d={pointsToSvgPath(ann.points)}
                fill="none"
                stroke={ann.color}
                strokeWidth={ann.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={ann.opacity ?? 1}
              />
            );
          }

          // 2. Highlighters (multi-rect from text selection, or freehand)
          if (ann.tool === "highlighter") {
            if (ann.rects && ann.rects.length > 0) {
              return (
                <g key={ann.id} opacity={ann.opacity ?? 0.35} style={{ mixBlendMode: "multiply" }}>
                  {ann.rects.map((r, i) => (
                    <rect
                      key={i}
                      x={r.x * pageWidth}
                      y={r.y * pageHeight}
                      width={r.width * pageWidth}
                      height={r.height * pageHeight}
                      fill={ann.color}
                      rx={2}
                    />
                  ))}
                </g>
              );
            }
            if (ann.points && ann.points.length > 1) {
              return (
                <path
                  key={ann.id}
                  d={pointsToSvgPath(ann.points)}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={ann.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={ann.opacity ?? 0.35}
                  style={{ mixBlendMode: "multiply" }}
                />
              );
            }
          }

          // 3. Shapes (Rectangle & Circle)
          if (ann.tool === "shape" && ann.rect) {
            const r = ann.rect;
            const x = r.x * pageWidth;
            const y = r.y * pageHeight;
            const w = r.width * pageWidth;
            const h = r.height * pageHeight;

            if (ann.shapeType === "rectangle") {
              return (
                <rect
                  key={ann.id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={ann.strokeWidth}
                  opacity={ann.opacity ?? 1}
                  rx={2}
                />
              );
            }

            if (ann.shapeType === "circle") {
              return (
                <ellipse
                  key={ann.id}
                  cx={x + w / 2}
                  cy={y + h / 2}
                  rx={w / 2}
                  ry={h / 2}
                  fill="none"
                  stroke={ann.color}
                  strokeWidth={ann.strokeWidth}
                  opacity={ann.opacity ?? 1}
                />
              );
            }
          }

          // 4. Lines & Arrows
          if (
            ann.tool === "shape" &&
            (ann.shapeType === "line" || ann.shapeType === "arrow") &&
            ann.points &&
            ann.points.length >= 2
          ) {
            const p1 = ann.points[0];
            const p2 = ann.points[1];
            const x1 = p1.x * pageWidth;
            const y1 = p1.y * pageHeight;
            const x2 = p2.x * pageWidth;
            const y2 = p2.y * pageHeight;

            if (ann.shapeType === "arrow") {
              const angle = Math.atan2(y2 - y1, x2 - x1);
              const headLen = 14;
              return (
                <g key={ann.id} opacity={ann.opacity ?? 1}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={ann.color}
                    strokeWidth={ann.strokeWidth}
                    strokeLinecap="round"
                  />
                  <line
                    x1={x2}
                    y1={y2}
                    x2={x2 - headLen * Math.cos(angle - Math.PI / 6)}
                    y2={y2 - headLen * Math.sin(angle - Math.PI / 6)}
                    stroke={ann.color}
                    strokeWidth={ann.strokeWidth}
                    strokeLinecap="round"
                  />
                  <line
                    x1={x2}
                    y1={y2}
                    x2={x2 - headLen * Math.cos(angle + Math.PI / 6)}
                    y2={y2 - headLen * Math.sin(angle + Math.PI / 6)}
                    stroke={ann.color}
                    strokeWidth={ann.strokeWidth}
                    strokeLinecap="round"
                  />
                </g>
              );
            }

            return (
              <line
                key={ann.id}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ann.color}
                strokeWidth={ann.strokeWidth}
                strokeLinecap="round"
                opacity={ann.opacity ?? 1}
              />
            );
          }

          return null;
        })}

        {/* Real-Time Live Drawing Preview */}
        {isDrawing && currentPoints.length > 1 && (
          <path
            d={pointsToSvgPath(currentPoints)}
            fill="none"
            stroke={selectedColor}
            strokeWidth={activeTool === "highlighter" ? Math.max(12, strokeWidth * 4) : strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={activeTool === "highlighter" ? Math.min(0.5, opacity) : opacity}
            style={activeTool === "highlighter" ? { mixBlendMode: "multiply" } : undefined}
          />
        )}

        {/* Real-Time Live Shape Preview */}
        {isDrawing && shapeStart && shapeCurrent && activeTool === "shape" && (
          <>
            {selectedShape === "rectangle" && (
              <rect
                x={Math.min(shapeStart.x, shapeCurrent.x) * pageWidth}
                y={Math.min(shapeStart.y, shapeCurrent.y) * pageHeight}
                width={Math.abs(shapeCurrent.x - shapeStart.x) * pageWidth}
                height={Math.abs(shapeCurrent.y - shapeStart.y) * pageHeight}
                fill="none"
                stroke={selectedColor}
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
                opacity={opacity}
                rx={2}
              />
            )}
            {selectedShape === "circle" && (
              <ellipse
                cx={((shapeStart.x + shapeCurrent.x) / 2) * pageWidth}
                cy={((shapeStart.y + shapeCurrent.y) / 2) * pageHeight}
                rx={(Math.abs(shapeCurrent.x - shapeStart.x) / 2) * pageWidth}
                ry={(Math.abs(shapeCurrent.y - shapeStart.y) / 2) * pageHeight}
                fill="none"
                stroke={selectedColor}
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
                opacity={opacity}
              />
            )}
            {selectedShape === "line" && (
              <line
                x1={shapeStart.x * pageWidth}
                y1={shapeStart.y * pageHeight}
                x2={shapeCurrent.x * pageWidth}
                y2={shapeCurrent.y * pageHeight}
                stroke={selectedColor}
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
                opacity={opacity}
              />
            )}
            {selectedShape === "arrow" && (
              <line
                x1={shapeStart.x * pageWidth}
                y1={shapeStart.y * pageHeight}
                x2={shapeCurrent.x * pageWidth}
                y2={shapeCurrent.y * pageHeight}
                stroke={selectedColor}
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
                opacity={opacity}
              />
            )}
          </>
        )}
      </svg>

      {/* Text Box Overlays */}
      {annotations
        .filter((a) => a.tool === "text")
        .map((ann) => {
          if (!ann.rect) return null;
          const isEditing = editingTextId === ann.id;
          const leftPx = ann.rect.x * pageWidth;
          const topPx = ann.rect.y * pageHeight;

          return (
            <div
              key={ann.id}
              style={{
                left: `${leftPx}px`,
                top: `${topPx}px`,
                position: "absolute",
                opacity: ann.opacity ?? 1,
              }}
              onClick={(e) => e.stopPropagation()}
              className={`group pointer-events-auto select-none rounded-control transition-all ${
                isEditing
                  ? "ring-2 ring-terracotta bg-surface shadow-soft p-2 z-30"
                  : "bg-surface/90 hover:bg-surface border border-line shadow-xs p-1.5 z-20"
              }`}
            >
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-line/40 text-[10px] text-muted">
                <div
                  onMouseDown={(e) => handleItemDragStart(e, ann.id, ann.rect!)}
                  className="cursor-move flex items-center gap-1 hover:text-ink p-0.5 rounded"
                  title="Drag to reposition"
                >
                  <Move className="w-3 h-3" />
                  <span>Text</span>
                </div>

                <div className="flex items-center gap-1">
                  {isEditing && (
                    <button
                      onClick={() => setEditingTextId(null)}
                      className="text-success hover:text-success/80 p-0.5"
                      title="Done editing"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onAnnotationsChange(annotations.filter((a) => a.id !== ann.id));
                      setEditingTextId(null);
                    }}
                    className="text-muted hover:text-danger p-0.5"
                    title="Delete text box"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  autoFocus
                  value={ann.text || ""}
                  onChange={(e) => {
                    const updated = annotations.map((a) =>
                      a.id === ann.id ? { ...a, text: e.target.value } : a
                    );
                    onAnnotationsChange(updated);
                  }}
                  onBlur={() => setEditingTextId(null)}
                  rows={2}
                  style={{ color: ann.color, fontSize: `${ann.fontSize || 16}px` }}
                  className="w-48 sm:w-56 bg-transparent resize-none border-none outline-none font-serif leading-tight pt-1"
                />
              ) : (
                <div
                  onClick={() => setEditingTextId(ann.id)}
                  style={{ color: ann.color, fontSize: `${ann.fontSize || 16}px` }}
                  className="cursor-text font-serif leading-tight pt-1 max-w-[200px] sm:max-w-xs whitespace-pre-wrap"
                >
                  {ann.text || "Empty text"}
                </div>
              )}
            </div>
          );
        })}

      {/* Sticky Notes Overlays */}
      {annotations
        .filter((a) => a.tool === "note")
        .map((ann) => {
          if (!ann.rect) return null;
          const leftPx = ann.rect.x * pageWidth;
          const topPx = ann.rect.y * pageHeight;
          const isExpanded = ann.isExpanded ?? false;

          return (
            <div
              key={ann.id}
              style={{
                left: `${leftPx}px`,
                top: `${topPx}px`,
                position: "absolute",
              }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto z-30 select-none animate-fade-in"
            >
              {isExpanded ? (
                /* Expanded Sticky Note Card */
                <div
                  className="w-64 bg-amber-50 dark:bg-[#2A2318] border-2 border-amber-300 dark:border-amber-700/60 rounded-card shadow-soft p-3 space-y-2 text-ink text-xs"
                  style={{ borderLeftColor: ann.color, borderLeftWidth: "5px" }}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60 dark:border-amber-800/40">
                    <div
                      onMouseDown={(e) => handleItemDragStart(e, ann.id, ann.rect!)}
                      className="cursor-move flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200"
                    >
                      <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                      <input
                        type="text"
                        value={ann.title || "Note"}
                        onChange={(e) => {
                          const updated = annotations.map((a) =>
                            a.id === ann.id ? { ...a, title: e.target.value } : a
                          );
                          onAnnotationsChange(updated);
                        }}
                        className="bg-transparent font-serif font-bold text-xs outline-none w-36"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const updated = annotations.map((a) =>
                            a.id === ann.id ? { ...a, isExpanded: false } : a
                          );
                          onAnnotationsChange(updated);
                        }}
                        className="p-1 rounded text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                        title="Minimize Note"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          onAnnotationsChange(annotations.filter((a) => a.id !== ann.id))
                        }
                        className="p-1 rounded text-danger hover:bg-red-100 dark:hover:bg-red-900/40"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={ann.text || ""}
                    onChange={(e) => {
                      const updated = annotations.map((a) =>
                        a.id === ann.id ? { ...a, text: e.target.value } : a
                      );
                      onAnnotationsChange(updated);
                    }}
                    placeholder="Type your study notes here..."
                    rows={3}
                    className="w-full bg-transparent resize-none border-none outline-none font-sans text-xs text-ink/90 leading-relaxed placeholder:text-muted/60"
                  />

                  <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-amber-200/50">
                    <span>Page {pageIndex}</span>
                    <button
                      onClick={() => {
                        const updated = annotations.map((a) =>
                          a.id === ann.id ? { ...a, isExpanded: false } : a
                        );
                        onAnnotationsChange(updated);
                      }}
                      className="text-amber-700 dark:text-amber-400 font-medium hover:underline"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Minimized Pin Icon */
                <button
                  onClick={() => {
                    const updated = annotations.map((a) =>
                      a.id === ann.id ? { ...a, isExpanded: true } : a
                    );
                    onAnnotationsChange(updated);
                  }}
                  className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/80 border-2 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200 shadow-soft flex items-center justify-center hover:scale-110 transition-transform group"
                  title={`${ann.title || "Study Note"}: Click to open`}
                >
                  <StickyNote className="w-4 h-4 text-amber-600" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-terracotta border-2 border-white animate-pulse" />
                </button>
              )}
            </div>
          );
        })}

      {/* Rubber Stamps Overlays */}
      {annotations
        .filter((a) => a.tool === "stamp")
        .map((ann) => {
          if (!ann.rect) return null;
          const leftPx = ann.rect.x * pageWidth;
          const topPx = ann.rect.y * pageHeight;
          const type = ann.stampType || "APPROVED";

          return (
            <div
              key={ann.id}
              style={{
                left: `${leftPx}px`,
                top: `${topPx}px`,
                position: "absolute",
                opacity: ann.opacity ?? 1,
              }}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto z-20 group select-none animate-fade-in"
            >
              <div
                onMouseDown={(e) => handleItemDragStart(e, ann.id, ann.rect!)}
                className="cursor-move inline-flex items-center gap-1.5 px-3 py-1 rounded-sm border-2 font-serif font-black tracking-widest text-xs uppercase shadow-sm transition-transform group-hover:scale-105"
                style={{
                  borderColor: ann.color,
                  color: ann.color,
                  backgroundColor: `${ann.color}15`,
                  borderStyle: "double",
                  borderWidth: "3px",
                  transform: "rotate(-3deg)",
                }}
              >
                {type === "APPROVED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                {type === "IMPORTANT" && <AlertTriangle className="w-3.5 h-3.5" />}
                {type === "REVIEW" && <FileCheck className="w-3.5 h-3.5" />}
                {type === "REVISED" && <RotateCcw className="w-3.5 h-3.5" />}
                {type === "STAR" && <Star className="w-3.5 h-3.5 fill-current" />}
                {type === "CHECK" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                <span>{type}</span>

                <button
                  onClick={() =>
                    onAnnotationsChange(annotations.filter((a) => a.id !== ann.id))
                  }
                  className="opacity-0 group-hover:opacity-100 ml-1 hover:text-danger transition-opacity"
                  title="Remove Stamp"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
