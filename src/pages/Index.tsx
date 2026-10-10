/**
 * Index Page
 * 
 * The main landing page of the TECHSHASTRA website.
 * It assembles various sections like Hero, About, Domains, Team, etc.
 * to provide a comprehensive overview of the club.
 */
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import UtuSlider from "@/components/UtuSlider";
import About from "@/components/About";
import Dignitaries from "@/components/Dignitaries";
import MentorSpotlight from "@/components/MentorSpotlight";
import Domains from "@/components/Domains";
import Team from "@/components/Team";
import HomeGallery from "@/components/HomeGallery";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* UTU building — fixed to bottom, full natural size, behind all content */}
      <div className="fixed bottom-0 left-0 right-0 z-0 pointer-events-none flex justify-center">
        <img
          src="/utu-building.png"
          alt=""
          aria-hidden="true"
          className="w-full opacity-50"
          style={{ display: "block" }}
        />
      </div>
      <div className="relative z-10">
        <Hero />
        <UtuSlider />
        <About />
        <Dignitaries />
        <MentorSpotlight />
        <Domains />
        <Team />
        <HomeGallery />
        <Contact />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
