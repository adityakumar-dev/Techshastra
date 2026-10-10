import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, Newspaper, FileText, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { getBlogPostBySlug as getLocalBlogPostBySlug, BlogPost as BlogPostType, BlogCategory } from "@/lib/blogStore";
import { getBlogPostBySlug as getRemoteBlogPostBySlug } from "@/lib/services/blogService";

const CATEGORY_LABELS: Record<BlogCategory, string> = {
  blog: "Blog",
  news: "News",
  announcement: "Announcement",
};

const CATEGORY_STYLE: Record<BlogCategory, string> = {
  blog: "bg-primary/10 text-primary border-primary/20",
  news: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  announcement: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const CATEGORY_ICONS: Record<BlogCategory, React.ReactNode> = {
  blog: <FileText className="w-3.5 h-3.5" />,
  news: <Newspaper className="w-3.5 h-3.5" />,
  announcement: <Megaphone className="w-3.5 h-3.5" />,
};

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const fetchPost = async () => {
        try {
          const remote = await getRemoteBlogPostBySlug(slug);
          if (remote && ((remote as any).published || (remote as any).is_published)) {
            setPost(remote);
            setLoading(false);
            return;
          }
        } catch (_e) {}
        const found = getLocalBlogPostBySlug(slug);
        setPost(found?.published ? found : null);
        setLoading(false);
      };
      fetchPost();
    }
  }, [slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />

      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <Link to="/blog">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded mb-4" />
            <div className="h-6 bg-muted rounded w-1/3 mb-8" />
            <div className="h-96 bg-muted rounded mb-8" />
          </div>
        ) : post ? (
          <article>
            {/* Category badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${CATEGORY_STYLE[post.category as BlogCategory] || CATEGORY_STYLE.blog}`}>
                {CATEGORY_ICONS[post.category as BlogCategory] || CATEGORY_ICONS.blog}
                {CATEGORY_LABELS[post.category as BlogCategory] || "Article"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {(post.author_name || post.author || "T").charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-foreground">{post.author_name || post.author || "TECHSHASTRA"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(post.published_at || post.created_at || Date.now()), "MMMM d, yyyy")}</span>
              </div>
            </div>

            {/* Cover image */}
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full rounded-2xl mb-10 shadow-xl max-h-[480px] object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}

            {/* Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {post.content.split(/\n{2,}/).map((paragraph, i) => (
                paragraph.trim() ? (
                  <p key={i} className="mb-5 leading-relaxed text-foreground/90">
                    {paragraph.split('\n').map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < paragraph.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ) : null
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t">
              <Link to="/blog">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to all posts
                </Button>
              </Link>
            </div>
          </article>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
            <p className="text-muted-foreground">The blog post you're looking for doesn't exist.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;