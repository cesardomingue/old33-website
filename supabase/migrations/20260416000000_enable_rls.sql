-- ============================================================
--  OLD 33 — Enable Row Level Security on all sensitive tables
--  Run this in the Supabase SQL editor (Dashboard → SQL Editor)
--  After applying: all direct anon API calls will be blocked.
--  All data access goes through Edge Functions (service_role).
-- ============================================================

-- otp_codes: no direct client access at all
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_otp" ON otp_codes;
-- No policies = deny all by default (edge functions use service_role which bypasses RLS)

-- members: no direct client access
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- No policies = deny all by default

-- orders: no direct client access
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- No policies = deny all by default

-- pin_attempts: no direct client access (edge functions manage this)
ALTER TABLE pin_attempts ENABLE ROW LEVEL SECURITY;
-- No policies = deny all by default

-- contacts: no direct client access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    EXECUTE 'ALTER TABLE contacts ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ============================================================
--  Also add name column to otp_codes if not present
--  (needed so verify-otp can use the name when creating a new member)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'otp_codes' AND column_name = 'name'
  ) THEN
    ALTER TABLE otp_codes ADD COLUMN name TEXT;
  END IF;
END $$;

-- ============================================================
--  Add ip column to contacts for rate limiting in submit-contact
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name = 'ip'
    ) THEN
      EXECUTE 'ALTER TABLE contacts ADD COLUMN ip TEXT';
    END IF;
  END IF;
END $$;

-- ============================================================
--  Verify: after running this, test that a direct anon call
--  to /rest/v1/otp_codes returns [] or 403, not real data.
-- ============================================================
