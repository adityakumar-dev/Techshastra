import { Card, CardContent } from "@/components/ui/card";
import {
  Brain, Code, Shield, Cpu, Bot, Smartphone, Cloud, TrendingUp, Database
} from "lucide-react";

const domainGroups = [
  {
    category: "Core Technology",
    items: [
      { icon: Brain, title: "AI & Machine Learning", description: "Explore cutting-edge artificial intelligence and ML technologies", featured: true },
      { icon: Code, title: "Web Development", description: "Build modern, responsive web applications and platforms", featured: true },
      { icon: Smartphone, title: "App Development", description: "Develop mobile applications for iOS and Android", featured: true },
    ]
  },
  {
    category: "Systems & Infrastructure",
    items: [
      { icon: Shield, title: "Cybersecurity", description: "Learn ethical hacking and security best practices" },
      { icon: Cpu, title: "IoT & Embedded", description: "Connect devices and physical environments" },
      { icon: Cloud, title: "Cloud & DevOps", description: "Master infrastructure and deployment" },
      { icon: Database, title: "Data Science", description: "Extract value from complex data systems" },
      { icon: Bot, title: "Robotics", description: "Design intelligent mechanical systems" },
    ]
  },
  {
    category: "Growth & Ecosystem",
    items: [
      { icon: TrendingUp, title: "Entrepreneurship", description: "Transform ideas into successful startup ventures", fullWidth: true },
    ]
  }
];

const Domains = () => {
  return (
    <section id="domains" className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-3xl md:text-5xl font-heading font-light tracking-wider text-foreground">
            How We Operate
          </h2>
          <p className="text-base font-light text-foreground/50 max-w-2xl mx-auto tracking-wide">
            From core technology to entrepreneurial growth — our focused domains of excellence
          </p>
        </div>

        {/* Groups */}
        <div className="space-y-20">
          {domainGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-8">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] tracking-[0.4em] uppercase text-primary/50 font-medium whitespace-nowrap">
                  {group.category}
                </h3>
                <div className="h-px w-full bg-foreground/5" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((domain, index) => {
                  const Icon = domain.icon;
                  return (
                    <Card
                      key={index}
                      className={`glass rounded-bento border-0 transition-all duration-500 group ${domain.featured ? 'hover:scale-[1.03] hover:shadow-2xl hover:bg-card/20' : 'hover:scale-[1.01] hover:bg-card/10'
                        } ${domain.fullWidth ? 'lg:col-span-3' : ''}`}
                    >
                      <CardContent className={`p-8 space-y-5 ${domain.fullWidth ? 'flex items-center gap-8 space-y-0' : ''}`}>
                        <div className={`w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-500 shrink-0 ${domain.featured ? 'bg-primary/12' : ''}`}>
                          <Icon className={`w-6 h-6 text-foreground/30 group-hover:text-primary transition-colors duration-500 ${domain.featured ? 'text-primary/60' : ''}`} />
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-base font-heading font-light tracking-wider group-hover:text-primary transition-colors">{domain.title}</h4>
                          <p className="text-sm font-light text-foreground/45 leading-relaxed">
                            {domain.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Domains;
