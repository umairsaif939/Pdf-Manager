-- PDF Flux Initial Supabase Schema & Row Level Security (RLS) Policies
-- Migration: 20261027_initial_schema.sql

-- 1. Create Folders Table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    color TEXT DEFAULT '#E76F35',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS for Folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own folders"
    ON public.folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
    ON public.folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
    ON public.folders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
    ON public.folders FOR DELETE
    USING (auth.uid() = user_id);


-- 2. Create Documents Table
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    local_id TEXT NOT NULL,
    name TEXT NOT NULL,
    storage_path TEXT,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    page_count INT NOT NULL DEFAULT 1,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    last_read_page INT NOT NULL DEFAULT 1,
    last_zoom NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Enable RLS for Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);


-- 3. Create Annotations Table
CREATE TABLE IF NOT EXISTS public.annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    page_index INT NOT NULL,
    type TEXT NOT NULL,
    geometry JSONB NOT NULL,
    style JSONB NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Annotations
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own annotations"
    ON public.annotations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own annotations"
    ON public.annotations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
    ON public.annotations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
    ON public.annotations FOR DELETE
    USING (auth.uid() = user_id);


-- 4. Create Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    page_index INT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    modified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
    ON public.notes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON public.notes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
    ON public.notes FOR DELETE
    USING (auth.uid() = user_id);


-- 5. Supabase Storage Bucket Setup for 'pdf_documents'
-- Insert bucket record if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf_documents', 'pdf_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can access their own folder (auth.uid() / filename)
CREATE POLICY "Users can view own files in storage"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pdf_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own files to storage"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'pdf_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files in storage"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'pdf_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files in storage"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'pdf_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
