import { useState, useEffect } from "react";
import { getAchievements as getLocalAchievements } from "@/lib/stores/achievementStore";
import { getAchievements as getRemoteAchievements } from "@/lib/services/achievementService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { format } from "date-fns";

interface Achievement {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  date: string;
}

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const remote = await getRemoteAchievements();
      if (remote && remote.length > 0) {
        setAchievements(remote.map((r: any) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          image_url: r.image_url,
          date: r.achievement_date || r.date || new Date().toISOString(),
        })));
        setLoading(false);
        return;
      }
    } catch (_e) {}
    try {
      const data = await getLocalAchievements();
      setAchievements(data);
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const icons = [Trophy, Medal, Award];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Our Achievements
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Celebrating our milestones, awards, and accomplishments
          </p>
        </div>

        {loading ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-8 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No achievements to display yet.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {achievements.map((achievement, index) => {
              const Icon = icons[index % icons.length];
              return (
                <Card key={achievement.id} className="hover-scale border-2 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{achievement.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(achievement.date), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {achievement.image_url && (
                      <img
                        src={achievement.image_url}
                        alt={achievement.title}
                        className="w-full rounded-lg mb-4"
                      />
                    )}
                    <p className="text-muted-foreground">{achievement.description}</p>
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

export default Achievements;