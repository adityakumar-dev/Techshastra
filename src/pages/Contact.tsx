/**
 * Contact Page
 * 
 * A wrapper page that renders the main Contact component.
 * Provides the overall layout for the contact informational section.
 */
import Navbar from "@/components/Navbar";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="pt-20">
                <Contact />
            </div>
            <Footer />
        </div>
    );
};

export default ContactPage;
