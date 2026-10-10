-- ====================================================================
-- TECHSHASTRA PRODUCTION SCHEMA — VERSION 1.0.0
-- Migration: 20260930000000_initial_schema.sql
-- Description: Complete normalized schema, RLS policies, triggers, and indexes.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin',
    'editor',
    'viewer',
    'student_member',
    'public'
);

CREATE TYPE event_status AS ENUM (
    'upcoming',
    'ongoing',
    'completed',
    'cancelled'
);

CREATE TYPE blog_category AS ENUM (
    'blog',
    'news',
    'announcement'
);

CREATE TYPE publication_type AS ENUM (
    'paper',
    'book'
);

CREATE TYPE social_platform AS ENUM (
    'instagram',
    'linkedin',
    'twitter',
    'facebook',
    'other'
);

CREATE TYPE contact_status AS ENUM (
    'new',
    'read',
    'in_progress',
    'resolved',
    'archived'
);

CREATE TYPE application_status AS ENUM (
    'pending',
    'under_review',
    'accepted',
    'rejected',
    'withdrawn'
);

CREATE TYPE certificate_status AS ENUM (
    'active',
    'revoked',
    'expired'
);

-- ====================================================================
-- 3. CORE PROFILES & PERMISSIONS
-- ====================================================================

-- Master Profile table linked to Supabase auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student_member',
    avatar_url TEXT,
    phone TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    block_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student member details (1:1 with profiles)
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    roll_number TEXT,
    course TEXT,
    branch TEXT,
    year TEXT,
    semester TEXT,
    bio TEXT,
    location TEXT,
    github_username TEXT NOT NULL,
    linkedin_url TEXT,
    portfolio_url TEXT,
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    resume_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Education history
CREATE TABLE student_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field TEXT,
    start_year TEXT NOT NULL,
    end_year TEXT,
    grade TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Work Experience
CREATE TABLE student_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Certifications
CREATE TABLE student_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date TEXT,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin active sessions tracking ("Who is using my panel?")
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    browser TEXT,
    device TEXT,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role user_role NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page Visibility Settings
CREATE TABLE page_visibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path TEXT UNIQUE NOT NULL,
    page_name TEXT NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 4. CMS CONTENT TABLES
-- ====================================================================

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    lead_name TEXT NOT NULL,
    designer_name TEXT,
    github_url TEXT NOT NULL,
    demo_url TEXT,
    status TEXT NOT NULL DEFAULT 'In Progress',
    language TEXT NOT NULL DEFAULT 'other',
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    image_url TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    max_attendees INTEGER,
    status event_status NOT NULL DEFAULT 'upcoming',
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event Registrations
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'registered',
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_event_registration UNIQUE (event_id, email)
);

-- Blog Posts
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    category blog_category NOT NULL DEFAULT 'blog',
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Publications (Papers & Books)
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    authors TEXT NOT NULL,
    description TEXT NOT NULL,
    type publication_type NOT NULL DEFAULT 'paper',
    file_url TEXT,
    link_url TEXT,
    isbn_doi TEXT,
    published_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gallery Photos
CREATE TABLE gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Learning Resources
CREATE TABLE learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FAQs
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievements & Awards
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    achievement_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social Links
CREATE TABLE social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform social_platform NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    image_url TEXT,
    author TEXT,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Messages
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status contact_status NOT NULL DEFAULT 'new',
    priority TEXT DEFAULT 'normal',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Membership & Institutional Applications
CREATE TABLE membership_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_type TEXT NOT NULL, -- 'student' or 'organization'
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    organization TEXT,
    academic_details JSONB DEFAULT '{}'::jsonb,
    interests TEXT[] DEFAULT '{}',
    reason TEXT NOT NULL,
    github_username TEXT,
    linkedin_url TEXT,
    status application_status NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificates
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id TEXT UNIQUE NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    event_name TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    certificate_url TEXT,
    status certificate_status NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Certificate Jobs (Bulk sending records)
CREATE TABLE certificate_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_recipients INTEGER NOT NULL DEFAULT 0,
    successful_sends INTEGER NOT NULL DEFAULT 0,
    failed_sends INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    error_log TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 5. HELPER FUNCTIONS & TRIGGERS
-- ====================================================================

-- Function to check user role securely without recursion
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND role IN ('admin', 'super_admin') AND is_blocked = FALSE
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_user_id AND role = 'super_admin' AND is_blocked = FALSE
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Trigger to automatically maintain updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_student_profiles_updated_at BEFORE UPDATE ON student_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_publications_updated_at BEFORE UPDATE ON publications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_learning_resources_updated_at BEFORE UPDATE ON learning_resources FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_faqs_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_membership_applications_updated_at BEFORE UPDATE ON membership_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_certificates_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger to auto-create profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student_member'::public.user_role)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can view non-blocked profiles. User can edit own. Admin can manage all.
CREATE POLICY "Public profiles can be viewed" ON profiles
    FOR SELECT USING (is_blocked = FALSE);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles" ON profiles
    FOR ALL USING (is_admin(auth.uid()));

