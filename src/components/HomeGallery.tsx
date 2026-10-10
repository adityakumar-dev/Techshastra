import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getAllGalleryImages } from "@/lib/galleryStore";
import { getGalleryPhotos } from "@/lib/services/galleryService";
import { ArrowRight, ExternalLink } from "lucide-react";

const HomeGallery = () => {
    const [images, setImages] = useState<any[]>(() => getAllGalleryImages().slice(0, 6));

    useEffect(() => {
        getGalleryPhotos()
            .then(photos => {
                if (photos && photos.length > 0) {
                    setImages(photos.slice(0, 6));
                }
            })
            .catch(() => {});
    }, []);

    return (
        <section className="py-24 bg-gradient-to-b from-background to-primary/5">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Moments Captured
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            A glimpse into the life at TECHSHASTRA — from high-stakes hackathons to collaborative learning sessions.
                        </p>
                    </div>
                    <Link to="/gallery">
                        <Button size="lg" className="rounded-full group shadow-lg shadow-primary/20">
                            Explore Full Gallery
                            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className={`group relative overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 ${index % 2 === 0 ? "aspect-[3/4]" : "aspect-[3/4] md:translate-y-8"
                                }`}
                            onClick={() => window.open('/gallery', '_blank')}
                        >
                            <img
                                src={image.image_url}
                                alt={image.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                <p className="text-white text-xs font-bold uppercase tracking-wider mb-1">TECHSHASTRA</p>
                                <p className="text-white text-sm font-medium leading-tight">{image.title}</p>
                                <div className="mt-2 text-white/60">
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center md:hidden">
                    <Link to="/gallery">
                        <Button variant="outline" className="rounded-full">
                            View All 20+ Photos
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default HomeGallery;
