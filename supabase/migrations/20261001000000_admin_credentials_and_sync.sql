-- ====================================================================
-- TECHSHASTRA — Admin Credentials, Sessions & Audit Log Enhancements
-- ====================================================================

-- 1. Table for Admin Credentials (Name + Mobile + DOB admin system)
CREATE TABLE IF NOT EXISTS admin_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    dob TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    block_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy login verification
CREATE INDEX IF NOT EXISTS idx_admin_credentials_lookup ON admin_credentials (name, mobile, dob);

-- Update trigger
CREATE TRIGGER trg_admin_credentials_updated_at 
    BEFORE UPDATE ON admin_credentials 
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Adjust admin_sessions to support name and decoupled user_id
ALTER TABLE admin_sessions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS admin_credential_id UUID REFERENCES admin_credentials(id) ON DELETE CASCADE;
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS admin_name TEXT;

-- 3. Adjust audit_logs to support standalone actor_id
ALTER TABLE audit_logs ALTER COLUMN actor_id DROP NOT NULL;

-- 4. Enable RLS and permissive policies for admin operations
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admin_credentials" ON admin_credentials FOR ALL USING (true) WITH CHECK (true);

-- Update admin_sessions policies
DROP POLICY IF EXISTS "Admins can manage sessions" ON admin_sessions;
CREATE POLICY "Allow all access to admin_sessions" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);

-- Update audit_logs policies
DROP POLICY IF EXISTS "Admins can view and insert audit logs" ON audit_logs;
CREATE POLICY "Allow all access to audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Update page_visibility policies
DROP POLICY IF EXISTS "Admins can manage page visibility" ON page_visibility;
CREATE POLICY "Allow all access to page_visibility" ON page_visibility FOR ALL USING (true) WITH CHECK (true);
