"use client";

import React, { useRef, useState, useEffect } from "react";
import { Trash2, Move, Check } from "lucide-react";
import {
  AnnotationItem,
  Point,
  Rect,
  ToolType,
  ShapeType,
} from "@/lib/annotations/types";

interface AnnotationOverlayProps {
  pageWidth: number;
  pageHeight: number;
  documentId: string;
  pageIndex: number;
  activeTool: ToolType;
  selectedShape: ShapeType;
  selectedColor: string;
  strokeWidth: number;
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
  selectedColor,
  strokeWidth,
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
  const [movingTextId, setMovingTextId] = useState<string | null>(null);
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
      // Create a new text box at clicked location
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
        opacity: 1,
        fontSize: 16,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      };
      onAnnotationsChange([...annotations, newAnnotation]);
      setEditingTextId(newTextId);
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
        opacity: activeTool === "highlighter" ? 0.35 : 1,
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

      // Only commit if has meaningful dimensions
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
          opacity: 1,
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
    const threshold = 0.03; // ~3% of page tolerance
    const remaining = annotations.filter((ann) => {
      // 1. Check points (pen / freehand / line)
      if (ann.points && ann.points.length > 0) {
        for (const p of ann.points) {
          const dist = Math.hypot(p.x - pt.x, p.y - pt.y);
          if (dist < threshold) return false; // Erase this object
        }
      }

      // 2. Check rect (shapes, text box, highlights)
      if (ann.rect) {
        const r = ann.rect;
        if (
          pt.x >= r.x - 0.01 &&
          pt.x <= r.x + r.width + 0.01 &&
          pt.y >= r.y - 0.01 &&
          pt.y <= r.y + r.height + 0.01
        ) {
          return false; // Erase this object
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

      // Verify selection is within our page container
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
        opacity: 0.35,
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
  }, [activeTool, annotations, containerRef, documentId, pageIndex, selectedColor, onAnnotationsChange]);

  // Convert normalized points array to SVG path string
  const pointsToSvgPath = (pts: Point[]): string => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x * pageWidth} ${pts[0].y * pageHeight}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x * pageWidth} ${pts[i].y * pageHeight}`;
    }
    return d;
  };

  // Text box drag handling
  const handleTextDragStart = (e: React.MouseEvent, annId: string, currentRect: Rect) => {
    e.stopPropagation();
    setMovingTextId(annId);
    if (!containerRef.current) return;
    const cont = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - cont.left) / cont.width - currentRect.x,
      y: (e.clientY - cont.top) / cont.height - currentRect.y,
    });
  };

  const handleTextDragMove = (e: React.MouseEvent) => {
    if (!movingTextId || !containerRef.current) return;
    const cont = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(0.8, (e.clientX - cont.left) / cont.width - dragOffset.x));
    const newY = Math.max(0, Math.min(0.9, (e.clientY - cont.top) / cont.height - dragOffset.y));

    onAnnotationsChange(
      annotations.map((a) =>
        a.id === movingTextId && a.rect
          ? { ...a, rect: { ...a.rect, x: newX, y: newY } }
          : a
      )
    );
  };

  const handleTextDragEnd = () => {
    setMovingTextId(null);
  };

  const isInteractiveDrawingTool =
    activeTool === "pen" ||
    activeTool === "highlighter" ||
    activeTool === "shape" ||
    activeTool === "eraser" ||
    activeTool === "text";

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseMove={movingTextId ? handleTextDragMove : undefined}
      onMouseUp={movingTextId ? handleTextDragEnd : undefined}
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
                <g key={ann.id} opacity={0.35} style={{ mixBlendMode: "multiply" }}>
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
                  opacity={0.35}
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
                <g key={ann.id}>
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
            opacity={activeTool === "highlighter" ? 0.35 : 1}
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
              />
            )}
          </>
        )}
      </svg>

      {/* Text Box Overlays (Interactive & Repositionable) */}
      {annotations
        .filter((a) => a.tool === "text" || a.tool === "note")
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
              }}
              onClick={(e) => e.stopPropagation()}
              className={`group pointer-events-auto select-none rounded-control transition-all ${
                isEditing
                  ? "ring-2 ring-terracotta bg-surface shadow-soft p-2 z-30"
                  : "bg-surface/90 hover:bg-surface border border-line shadow-xs p-1.5 z-20"
              }`}
            >
              {/* Header with drag handle and delete button */}
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-line/40 text-[10px] text-muted">
                <div
                  onMouseDown={(e) => handleTextDragStart(e, ann.id, ann.rect!)}
                  className="cursor-move flex items-center gap-1 hover:text-ink p-0.5 rounded"
                  title="Drag to reposition text box"
                >
                  <Move className="w-3 h-3" />
                  <span>Text</span>
                </div>

                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <button
                      onClick={() => setEditingTextId(null)}
                      className="text-success hover:text-success/80 p-0.5"
                      title="Done editing"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
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

              {/* Text Area */}
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
    </div>
  );
}
