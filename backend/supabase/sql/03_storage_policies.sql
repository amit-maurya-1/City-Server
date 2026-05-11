-- ============================================================
-- CityServe — Supabase Storage Setup
-- Run in Supabase SQL Editor AFTER 02_rls_policies.sql
--
-- Also create the "issue-images" bucket manually in:
-- Supabase Dashboard → Storage → New Bucket
--   Name: issue-images
--   Public: true (so image_url works publicly on the map)
--   File size limit: 5242880 (5MB)
--   Allowed MIME types: image/jpeg, image/png, image/webp
-- ============================================================


-- Only authenticated citizens can upload to issue-images
CREATE POLICY "storage_citizen_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'issue-images'
    AND auth.role() = 'authenticated'
  );

-- Anyone can view images (public map view needs this)
CREATE POLICY "storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'issue-images');

-- Citizens can delete only their own uploads
-- (file path convention: issue-images/{user_id}/{filename})
CREATE POLICY "storage_citizen_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'issue-images'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