-- Student Profiles: Public/members can read active students. Student can edit own. Admin full access.
CREATE POLICY "Anyone can view active student profiles" ON student_profiles
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Students can update own profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access to student profiles" ON student_profiles
    FOR ALL USING (is_admin(auth.uid()));

-- Student sub-tables (Education, Experience, Certifications)
CREATE POLICY "View student sub-data" ON student_education FOR SELECT USING (TRUE);
CREATE POLICY "Manage own student education" ON student_education
    FOR ALL USING (EXISTS (SELECT 1 FROM student_profiles WHERE student_profiles.id = student_education.student_profile_id AND student_profiles.user_id = auth.uid()));

CREATE POLICY "View student experience" ON student_experience FOR SELECT USING (TRUE);
CREATE POLICY "Manage own student experience" ON student_experience
    FOR ALL USING (EXISTS (SELECT 1 FROM student_profiles WHERE student_profiles.id = student_experience.student_profile_id AND student_profiles.user_id = auth.uid()));

CREATE POLICY "View student certifications" ON student_certifications FOR SELECT USING (TRUE);
CREATE POLICY "Manage own student certifications" ON student_certifications
    FOR ALL USING (EXISTS (SELECT 1 FROM student_profiles WHERE student_profiles.id = student_certifications.student_profile_id AND student_profiles.user_id = auth.uid()));

-- Admin Sessions: Admins can view and revoke sessions
CREATE POLICY "Admins can view all admin sessions" ON admin_sessions
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert or update sessions" ON admin_sessions
    FOR ALL USING (is_admin(auth.uid()));

-- Audit Logs: Only admins can view audit logs. Inserts allowed for authenticated users.
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can record audit logs" ON audit_logs
    FOR INSERT WITH CHECK (TRUE);

-- Page Visibility: Everyone can read. Admins can update.
CREATE POLICY "Anyone can read page visibility" ON page_visibility
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can update page visibility" ON page_visibility
    FOR ALL USING (is_admin(auth.uid()));

-- CMS: Projects, Events, Blog, Publications, Gallery, Resources, FAQ, Achievements, Socials
CREATE POLICY "Public read published projects" ON projects FOR SELECT USING (is_published = TRUE OR is_admin(auth.uid()));
CREATE POLICY "Admin manage projects" ON projects FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read events" ON events FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage events" ON events FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public register for events" ON event_registrations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Admin manage registrations" ON event_registrations FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read published blogs" ON blog_posts FOR SELECT USING (published = TRUE OR is_admin(auth.uid()));
CREATE POLICY "Admin manage blogs" ON blog_posts FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read publications" ON publications FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage publications" ON publications FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read gallery" ON gallery_photos FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage gallery" ON gallery_photos FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read resources" ON learning_resources FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage resources" ON learning_resources FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read faqs" ON faqs FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage faqs" ON faqs FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage achievements" ON achievements FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Public read social links" ON social_links FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage social links" ON social_links FOR ALL USING (is_admin(auth.uid()));

-- Contact Messages: Anyone can insert. Only admins can read/manage.
CREATE POLICY "Anyone can submit contact message" ON contact_messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can manage contact messages" ON contact_messages FOR ALL USING (is_admin(auth.uid()));

-- Membership Applications: Anyone can submit. Only admins can read/review.
CREATE POLICY "Anyone can submit membership application" ON membership_applications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can manage membership applications" ON membership_applications FOR ALL USING (is_admin(auth.uid()));

-- Certificates: Public can verify active certificates by verification ID. Admins manage all.
CREATE POLICY "Public can verify active certificates" ON certificates
    FOR SELECT USING (status = 'active' OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage certificates" ON certificates FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage certificate jobs" ON certificate_jobs FOR ALL USING (is_admin(auth.uid()));

-- ====================================================================
-- 7. PERFORMANCE INDEXES
-- ====================================================================

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_student_profiles_username ON student_profiles(username);
CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX idx_student_profiles_github ON student_profiles(github_username);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_published ON projects(is_published);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_blog_slug ON blog_posts(slug);
CREATE INDEX idx_blog_published ON blog_posts(published, published_at);
CREATE INDEX idx_publications_type ON publications(type);
CREATE INDEX idx_faqs_order ON faqs(order_index);
CREATE INDEX idx_contact_messages_status ON contact_messages(status, created_at);
CREATE INDEX idx_membership_applications_status ON membership_applications(status, created_at);
CREATE INDEX idx_certificates_verification_id ON certificates(verification_id);
CREATE INDEX idx_admin_sessions_user_active ON admin_sessions(user_id, is_active);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at);
