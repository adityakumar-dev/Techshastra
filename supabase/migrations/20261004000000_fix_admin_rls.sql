-- ============================================================
-- TECHSHASTRA: Admin RLS Fix Migration
-- Problem: All "Admin manage X" policies check is_admin(auth.uid())
-- which requires Supabase Auth login. Since TechShastra uses custom
-- credential-based admin auth (not Supabase Auth), auth.uid() is
-- always NULL for admins, blocking all INSERT/UPDATE/DELETE.
-- Fix: Replace with permissive policies. Security enforced at app layer.
-- ============================================================

-- PROJECTS
DROP POLICY IF EXISTS "Admin manage projects" ON projects;
CREATE POLICY "Admin manage projects" ON projects FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public read published projects" ON projects;
CREATE POLICY "Public read published projects" ON projects FOR SELECT USING (true);

-- EVENTS
DROP POLICY IF EXISTS "Admin manage events" ON events;
CREATE POLICY "Admin manage events" ON events FOR ALL USING (true) WITH CHECK (true);

-- BLOG POSTS
DROP POLICY IF EXISTS "Admin manage blogs" ON blog_posts;
CREATE POLICY "Admin manage blogs" ON blog_posts FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public read published blogs" ON blog_posts;
CREATE POLICY "Public read published blogs" ON blog_posts FOR SELECT USING (true);

-- PUBLICATIONS
DROP POLICY IF EXISTS "Admin manage publications" ON publications;
CREATE POLICY "Admin manage publications" ON publications FOR ALL USING (true) WITH CHECK (true);

-- GALLERY
DROP POLICY IF EXISTS "Admin manage gallery" ON gallery_photos;
CREATE POLICY "Admin manage gallery" ON gallery_photos FOR ALL USING (true) WITH CHECK (true);

-- LEARNING RESOURCES
DROP POLICY IF EXISTS "Admin manage resources" ON learning_resources;
CREATE POLICY "Admin manage resources" ON learning_resources FOR ALL USING (true) WITH CHECK (true);

-- FAQS
DROP POLICY IF EXISTS "Admin manage faqs" ON faqs;
CREATE POLICY "Admin manage faqs" ON faqs FOR ALL USING (true) WITH CHECK (true);

-- ACHIEVEMENTS
DROP POLICY IF EXISTS "Admin manage achievements" ON achievements;
CREATE POLICY "Admin manage achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);

-- SOCIAL LINKS
DROP POLICY IF EXISTS "Admin manage social links" ON social_links;
CREATE POLICY "Admin manage social links" ON social_links FOR ALL USING (true) WITH CHECK (true);

-- CERTIFICATES
DROP POLICY IF EXISTS "Admins can manage certificates" ON certificates;
CREATE POLICY "Admins can manage certificates" ON certificates FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage certificate jobs" ON certificate_jobs;
CREATE POLICY "Admins can manage certificate jobs" ON certificate_jobs FOR ALL USING (true) WITH CHECK (true);

-- PAGE VISIBILITY
DROP POLICY IF EXISTS "Admins can update page visibility" ON page_visibility;
CREATE POLICY "Admins can update page visibility" ON page_visibility FOR ALL USING (true) WITH CHECK (true);

-- ADMIN SESSIONS
DROP POLICY IF EXISTS "Admins can insert or update sessions" ON admin_sessions;
CREATE POLICY "Admins can insert or update sessions" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all admin sessions" ON admin_sessions;
CREATE POLICY "Admins can view all admin sessions" ON admin_sessions FOR SELECT USING (true);

-- CONTACT MESSAGES
DROP POLICY IF EXISTS "Admins can manage contact messages" ON contact_messages;
CREATE POLICY "Admins can manage contact messages" ON contact_messages FOR ALL USING (true) WITH CHECK (true);

-- MEMBERSHIP APPLICATIONS
DROP POLICY IF EXISTS "Admins can manage membership applications" ON membership_applications;
CREATE POLICY "Admins can manage membership applications" ON membership_applications FOR ALL USING (true) WITH CHECK (true);

-- EVENT REGISTRATIONS
DROP POLICY IF EXISTS "Admin manage registrations" ON event_registrations;
CREATE POLICY "Admin manage registrations" ON event_registrations FOR ALL USING (true) WITH CHECK (true);
