import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

import mentorImg from "@/assets/mentor.jpg";

const MentorSpotlight = () => {
    return (
        <section className="py-24 px-4 bg-primary/5">
            <div className="container mx-auto max-w-5xl">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-heading font-light tracking-wider text-foreground">
                        Club Mentor
                    </h2>
                    <p className="text-sm font-light text-foreground/50 tracking-[0.2em] uppercase">
                        Guiding the Vision
                    </p>
                </div>

                <Card className="glass border-0 overflow-hidden group max-w-4xl mx-auto shadow-2xl">
                    <CardContent className="p-0 flex flex-col md:flex-row items-center">
                        {/* Image Section with transition */}
                        <div className="w-full md:w-2/5 h-[400px] relative overflow-hidden">
                            <img
                                src={mentorImg}
                                alt="Dr. Sandeep Singh Negi"
                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-700" />
                        </div>

                        {/* Content Section */}
                        <div className="p-10 md:p-14 md:w-3/5 space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-2xl md:text-3xl font-heading font-light tracking-wide text-foreground">
                                    Dr. Sandeep Singh Negi
                                </h3>
                                <p className="text-primary font-normal tracking-[0.1em] uppercase text-sm">
                                    Founding Visionary & Academic Coordinator
                                </p>
                            </div>

                            <div className="relative pt-6 pl-8 border-l-2 border-primary/20">
                                <Quote className="absolute -top-2 -left-4 w-10 h-10 text-primary/20 -rotate-12" />
                                <p className="text-lg md:text-xl font-light italic leading-relaxed text-foreground/85 relative z-10">
                                    "Our mission is to empower the next generation of innovators in Uttarakhand,
                                    bridging the gap between academic excellence and real-world impact."
                                </p>
                                <div className="mt-6 font-heading text-sm tracking-widest uppercase opacity-40 italic">
                                    — Founding Philosophy
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
};

export default MentorSpotlight;
