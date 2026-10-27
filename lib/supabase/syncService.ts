import { createClient, isSupabaseConfigured } from "./client";
import { db, DbDocument } from "../storage/db";

export interface SyncStatus {
  isConfigured: boolean;
  isAuthenticated: boolean;
  userEmail?: string;
}

export async function getSupabaseAuthStatus(): Promise<SyncStatus> {
  if (!isSupabaseConfigured()) {
    return { isConfigured: false, isAuthenticated: false };
  }

  const supabase = createClient();
  if (!supabase) {
    return { isConfigured: false, isAuthenticated: false };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return {
      isConfigured: true,
      isAuthenticated: !!user,
      userEmail: user?.email,
    };
  } catch (err) {
    console.error("Error getting Supabase auth status:", err);
    return { isConfigured: true, isAuthenticated: false };
  }
}

export async function syncDocumentToCloud(
  doc: DbDocument
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase credentials are not configured in .env.local" };
  }

  const supabase = createClient();
  if (!supabase) {
    return { success: false, error: "Supabase client initialization failed" };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Sign in required to backup documents to cloud" };
  }

  try {
    // 1. Upload original PDF to Supabase Storage: bucket 'pdf_documents'
    const storagePath = `${user.id}/${doc.id}.pdf`;
    const { error: storageError } = await supabase.storage
      .from("pdf_documents")
      .upload(storagePath, doc.originalBlob, {
        upsert: true,
        contentType: doc.mimeType || "application/pdf",
      });

    if (storageError) {
      console.error("Storage upload error:", storageError);
      return { success: false, error: storageError.message };
    }

    // 2. Upsert document metadata in Supabase 'documents' table
    const { error: dbError } = await supabase.from("documents").upsert(
      {
        user_id: user.id,
        local_id: doc.id,
        name: doc.name,
        storage_path: storagePath,
        size_bytes: doc.sizeBytes,
        page_count: doc.pageCount,
        is_favorite: doc.isFavorite,
        last_read_page: doc.lastReadPage,
        last_zoom: doc.lastZoom,
        modified_at: new Date(doc.modifiedAt).toISOString(),
      },
      { onConflict: "user_id, local_id" }
    );

    if (dbError) {
      console.error("Database upsert error:", dbError);
      return { success: false, error: dbError.message };
    }

    // 3. Mark local document as synced in IndexedDB
    await db.documents.update(doc.id, {
      syncedWithSupabase: true,
      modifiedAt: Date.now(),
    });

    return { success: true };
  } catch (err: any) {
    console.error("Sync error:", err);
    return { success: false, error: err.message || "Failed to sync document" };
  }
}
