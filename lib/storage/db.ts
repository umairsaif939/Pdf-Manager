import Dexie, { type Table } from "dexie";

export interface DbDocument {
  id: string;
  name: string;
  originalBlob: Blob;
  mimeType: string;
  sizeBytes: number;
  pageCount: number;
  folderId?: string | null;
  isFavorite: boolean;
  dateAdded: number;
  lastOpenedAt: number;
  lastReadPage: number;
  lastZoom: number;
  lastViewMode: "single" | "two-page" | "continuous";
  modifiedAt: number;
  deletedAt: number | null;
}

export interface DbFolder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
  createdAt: number;
  modifiedAt: number;
  deletedAt: number | null;
}

export interface DbAnnotation {
  id: string;
  documentId: string;
  pageIndex: number;
  pageUid?: string;
  type: "pen" | "highlighter" | "shape" | "text" | "note" | "image" | "stamp";
  geometry: any; // Normalized 0..1 coordinates
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    fillColor?: string;
    fontSize?: number;
    textAlign?: string;
  };
  content?: string;
  createdAt: number;
  modifiedAt: number;
  zIndex: number;
}

export interface DbBookmark {
  id: string;
  documentId: string;
  pageIndex: number;
  pageUid?: string;
  label: string;
  createdAt: number;
}

export interface DbNote {
  id: string;
  documentId: string;
  pageIndex?: number;
  title: string;
  content: string;
  createdAt: number;
  modifiedAt: number;
}

export interface DbFlashcard {
  id: string;
  documentId?: string;
  folderId?: string;
  pageIndex?: number;
  front: string;
  back: string;
  reviewState: {
    repetitions: number;
    interval: number;
    easeFactor: number;
    nextReview: number;
  };
  createdAt: number;
  modifiedAt: number;
}

export interface DbReadingSession {
  id: string;
  documentId: string;
  folderIdAtSession?: string;
  startedAt: number;
  endedAt: number;
  activeSeconds: number;
  dateKey: string; // YYYY-MM-DD
}

export class PdfFluxDatabase extends Dexie {
  documents!: Table<DbDocument, string>;
  folders!: Table<DbFolder, string>;
  annotations!: Table<DbAnnotation, string>;
  bookmarks!: Table<DbBookmark, string>;
  notes!: Table<DbNote, string>;
  flashcards!: Table<DbFlashcard, string>;
  readingSessions!: Table<DbReadingSession, string>;

  constructor() {
    super("pdf_flux_db");

    // Version 1 (Initial schema)
    this.version(1).stores({
      documents: "id, folderId, isFavorite, deletedAt, lastOpenedAt, dateAdded",
      folders: "id, parentId, deletedAt",
      annotations: "id, documentId, [documentId+pageIndex]",
      bookmarks: "id, documentId, [documentId+pageIndex]",
      notes: "id, documentId",
      flashcards: "id, documentId, folderId, reviewState.nextReview",
      readingSessions: "id, documentId, dateKey",
    });

    // Version 2: Index 'name' on documents so queries like .where('name') work without SchemaError.
    // Existing stored documents and annotations are preserved completely.
    this.version(2).stores({
      documents: "id, name, folderId, isFavorite, deletedAt, lastOpenedAt, dateAdded",
    });
  }
}

export const db = new PdfFluxDatabase();

// Ensure the database is safely initialized
export async function getDb(): Promise<PdfFluxDatabase> {
  if (!db.isOpen()) {
    await db.open();
  }
  return db;
}
