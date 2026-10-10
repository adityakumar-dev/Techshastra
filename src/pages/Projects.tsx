/**
 * Projects Page
 * 
 * Displays a grid of all technical projects from the TECHSHASTRA community.
 * Fetches data from the projectStore and supports live demo links.
 */
import { useState, useEffect } from "react";
import { getAllProjects, type Project as LocalProject } from "@/lib/projectStore";
import { getProjects, type Project } from "@/lib/services/projectService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, Play, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const Projects = () => {
  // State for storing the list of projects fetched from Supabase
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const remote = await getProjects();
        if (remote && remote.length > 0) {
          setAllProjects(remote);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to fetch remote projects, falling back:", err);
      }
      try {
        const data = getAllProjects();
        setAllProjects(data);
      } catch (err) {
        console.error("Failed to fetch local projects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-heading font-light tracking-tight">
              Our <span className="text-primary italic">Projects</span>
            </h1>
            <p className="text-base font-light text-foreground/50 max-w-2xl mx-auto tracking-wide italic">
              "Explore the intersection of hardware, software, and visionary entrepreneurship."
            </p>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[500px] rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : allProjects.length === 0 ? (
            <div className="text-center py-24 glass rounded-[3rem]">
              <p className="text-muted-foreground italic">No projects found in our digital archives.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allProjects.map((project) => (
                <Card
                  key={project.id}
                  className="glass border-0 hover:scale-[1.02] transition-all duration-500 group rounded-3xl overflow-hidden"
                >
                  {/* Project Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={project.image_url || `https://og.tailgraph.com/og?fontFamily=Inter&title=${encodeURIComponent(project.title)}&bgColor=0f172a&titleColor=a855f7&logoText=TECHSHASTRA`}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = `https://placehold.co/800x450/0f172a/a855f7?text=${encodeURIComponent(project.title)}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

                    <div className="absolute top-4 right-4 flex gap-2">
                      <Badge className="bg-primary/20 backdrop-blur-md text-primary-foreground border-0 text-[10px] uppercase tracking-widest px-3 py-1">
                        {project.status}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-8 space-y-6">
                    <h3 className="text-xl font-heading font-light tracking-wide">{project.title}</h3>
                    <p className="text-sm font-light text-foreground/50 line-clamp-2 italic">
                      {project.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-foreground/5">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 mb-1">Status</p>
                        <p className="text-xs font-light text-foreground/70 uppercase">{project.status}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 mb-1">Persistent</p>
                        <p className="text-xs font-light text-primary/70">Supabase DB</p>
                      </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2">
                      {((project.tags || (project as any).tech_stack || []) as string[]).slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[10px] uppercase tracking-widest text-foreground/40 font-light px-2 py-1 bg-primary/5 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1 glass border-0 rounded-full h-12 hover:bg-primary/5 transition-all duration-300"
                        asChild
                      >
                        <a href={project.github_url || "#"} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          <span className="text-[10px] uppercase tracking-widest">Code</span>
                        </a>
                      </Button>

                      <Link to={`/projects/${project.id}/live`} className="flex-1">
                        <Button className="w-full bg-primary text-primary-foreground rounded-full h-12 shadow-lg hover:shadow-primary/20 transition-all duration-500">
                          <Play className="w-4 h-4 mr-2" />
                          <span className="text-[10px] uppercase tracking-widest">Details</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-24 text-center">
            <div className="glass p-12 rounded-[3rem] border-0 space-y-6 max-w-4xl mx-auto">
              <h3 className="text-3xl font-heading font-light tracking-tight italic">Have a Project Idea?</h3>
              <p className="text-foreground/50 max-w-2xl mx-auto font-light leading-relaxed">
                Join TECHSHASTRA and bring your innovative ideas to life with our community of creators and mentors.
              </p>
              <Button
                size="lg"
                className="bg-primary text-primary-foreground rounded-full px-12 py-7 mt-4 shadow-2xl hover:scale-105 transition-all duration-500"
                asChild
              >
                <Link to="/join">
                  <span className="text-xs uppercase tracking-[0.2em] font-medium">Join Our Community</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Projects;
