import { db, getDb, DbAnnotation } from "../storage/db";
import { AnnotationItem } from "./types";

export async function getAnnotationsForPage(
  documentId: string,
  pageIndex: number
): Promise<AnnotationItem[]> {
  const database = await getDb();
  const records = await database.annotations
    .where("[documentId+pageIndex]")
    .equals([documentId, pageIndex])
    .toArray();

  return records.map((r) => ({
    id: r.id,
    documentId: r.documentId,
    pageIndex: r.pageIndex,
    tool: r.type as any,
    shapeType: r.geometry?.shapeType,
    stampType: r.geometry?.stampType,
    points: r.geometry?.points,
    rect: r.geometry?.rect,
    rects: r.geometry?.rects,
    title: r.geometry?.title,
    isExpanded: r.geometry?.isExpanded ?? false,
    text: r.content,
    color: r.style?.color || "#E76F35",
    strokeWidth: r.style?.strokeWidth || 3,
    opacity: r.style?.opacity ?? 1,
    fillColor: r.style?.fillColor,
    fontSize: r.style?.fontSize || 16,
    createdAt: r.createdAt,
    modifiedAt: r.modifiedAt,
  }));
}

export async function getAllAnnotationsForDocument(
  documentId: string
): Promise<AnnotationItem[]> {
  const database = await getDb();
  const records = await database.annotations
    .where("documentId")
    .equals(documentId)
    .toArray();

  return records.map((r) => ({
    id: r.id,
    documentId: r.documentId,
    pageIndex: r.pageIndex,
    tool: r.type as any,
    shapeType: r.geometry?.shapeType,
    stampType: r.geometry?.stampType,
    points: r.geometry?.points,
    rect: r.geometry?.rect,
    rects: r.geometry?.rects,
    title: r.geometry?.title,
    isExpanded: r.geometry?.isExpanded ?? false,
    text: r.content,
    color: r.style?.color || "#E76F35",
    strokeWidth: r.style?.strokeWidth || 3,
    opacity: r.style?.opacity ?? 1,
    fillColor: r.style?.fillColor,
    fontSize: r.style?.fontSize || 16,
    createdAt: r.createdAt,
    modifiedAt: r.modifiedAt,
  }));
}

export async function savePageAnnotations(
  documentId: string,
  pageIndex: number,
  annotations: AnnotationItem[]
): Promise<void> {
  const database = await getDb();

  await database.transaction("rw", database.annotations, async () => {
    // 1. Remove existing annotations for this page
    await database.annotations
      .where("[documentId+pageIndex]")
      .equals([documentId, pageIndex])
      .delete();

    // 2. Insert updated annotations
    const dbRecords: DbAnnotation[] = annotations.map((a, idx) => ({
      id: a.id,
      documentId: a.documentId,
      pageIndex: a.pageIndex,
      type: a.tool as any,
      geometry: {
        points: a.points,
        rect: a.rect,
        rects: a.rects,
        shapeType: a.shapeType,
        stampType: a.stampType,
        title: a.title,
        isExpanded: a.isExpanded,
      },
      style: {
        color: a.color,
        strokeWidth: a.strokeWidth,
        opacity: a.opacity,
        fillColor: a.fillColor,
        fontSize: a.fontSize,
      },
      content: a.text,
      createdAt: a.createdAt || Date.now(),
      modifiedAt: a.modifiedAt || Date.now(),
      zIndex: idx + 1,
    }));

    if (dbRecords.length > 0) {
      await database.annotations.bulkAdd(dbRecords);
    }
  });
}
