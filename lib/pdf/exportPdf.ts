import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { AnnotationItem } from "../annotations/types";

// Helper to convert hex color (#RRGGBB) to pdf-lib rgb(0..1, 0..1, 0..1)
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (isNaN(num)) return rgb(0.9, 0.43, 0.2); // terracotta default
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

export async function exportAnnotatedPdf(
  originalBlob: Blob,
  documentName: string,
  annotations: AnnotationItem[]
): Promise<void> {
  const arrayBuffer = await originalBlob.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
    const page = pages[pageNum - 1];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const pageAnns = annotations.filter((a) => a.pageIndex === pageNum);

    for (const ann of pageAnns) {
      const color = hexToRgb(ann.color);

      // 1. Pen & Freehand Drawings
      if (ann.tool === "pen" && ann.points && ann.points.length > 1) {
        for (let i = 0; i < ann.points.length - 1; i++) {
          const p1 = ann.points[i];
          const p2 = ann.points[i + 1];

          page.drawLine({
            start: {
              x: p1.x * pageWidth,
              y: (1 - p1.y) * pageHeight,
            },
            end: {
              x: p2.x * pageWidth,
              y: (1 - p2.y) * pageHeight,
            },
            thickness: Math.max(1, ann.strokeWidth * (pageWidth / 800)),
            color,
            opacity: ann.opacity ?? 1,
          });
        }
      }

      // 2. Highlighters (multi-rect or freehand points)
      if (ann.tool === "highlighter") {
        if (ann.rects && ann.rects.length > 0) {
          for (const r of ann.rects) {
            page.drawRectangle({
              x: r.x * pageWidth,
              y: (1 - (r.y + r.height)) * pageHeight,
              width: r.width * pageWidth,
              height: r.height * pageHeight,
              color,
              opacity: 0.35,
            });
          }
        } else if (ann.rect) {
          page.drawRectangle({
            x: ann.rect.x * pageWidth,
            y: (1 - (ann.rect.y + ann.rect.height)) * pageHeight,
            width: ann.rect.width * pageWidth,
            height: ann.rect.height * pageHeight,
            color,
            opacity: 0.35,
          });
        } else if (ann.points && ann.points.length > 1) {
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];

            page.drawLine({
              start: {
                x: p1.x * pageWidth,
                y: (1 - p1.y) * pageHeight,
              },
              end: {
                x: p2.x * pageWidth,
                y: (1 - p2.y) * pageHeight,
              },
              thickness: Math.max(12, ann.strokeWidth * 4 * (pageWidth / 800)),
              color,
              opacity: 0.35,
            });
          }
        }
      }

      // 3. Shapes
      if (ann.tool === "shape" && ann.rect) {
        const shapeType = ann.shapeType || "rectangle";
        const thickness = Math.max(1, ann.strokeWidth * (pageWidth / 800));

        if (shapeType === "rectangle") {
          page.drawRectangle({
            x: ann.rect.x * pageWidth,
            y: (1 - (ann.rect.y + ann.rect.height)) * pageHeight,
            width: Math.max(2, ann.rect.width * pageWidth),
            height: Math.max(2, ann.rect.height * pageHeight),
            borderColor: color,
            borderWidth: thickness,
            opacity: ann.opacity ?? 1,
          });
        } else if (shapeType === "circle") {
          page.drawEllipse({
            x: (ann.rect.x + ann.rect.width / 2) * pageWidth,
            y: (1 - (ann.rect.y + ann.rect.height / 2)) * pageHeight,
            xScale: Math.max(2, (ann.rect.width / 2) * pageWidth),
            yScale: Math.max(2, (ann.rect.height / 2) * pageHeight),
            borderColor: color,
            borderWidth: thickness,
            opacity: ann.opacity ?? 1,
          });
        }
      }

      // 4. Lines & Arrows
      if (ann.tool === "shape" && (ann.shapeType === "line" || ann.shapeType === "arrow") && ann.points && ann.points.length >= 2) {
        const p1 = ann.points[0];
        const p2 = ann.points[1];
        const startX = p1.x * pageWidth;
        const startY = (1 - p1.y) * pageHeight;
        const endX = p2.x * pageWidth;
        const endY = (1 - p2.y) * pageHeight;
        const thickness = Math.max(1, ann.strokeWidth * (pageWidth / 800));

        page.drawLine({
          start: { x: startX, y: startY },
          end: { x: endX, y: endY },
          thickness,
          color,
          opacity: ann.opacity ?? 1,
        });

        if (ann.shapeType === "arrow") {
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowLength = 12 * (pageWidth / 800);
          page.drawLine({
            start: { x: endX, y: endY },
            end: {
              x: endX - arrowLength * Math.cos(angle - Math.PI / 6),
              y: endY - arrowLength * Math.sin(angle - Math.PI / 6),
            },
            thickness,
            color,
            opacity: ann.opacity ?? 1,
          });
          page.drawLine({
            start: { x: endX, y: endY },
            end: {
              x: endX - arrowLength * Math.cos(angle + Math.PI / 6),
              y: endY - arrowLength * Math.sin(angle + Math.PI / 6),
            },
            thickness,
            color,
            opacity: ann.opacity ?? 1,
          });
        }
      }

      // 5. Text Overlays
      if ((ann.tool === "text" || ann.tool === "note") && ann.text && ann.rect) {
        const fontSize = Math.max(10, (ann.fontSize || 16) * (pageWidth / 800));
        const lines = ann.text.split("\n");

        for (let l = 0; l < lines.length; l++) {
          const lineText = lines[l];
          if (!lineText) continue;

          page.drawText(lineText, {
            x: ann.rect.x * pageWidth,
            y: (1 - ann.rect.y) * pageHeight - (l + 1) * (fontSize * 1.2),
            size: fontSize,
            font: helveticaFont,
            color,
            opacity: ann.opacity ?? 1,
          });
        }
      }
    }
  }

  const modifiedPdfBytes = await pdfDoc.save();

  // Create downloadable file
  const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const cleanBaseName = documentName.replace(/\.pdf$/i, "");
  anchor.href = url;
  anchor.download = `${cleanBaseName}_annotated.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
