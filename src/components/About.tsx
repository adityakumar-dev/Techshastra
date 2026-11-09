import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Target, Eye, Sparkles, Layers, Users, Rocket, Move3d } from "lucide-react";
import EarthGlobe from "@/components/EarthGlobe";

/* ─── 3D Earth Globe with Orbital Constellation & Telemetry ─────────────── */
function GlobeVisualSection() {
  return (
    <div className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[440px] md:max-w-[500px] aspect-square mx-auto flex items-center justify-center select-none">
      {/* ── 1. Atmospheric Ambient Glow (blends with page background) ── */}
      <div
        className="absolute inset-4 rounded-full -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.18) 0%, rgba(3, 105, 161, 0.10) 45%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute inset-12 rounded-full -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.12) 0%, transparent 65%)",
          filter: "blur(32px)",
        }}
      />

      {/* ── 2. The Interactive 3D WebGL Globe ── */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <EarthGlobe className="w-full h-full" />
      </div>

      {/* ── 3. Floating Telemetry Badges Framing the Globe ── */}
      
      {/* Badge 1: 15+ Domains (Top-Left) */}
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05, y: -8 }}
        className="absolute top-[2%] left-[1%] xs:left-[2%] sm:left-[3%] z-20 pointer-events-auto"
      >
        <div
          className="group px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-2.5 sm:gap-3 transition-all duration-300 bg-white/75 dark:bg-card/75 backdrop-blur-2xl border border-white/60 dark:border-white/15 shadow-[0_12px_28px_-6px_rgba(42,15,20,0.12)] dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)]"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0 shadow-inner">
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-medium text-xs sm:text-sm text-foreground tracking-tight">
                15+
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8] animate-pulse" />
            </div>
            <span className="text-[8px] sm:text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-foreground/50">
              Domains
            </span>
          </div>
        </div>
      </motion.div>

      {/* Badge 2: 50+ Launches (Mid-Right) */}
      <motion.div
        animate={{
          y: [0, 6, 0],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        whileHover={{ scale: 1.05, y: 4 }}
        className="absolute top-[26%] right-[0%] sm:right-[1%] z-20 pointer-events-auto"
      >
        <div
          className="group px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-2.5 sm:gap-3 transition-all duration-300 bg-white/75 dark:bg-card/75 backdrop-blur-2xl border border-white/60 dark:border-white/15 shadow-[0_12px_28px_-6px_rgba(42,15,20,0.12)] dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)]"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
            <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-medium text-xs sm:text-sm text-foreground tracking-tight">
                50+
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse" />
            </div>
            <span className="text-[8px] sm:text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-foreground/50">
              Launches
            </span>
          </div>
        </div>
      </motion.div>

      {/* Badge 3: 500+ Innovators (Bottom-Right) */}
      <motion.div
        animate={{
          y: [0, -5, 0],
        }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        whileHover={{ scale: 1.05, y: -7 }}
        className="absolute bottom-[2%] right-[4%] xs:right-[6%] sm:right-[10%] z-20 pointer-events-auto"
      >
        <div
          className="group px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-2.5 sm:gap-3 transition-all duration-300 bg-white/75 dark:bg-card/75 backdrop-blur-2xl border border-white/60 dark:border-white/15 shadow-[0_12px_28px_-6px_rgba(42,15,20,0.12)] dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.5)]"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-medium text-xs sm:text-sm text-foreground tracking-tight">
                500+
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary))] animate-pulse" />
            </div>
            <span className="text-[8px] sm:text-[9px] font-sans font-medium uppercase tracking-[0.18em] text-foreground/50">
              Innovators
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── 4. Interactive Drag Hint ── */}
      <div className="absolute -bottom-7 sm:-bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/[0.04] border border-foreground/[0.08] backdrop-blur-sm">
          <Move3d className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-foreground/50 font-mono">
            Drag to Rotate • Global Network
          </span>
        </div>
      </div>
    </div>
  );
}
/* ─────────────────────────────────────────────────────────────────────────── */

const About = () => {
  return (
    <section id="about" className="py-16 sm:py-24 px-4 bg-background overflow-hidden border-t border-foreground/5 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 sm:space-y-12 text-center lg:text-left"
          >
            <div className="space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-0 text-[10px] tracking-[0.2em] uppercase text-primary font-medium">
                Est. 2023 • UTU Dehradun
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-heading font-light tracking-tight leading-tight">
                Architecting the <br />
                <span className="text-primary italic">Future of Tech</span>
              </h2>
              <p className="text-base sm:text-lg font-light text-foreground/50 leading-relaxed italic max-w-2xl mx-auto lg:mx-0">
                "Bridging the gap between academic theory and industry dominance under the guidance of Dr. Sandeep Singh Negi."
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 sm:gap-10 text-left">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-xs sm:text-sm font-heading tracking-widest uppercase">Our Mission</h3>
                </div>
                <p className="text-xs sm:text-sm font-light text-foreground/40 leading-relaxed">
                  To empower students by providing a high-octane environment for technical research,
                  product development, and entrepreneurial growth.
                </p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-primary" />
                  <h3 className="text-xs sm:text-sm font-heading tracking-widest uppercase">Our Vision</h3>
                </div>
                <p className="text-xs sm:text-sm font-light text-foreground/40 leading-relaxed">
                  To build a self-sustaining ecosystem that produces the next generation of global
                  tech leaders and innovators from Uttarakhand.
                </p>
              </div>
            </div>

            <div className="pt-6 sm:pt-8 grid grid-cols-3 gap-4 sm:gap-8 border-t border-foreground/5">
              <div>
                <p className="text-xl sm:text-2xl font-heading text-foreground">15+</p>
                <p className="text-[8px] sm:text-[10px] tracking-widest uppercase text-foreground/30">Domains</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-heading text-foreground">500+</p>
                <p className="text-[8px] sm:text-[10px] tracking-widest uppercase text-foreground/30">Innovators</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-heading text-foreground">50+</p>
                <p className="text-[8px] sm:text-[10px] tracking-widest uppercase text-foreground/30">Deployments</p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                className="rounded-full px-8 glass border-primary/20 hover:bg-primary hover:text-primary-foreground group transition-all duration-500 w-full sm:w-auto"
                asChild
              >
                <a href="/about" className="flex items-center gap-2 justify-center">
                  Learn More About Us
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </a>
              </Button>
            </div>
          </motion.div>

          {/* Visual — 3D Earth Globe with Orbital Constellation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center py-4 sm:py-10"
          >
            <GlobeVisualSection />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
