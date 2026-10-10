import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Eye, Zap, Cpu, Sparkles } from "lucide-react";
import logoFull from "@/assets/logo-full.png";

const About = () => {
  return (
    <section id="about" className="py-16 sm:py-24 px-4 bg-background overflow-hidden border-t border-foreground/5">
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

          {/* Visual Content */}
          <div className="relative flex items-center justify-center py-8 sm:py-12">
            {/* Outer Rotating Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute w-[105%] h-[105%] sm:w-[110%] sm:h-[110%] rounded-full border border-dashed border-primary/10"
            />

            {/* Main Visual Container */}
            <div className="relative w-full aspect-square max-w-[320px] sm:max-w-[400px] md:max-w-[500px]">
              {/* Central Glass Circle */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="absolute inset-0 glass rounded-full border-0 flex items-center justify-center p-6 sm:p-8 z-10 shadow-2xl"
              >
                {/* Inner Rings (Static for readability) */}
                <div className="w-full h-full rounded-full border border-primary/20 flex items-center justify-center p-6 sm:p-8">
                  <div className="w-full h-full rounded-full border border-primary/40 flex items-center justify-center p-2 sm:p-4">
                    <img
                      src={logoFull}
                      alt="TechShastra Logo"
                      className="w-32 h-32 sm:w-48 sm:h-48 object-contain drop-shadow-2xl"
                    />
                  </div>
                </div>

                {/* Floating Orbital Data Cards */}
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-0 left-0 w-16 h-16 sm:w-20 sm:h-20 glass rounded-2xl flex flex-col items-center justify-center -translate-x-1/4 -translate-y-1/4 shadow-lg border-primary/10"
                >
                  <span className="text-xs sm:text-sm font-heading font-medium text-primary">15+</span>
                  <span className="text-[6px] sm:text-[8px] tracking-widest uppercase text-foreground/40">Domains</span>
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 15, 0],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 glass rounded-2xl flex flex-col items-center justify-center translate-x-1/4 translate-y-1/4 shadow-lg border-primary/10"
                >
                  <span className="text-sm sm:text-base font-heading font-medium text-primary">500+</span>
                  <span className="text-[6px] sm:text-[8px] tracking-widest uppercase text-foreground/40">Innovators</span>
                </motion.div>

                <motion.div
                  animate={{
                    x: [0, 10, 0],
                    y: [0, -10, 0]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                  className="absolute top-1/2 -right-6 sm:-right-10 w-16 h-16 sm:w-20 sm:h-20 glass rounded-2xl flex flex-col items-center justify-center shadow-lg border-primary/10"
                >
                  <span className="text-xs sm:text-sm font-heading font-medium text-primary">50+</span>
                  <span className="text-[6px] sm:text-[8px] tracking-widest uppercase text-foreground/40">Launch</span>
                </motion.div>

                {/* Semantic Label */}
                <div className="absolute -bottom-12 sm:-bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[8px] sm:text-[10px] tracking-[0.4em] uppercase text-foreground/30 font-light">
                    Innovation Core
                  </span>
                </div>
              </motion.div>

              {/* Multi-layered Pulsing Background Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-primary/10 rounded-full blur-[60px] sm:blur-[100px] -z-10"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-[10%] bg-accent/5 rounded-full blur-[50px] sm:blur-[80px] -z-10"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
