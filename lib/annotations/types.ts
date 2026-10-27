export type ToolType =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "shape"
  | "text"
  | "note"
  | "stamp";

export type ShapeType = "rectangle" | "circle" | "line" | "arrow";

export type StampType =
  | "APPROVED"
  | "IMPORTANT"
  | "REVIEW"
  | "REVISED"
  | "STAR"
  | "CHECK";

export interface Point {
  x: number; // Normalized (0..1) relative to page width
  y: number; // Normalized (0..1) relative to page height
}

export interface Rect {
  x: number; // Normalized (0..1)
  y: number; // Normalized (0..1)
  width: number; // Normalized (0..1)
  height: number; // Normalized (0..1)
}

export interface AnnotationItem {
  id: string;
  documentId: string;
  pageIndex: number;
  tool: ToolType;
  shapeType?: ShapeType;
  stampType?: StampType;
  points?: Point[]; // For pen, freehand highlighter, line, arrow
  rects?: Rect[]; // For text-selection multi-line highlights
  rect?: Rect; // For shapes, text box, sticky notes, stamps
  title?: string; // For sticky notes
  text?: string; // For text boxes & sticky notes
  color: string;
  strokeWidth: number; // Visual stroke width at 100% scale (e.g. 2, 4, 8)
  opacity: number; // 0.1 to 1.0
  fillColor?: string;
  fontSize?: number; // Base font size in px at 100% scale (e.g. 14, 18, 24)
  isExpanded?: boolean; // For sticky note popover state
  createdAt: number;
  modifiedAt: number;
}
