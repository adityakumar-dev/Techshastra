import { Linkedin, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative border-t border-foreground/5 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/favicon.ico" alt="TECHSHASTRA Logo" className="w-8 h-8 object-contain" />
              <span className="font-heading text-lg tracking-[0.15em] font-light text-foreground">
                TECHSHASTRA
              </span>
            </div>
            <p className="text-sm font-light text-foreground/35 leading-relaxed">
              Innovate · Create · Dominate<br />
              The official technical club of UTU Dehradun.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-light tracking-widest uppercase text-foreground/30 mb-5">Quick Links</h3>
            <ul className="space-y-3 text-sm font-light">
              <li><Link to="/about" className="text-foreground/40 hover:text-foreground transition-colors duration-300">About Us</Link></li>
              <li><Link to="/projects" className="text-foreground/40 hover:text-foreground transition-colors duration-300">Projects</Link></li>
              <li><Link to="/events" className="text-foreground/40 hover:text-foreground transition-colors duration-300">Events</Link></li>
              <li><a href="/#team" className="text-foreground/40 hover:text-foreground transition-colors duration-300">Team</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-light tracking-widest uppercase text-foreground/30 mb-5">Connect</h3>
            <div className="space-y-2 text-sm font-light text-foreground/35 mb-5">
              <p>Uttarakhand Technical University</p>
              <p>Dehradun, Uttarakhand</p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.linkedin.com/company/tech-shastra/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center hover:bg-primary/15 transition-colors duration-500"
              >
                <Linkedin className="w-4 h-4 text-foreground/30" />
              </a>
              <a
                href="https://www.instagram.com/techshastra_utu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center hover:bg-primary/15 transition-colors duration-500"
              >
                <Instagram className="w-4 h-4 text-foreground/30" />
              </a>
              <a
                href="mailto:vmsb.utu.ddn.2023@gmail.com"
                className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center hover:bg-primary/15 transition-colors duration-500"
              >
                <Mail className="w-4 h-4 text-foreground/30" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-foreground/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-light text-foreground/40 text-center md:text-left">
          <p className="text-foreground/30">
            &copy; {new Date().getFullYear()} TECHSHASTRA · Uttarakhand Technical University.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/privacy" className="hover:text-primary transition-colors duration-300">
              Privacy Policy
            </Link>
            <span className="text-foreground/15">·</span>
            <Link to="/terms" className="hover:text-primary transition-colors duration-300">
              Terms of Service
            </Link>
            <span className="text-foreground/15">·</span>
            <span className="text-[10px] uppercase tracking-widest text-primary/70 bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              DPDP Act Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
