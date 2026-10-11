-- ====================================================================
-- TECHSHASTRA — Admin Login Requests Table (Server-Side Approval Queue)
-- ====================================================================

-- Table for cross-device admin approval queue
CREATE TABLE IF NOT EXISTS admin_login_requests (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    dob TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    device TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    responded_by TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_new_registration BOOLEAN NOT NULL DEFAULT FALSE
);

-- Ensure column exists if table was previously created
ALTER TABLE admin_login_requests ADD COLUMN IF NOT EXISTS is_new_registration BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast status queries
CREATE INDEX IF NOT EXISTS idx_admin_login_requests_status ON admin_login_requests (status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_login_requests_admin ON admin_login_requests (admin_id, status);

-- Enable RLS with permissive policy (admin panel is already behind credential auth)
ALTER TABLE admin_login_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to admin_login_requests" ON admin_login_requests 
    FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime on the table
ALTER PUBLICATION supabase_realtime ADD TABLE admin_login_requests;
