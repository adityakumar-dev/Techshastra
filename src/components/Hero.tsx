import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import heroBg from "@/assets/hero-bg.jpg";
import heroBgLight from "@/assets/hero-bg-light.jpg";

const Hero = () => {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          backgroundImage: `url(${isDark ? heroBg : heroBgLight})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background dark:from-background/80 dark:via-background/60"></div>
      </div>

      {/* Subtle ambient shapes */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-secondary/15 blur-[120px] animate-float animate-soft-pulse" />
        <div className="absolute -bottom-24 -right-24 w-[560px] h-[560px] rounded-full bg-accent/10 blur-[140px] animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Subtle tag */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass text-[10px] sm:text-xs font-sans font-normal tracking-[0.2em] uppercase text-foreground/80">
            Uttarakhand Technical University, Dehradun
          </div>

          {/* Main Heading */}
          <h1 className="font-heading font-light tracking-[0.1em] sm:tracking-[0.15em] leading-[1.1] text-foreground">
            <span className="block text-4xl sm:text-7xl md:text-8xl lg:text-9xl">
              TECHSHASTRA
            </span>
          </h1>

          {/* Tagline */}
          <p className="font-heading text-sm sm:text-lg md:text-2xl font-light tracking-[0.2em] sm:tracking-[0.25em] uppercase text-foreground/70">
            Innovate · Create · Dominate
          </p>

          {/* Description & CTAs wrapped in a glass plate */}
          <div className="relative p-6 sm:p-10 md:p-14 rounded-[2rem] sm:rounded-[3rem] glass border-0 bg-background/5 backdrop-blur-xl max-w-3xl mx-auto space-y-6 sm:space-y-8">
            {/* Description */}
            <p className="font-sans text-sm md:text-base font-light leading-relaxed text-foreground/75 mx-auto">
              The official technical and entrepreneurship club of UTU fostering innovation,
              collaboration, and leadership among students across the Uttarakhand ecosystem.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              <Link to="/join">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-8 sm:px-12 py-6 sm:py-7 font-sans font-light text-xs sm:text-sm tracking-[0.1em] bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-500 shadow-xl"
                >
                  Join Our Community
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/projects" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 sm:px-12 py-6 sm:py-7 font-sans font-light text-xs sm:text-sm tracking-[0.1em] border border-foreground/20 bg-card/10 backdrop-blur-md hover:bg-card/40 text-foreground/80 hover:text-foreground transition-all duration-500"
                >
                  Explore Projects
                </Button>
              </Link>
            </div>

            {/* Narrative Stats Row */}
            <div className="pt-6 sm:pt-8 border-t border-foreground/5">
              <p className="font-sans text-[8px] sm:text-xs font-normal tracking-[0.15em] sm:tracking-[0.2em] uppercase text-foreground/50">
                Trusted by <span className="text-foreground font-medium">500+ members</span> across <span className="text-foreground font-medium">50+ projects</span> since <span className="text-foreground font-medium">2023</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border border-foreground/20 rounded-full p-1.5 backdrop-blur-sm">
          <div className="w-1.5 h-3 bg-foreground/30 rounded-full mx-auto animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
