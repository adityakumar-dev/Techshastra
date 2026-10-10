-- ====================================================================
-- SEED INITIAL PAGE VISIBILITY ROWS
-- ====================================================================

INSERT INTO page_visibility (page_path, page_name, is_visible)
VALUES
    ('/projects', 'Projects', true),
    ('/events', 'Events', true),
    ('/blog', 'Blog', true),
    ('/gallery', 'Gallery', true),
    ('/achievements', 'Achievements', true),
    ('/publications', 'Publications', true),
    ('/resources', 'Resources', true),
    ('/faq', 'FAQ', true),
    ('/socials', 'Socials', true)
ON CONFLICT (page_path) DO NOTHING;
