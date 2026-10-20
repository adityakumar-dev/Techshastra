-- ====================================================================
-- Certificates Storage Bucket & RLS Setup
-- ====================================================================

-- 1. Ensure certificates storage bucket exists and is publicly accessible
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public to read/view certificate files from the bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view certificate files'
    ) THEN
        CREATE POLICY "Public can view certificate files"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'certificates');
    END IF;
END $$;

-- 3. Allow admins to insert/upload certificate files
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can upload certificate files'
    ) THEN
        CREATE POLICY "Admins can upload certificate files"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'certificates');
    END IF;
END $$;
