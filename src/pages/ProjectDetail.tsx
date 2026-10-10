import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProject, type Project as LocalProject } from "@/lib/projectStore";
import { getProjectById } from "@/lib/services/projectService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Github, ExternalLink, Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      try {
        const remote = await getProjectById(id);
        if (remote) {
          setProject({
            ...remote,
            image: remote.image_url,
            github: remote.github_url,
            demo: remote.demo_url,
            tags: remote.tags || [],
            team: {
              lead: remote.lead_name,
              designer: remote.designer_name,
            },
          });
          setLoading(false);
          return;
        }
      } catch (_err) {
        // Fallback
      }
      const found = getProject(id);
      setProject(found);
      setLoading(false);
    };

    fetchProject();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24 max-w-5xl">
        <Link to="/projects">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        ) : project ? (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge>{project.status || "Active"}</Badge>
                {project.language && <Badge variant="secondary">{project.language}</Badge>}
                {(project.tags || []).map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {project.title}
              </h1>
              <p className="text-xl text-muted-foreground">{project.description}</p>
            </div>

            {/* Cover image */}
            {project.image && (
              <img
                src={project.image}
                alt={project.title}
                className="w-full rounded-lg shadow-lg max-h-96 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4">
              {project.github && (
                <Button asChild>
                  <a href={project.github} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    View Code
                  </a>
                </Button>
              )}
              {project.demo && (
                <Button asChild variant="outline">
                  <a href={project.demo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Live Demo
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate(`/projects/${id}/live`)}>
                <Terminal className="mr-2 h-4 w-4" />
                Run Live
              </Button>
            </div>

            {/* Team */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: project.team?.lead, role: "Lead" },
                    { name: project.team?.designer, role: "Designer" },
                  ].filter(m => m.name).map((member, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarFallback>{member.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
            <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetail;
