export type BlogCategory = "blog" | "news" | "announcement";

/**
 * Represents a blog post entry in the TECHSHASTRA blog.
 */
export interface BlogPost {
    id: string;          // Unique identifier for the post
    title: string;       // Public title of the blog post
    slug: string;        // URL-friendly identifier (e.g., tech-summit-2026)
    excerpt: string;     // Short summary for post cards
    content: string;     // Full markdown content of the post
    image_url: string;   // Featured image URL
    category: BlogCategory; // Category of the post (blog, news, announcement)
    author: string;      // Name of the author
    published: boolean;  // Whether the post is visible to the public
    published_at: string; // ISO string timestamp of publication
    created_at: number;   // Unix timestamp for sorting
}

const STORAGE_KEY = "techshastra_blog_posts";

/**
 * DEMO DATA: Hardcoded blog posts used for initial demonstration.
 * Feel free to remove or replace these in your final application.
 */
export const samplePosts: BlogPost[] = [
    /*
    {
        id: "sample-1",
        title: "TECHSHASTRA Annual Tech Summit 2026",
        slug: "tech-summit-2026",
        excerpt: "Get ready for the biggest tech event of the year! Join industry leaders and student innovators for a weekend of workshops, keynotes, and networking.",
        content: "We are thrilled to announce the TECHSHASTRA Annual Tech Summit 2026!\n\nThis year's summit will be bigger and better than ever before. We have invited keynote speakers from top tech companies to share their insights on the future of AI, Quantum Computing, and Sustainable Tech.\n\n### What to Expect\n\n- **Workshops**: Hands-on sessions on modern frameworks.\n- **Networking**: Connect with professionals and alumni.\n- **Hackathon**: A 24-hour challenge with exciting prizes.\n\nDon't miss out on this opportunity to learn, build, and grow. Mark your calendars for April 15th-17th!",
        image_url: "https://images.unsplash.com/photo-1540575861501-7ad0582373f0?w=800&q=80",
        category: "news",
        author: "Akhilesh Raje",
        published: true,
        published_at: "2026-02-18T10:00:00Z",
        created_at: 1740000000000,
    },
    {
        id: "sample-2",
        title: "Mastering React & Supabase: A Beginner's Guide",
        slug: "react-supabase-guide",
        excerpt: "Learn how to build powerful full-stack applications quickly using React and Supabase. We cover everything from database setup to authentication.",
        content: "Developing modern web applications often requires a robust backend. Supabase provides an open-source Firebase alternative that simplifies database management and authentication.\n\nIn this guide, we'll walk through the steps of connecting a React frontend to a Supabase backend.\n\n1. **Setting up your project**: Initialize your React app.\n2. **Database Schema**: Create your tables in the Supabase dashboard.\n3. **CRUD Operations**: Fetching and updating data in real-time.",
        image_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
        category: "blog",
        author: "Pratyush Shrivastava",
        published: true,
        published_at: "2026-02-15T14:30:00Z",
        created_at: 1739700000000,
    },
    {
        id: "sample-3",
        title: "New IoT Lab Installation Complete",
        slug: "iot-lab-opening",
        excerpt: "Our state-of-the-art IoT lab is now open for members. Come explore our collection of Microcontrollers, Sensors, and 3D Printers.",
        content: "The moment we've all been waiting for is here! The TECHSHASTRA IoT Lab is officially open.\n\nLocated on the third floor, the lab is equipped with the latest hardware including:\n- ESP32 & Arduino development boards\n- LoRaWAN gateways for long-range communication\n- High-precision 3D printers\n- Oscilloscopes and logic analyzers\n\nFeel free to drop by during campus hours to start working on your hardware projects!",
        image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
        category: "announcement",
        author: "Amitesh Kumar",
        published: true,
        published_at: "2026-02-10T09:00:00Z",
        created_at: 1739200000000,
    }
    */
];

// Fallback for crypto.randomUUID() in non-secure contexts or older browsers
const generateId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/** Convert a title to a URL-safe slug */
export const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")   // remove special chars
        .replace(/[\s_-]+/g, "-")   // spaces/underscores → hyphens
        .replace(/^-+|-+$/g, "");   // trim leading/trailing hyphens
};

export const getStoredBlogPosts = (): BlogPost[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

/** 
 * Returns all blog posts, including locally stored ones and demo data.
 * @returns Array of blog posts sorted newest first
 */
export const getAllBlogPosts = (): BlogPost[] => {
    const stored = getStoredBlogPosts();
    // In production, you might want to remove samplePosts
    return [...stored, ...samplePosts].sort((a, b) => b.created_at - a.created_at);
};

/** Returns only published posts */
export const getPublishedBlogPosts = (): BlogPost[] => {
    return getAllBlogPosts().filter(p => p.published);
};

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
    return getAllBlogPosts().find(p => p.slug === slug);
};

export const addBlogPost = (post: Omit<BlogPost, "id" | "created_at">): BlogPost => {
    const posts = getStoredBlogPosts();

    // Ensure slug uniqueness
    let slug = post.slug || generateSlug(post.title);
    const existingSlugs = posts.map(p => p.slug);
    if (existingSlugs.includes(slug)) {
        slug = `${slug}-${Date.now()}`;
    }

    const newPost: BlogPost = {
        ...post,
        slug,
        id: generateId(),
        created_at: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newPost, ...posts]));
    } catch (e) {
        console.error("Blog storage failed", e);
        throw e;
    }

    return newPost;
};

export const deleteBlogPost = (id: string) => {
    const posts = getStoredBlogPosts();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.filter(p => p.id !== id)));
};

export const updateBlogPost = (id: string, updates: Partial<BlogPost>) => {
    const posts = getStoredBlogPosts();
    const updated = posts.map(p => p.id === id ? { ...p, ...updates } : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
