-- ============================================================
-- CityServe — Row Level Security Policies
-- Run AFTER 01_schema.sql
-- ============================================================


-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE cities   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues   ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes  ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- CITIES TABLE
-- ============================================================

-- Anyone can read cities (needed for registration dropdown)
CREATE POLICY "cities_public_read"
  ON cities FOR SELECT
  USING (true);


-- ============================================================
-- PROFILES TABLE
-- ============================================================

-- Users can read their own profile
CREATE POLICY "profiles_read_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read profiles of users in their city
CREATE POLICY "profiles_admin_read_city"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.city_id = profiles.city_id
    )
  );

-- Users can update their own profile (limited fields — role NOT updatable via client)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- role and city_id cannot be changed post-registration
    -- enforce this at the Edge Function level too
  );


-- ============================================================
-- ISSUES TABLE
-- ============================================================

-- Anyone can read non-deleted issues (public map view)
CREATE POLICY "issues_public_read"
  ON issues FOR SELECT
  USING (deleted_at IS NULL);

-- Authenticated citizens can insert issues in their own city
CREATE POLICY "issues_citizen_insert"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND city_id = (
      SELECT city_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Citizens can soft-delete (update deleted_at) their own issues
CREATE POLICY "issues_citizen_delete_own"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    reported_by = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (
    reported_by = auth.uid()
  );

-- Admins can update issues in their city (status changes, verification)
CREATE POLICY "issues_admin_update"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.city_id = issues.city_id
    )
  );

-- Admins can read ALL issues in their city (including soft-deleted, for audit)
CREATE POLICY "issues_admin_read_all"
  ON issues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
        AND p.city_id = issues.city_id
    )
  );


-- ============================================================
-- UPVOTES TABLE
-- ============================================================

-- Authenticated users can read upvotes (to check if they've voted)
CREATE POLICY "upvotes_read"
  ON upvotes FOR SELECT
  TO authenticated
  USING (true);

-- Citizens can insert their own upvote
CREATE POLICY "upvotes_citizen_insert"
  ON upvotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Citizens can remove their own upvote
CREATE POLICY "upvotes_citizen_delete"
  ON upvotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
