import { db, getDb, DbDocument } from "./db";
import { loadPdf } from "../pdf/pdfService";

export interface ImportValidationResult {
  valid: boolean;
  error?: string;
}

export async function validatePdfFile(file: File): Promise<ImportValidationResult> {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Check file extension
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return {
      valid: false,
      error: `"${file.name}" is not a PDF file. Only .pdf files are supported.`,
    };
  }

  // Check MIME type if present
  if (file.type && file.type !== "application/pdf" && file.type !== "application/x-pdf") {
    return {
      valid: false,
      error: `Invalid MIME type (${file.type}). Expected application/pdf.`,
    };
  }

  // Check file magic bytes (%PDF-)
  try {
    const slice = file.slice(0, 5);
    const buffer = await slice.arrayBuffer();
    const header = new TextDecoder("ascii").decode(buffer);

    if (!header.startsWith("%PDF-")) {
      return {
        valid: false,
        error: `"${file.name}" has invalid or corrupted PDF header bytes.`,
      };
    }
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not read file header: ${err.message || "Unknown error"}`,
    };
  }

  return { valid: true };
}

export async function importPdfFiles(
  files: FileList | File[],
  folderId?: string | null
): Promise<{ successful: DbDocument[]; errors: { filename: string; reason: string }[] }> {
  const database = await getDb();
  const successful: DbDocument[] = [];
  const errors: { filename: string; reason: string }[] = [];

  const fileArray = Array.from(files);

  for (const file of fileArray) {
    // 1. Validation
    const validation = await validatePdfFile(file);
    if (!validation.valid) {
      errors.push({ filename: file.name, reason: validation.error || "Validation failed" });
      continue;
    }

    try {
      // 2. Read array buffer & parse with PDF.js to obtain page count
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await loadPdf(arrayBuffer);
      const pageCount = pdfDoc.numPages || 1;

      // 3. Create document record
      const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const now = Date.now();

      // Check if another file with exact name exists and rename gracefully if needed
      let docName = file.name;
      try {
        const existing = await database.documents
          .where("name")
          .equals(file.name)
          .filter((d) => !d.deletedAt)
          .first();

        if (existing) {
          const base = file.name.replace(/\.pdf$/i, "");
          const timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });
          docName = `${base} (${timestamp}).pdf`;
        }
      } catch (checkErr) {
        // Fallback in case of index delay
        console.warn("Duplicate check fallback:", checkErr);
      }

      const docRecord: DbDocument = {
        id,
        name: docName,
        originalBlob: file,
        mimeType: "application/pdf",
        sizeBytes: file.size,
        pageCount,
        folderId: folderId || null,
        isFavorite: false,
        dateAdded: now,
        lastOpenedAt: now,
        lastReadPage: 1,
        lastZoom: 100,
        lastViewMode: "continuous",
        modifiedAt: now,
        deletedAt: null,
      };

      await database.documents.add(docRecord);
      successful.push(docRecord);
    } catch (err: any) {
      console.error("Failed to import PDF:", file.name, err);
      errors.push({
        filename: file.name,
        reason: err.message || "Could not parse or render PDF structure.",
      });
    }
  }

  return { successful, errors };
}

export async function getActiveDocuments(): Promise<DbDocument[]> {
  const database = await getDb();
  const all = await database.documents.toArray();
  return all
    .filter((d) => !d.deletedAt)
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
}

export async function getDocumentById(id: string): Promise<DbDocument | undefined> {
  const database = await getDb();
  return database.documents.get(id);
}

export async function updateDocument(
  id: string,
  changes: Partial<Omit<DbDocument, "id">>
): Promise<void> {
  const database = await getDb();
  await database.documents.update(id, {
    ...changes,
    modifiedAt: Date.now(),
  });
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const database = await getDb();
  const doc = await database.documents.get(id);
  if (!doc) return false;
  const newFav = !doc.isFavorite;
  await database.documents.update(id, { isFavorite: newFav, modifiedAt: Date.now() });
  return newFav;
}

export async function deleteDocument(id: string, permanent: boolean = false): Promise<void> {
  const database = await getDb();
  if (permanent) {
    await database.documents.delete(id);
    await database.annotations.where("documentId").equals(id).delete();
    await database.bookmarks.where("documentId").equals(id).delete();
    await database.notes.where("documentId").equals(id).delete();
  } else {
    await database.documents.update(id, {
      deletedAt: Date.now(),
      modifiedAt: Date.now(),
    });
  }
}

export async function restoreDocument(id: string): Promise<void> {
  const database = await getDb();
  await database.documents.update(id, {
    deletedAt: null,
    modifiedAt: Date.now(),
  });
}

export async function getTrashedDocuments(): Promise<DbDocument[]> {
  const database = await getDb();
  const all = await database.documents.toArray();
  return all
    .filter((d) => d.deletedAt !== null)
    .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
}
