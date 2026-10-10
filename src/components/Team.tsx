import { Card, CardContent } from "@/components/ui/card";
import { Crown, Award, Users } from "lucide-react";

import akhileshImg from "@/assets/akhilesh.jpg";
import amiteshImg from "@/assets/amitesh.jpg";
import pratyushImg from "@/assets/pratyush.jpg";

const teamMembers = [
  {
    name: "Amitesh Kumar",
    role: "Vice-President",
    image: amiteshImg,
    description: "Operations, Event Management & Culture. Execution and internal orchestration.",
    accent: Users,
    special: "vp"
  },
  {
    name: "Akhilesh Raje",
    role: "President",
    image: akhileshImg,
    description: "Strategy, Architecture & Community Growth. Admin-level authority in system hierarchy.",
    accent: Crown,
    special: "president"
  },
  {
    name: "Pratyush Shrivastava",
    role: "Chief Technology Officer (CTO)",
    image: pratyushImg,
    description: "Technical Infrastructure & Innovation Lab. Architecture decisions and governance.",
    accent: Award,
    special: "cto"
  },
];

const Team = () => {
  return (
    <section id="team" className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-24 space-y-4">
          <h2 className="text-3xl md:text-5xl font-heading font-light tracking-wider text-foreground">
            Leadership
          </h2>
          <p className="text-base font-light text-foreground/50 max-w-2xl mx-auto tracking-wide">
            Meet the foundational pillars driving innovation and excellence
          </p>
        </div>

        {/* Team Grid - Focused 3-column layout */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => {
            const AccentIcon = member.accent;
            return (
              <Card
                key={index}
                className={`glass rounded-bento border-0 transition-all duration-500 group relative overflow-hidden ${member.special === 'president' ? 'shadow-shadow-elevated hover:scale-[1.04]' : 'hover:scale-[1.02]'
                  }`}
              >
                {/* Micro-differentiation accents */}
                <div className={`absolute top-0 right-0 p-4 transition-colors duration-500 ${member.special === 'president' ? 'text-primary' : 'text-foreground/10 group-hover:text-primary/40'
                  }`}>
                  <AccentIcon className="w-5 h-5" />
                </div>

                {member.special === 'cto' && (
                  <div className="absolute top-0 left-0 w-20 h-px bg-primary/20" />
                )}

                <CardContent className="p-8 text-center space-y-6">
                  <div className={`w-32 h-32 rounded-full overflow-hidden mx-auto ring-2 transition-all duration-500 ${member.special === 'president' ? 'ring-primary/40 group-hover:ring-primary' : 'ring-primary/10 group-hover:ring-primary/30'
                    }`}>
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-heading font-normal tracking-wide">{member.name}</h3>
                    <p className={`text-[10px] font-medium tracking-[0.25em] uppercase ${member.special === 'president' ? 'text-primary' : 'text-foreground/40'
                      }`}>{member.role}</p>
                    <p className="text-xs font-light text-foreground/40 leading-relaxed pt-2 px-2">
                      {member.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Team;
