import { useState, useEffect } from "react";
import { getResources as getLocalResources } from "@/lib/stores/resourceStore";
import { getResources as getRemoteResources } from "@/lib/services/resourceService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Code, Video, FileText } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  difficulty: string | null;
}

const categoryIcons: Record<string, any> = {
  tutorial: BookOpen,
  documentation: FileText,
  video: Video,
  tool: Code,
};

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const remote = await getRemoteResources();
      if (remote && remote.length > 0) {
        setResources(remote.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          url: r.url,
          category: r.category || "General",
          difficulty: r.difficulty || null,
        })));
        setLoading(false);
        return;
      }
    } catch (_e) {}
    try {
      const data = await getLocalResources();
      setResources(data);
    } catch (_err) {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(resources.map(r => r.category))];
  const filteredResources = selectedCategory === "all" 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);

  const difficultyColors: Record<string, string> = {
    beginner: "bg-green-500/10 text-green-500",
    intermediate: "bg-yellow-500/10 text-yellow-500",
    advanced: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Learning Resources
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Curated tutorials, documentation, and tools to help you learn and grow
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No resources available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => {
              const Icon = categoryIcons[resource.category] || BookOpen;
              return (
                <Card key={resource.id} className="hover-scale border-2 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="w-8 h-8 text-primary" />
                      {resource.difficulty && (
                        <Badge className={difficultyColors[resource.difficulty] || ""}>
                          {resource.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{resource.title}</CardTitle>
                    <Badge variant="outline" className="w-fit capitalize">
                      {resource.category}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{resource.description}</CardDescription>
                    <Button asChild className="w-full">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Resource
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Resources;