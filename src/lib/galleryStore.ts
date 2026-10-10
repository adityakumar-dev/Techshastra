/**
 * Represents an image entry in the TECHSHASTRA gallery.
 */
export interface GalleryImage {
    id: string;          // Unique identifier for the image
    title: string;       // Public title or caption
    description: string | null; // Optional detailed description
    image_url: string;   // URL or base64 data for the image
    created_at: number;   // Unix timestamp for sorting
}

const STORAGE_KEY = "techshastra_gallery_images";

/**
 * DEMO DATA: Hardcoded gallery images used for initial demonstration.
 * Feel free to remove or replace these in your final application.
 */
export const sampleGalleryImages: GalleryImage[] = [
    {
        id: "gallery-1",
        title: "Project Exhibition",
        description: "Showcasing technical excellence and innovation.",
        image_url: "/gallery/DSC_0004.JPG",
        created_at: 1735689600000,
    },
    {
        id: "gallery-2",
        title: "Workshop Session",
        description: "Hands-on learning and collaborative problem solving.",
        image_url: "/gallery/DSC_0006.JPG",
        created_at: 1736985600000,
    },
    {
        id: "gallery-3",
        title: "Team Collaboration",
        description: "Focus and dedication in the tech lab.",
        image_url: "/gallery/DSC_0013.JPG",
        created_at: 1738281600000,
    },
    {
        id: "gallery-4",
        title: "Innovation Showcase",
        description: "Exploring new horizons in technology.",
        image_url: "/gallery/DSC_0017.JPG",
        created_at: 1738540800000,
    },
    {
        id: "gallery-5",
        title: "Technical Brainstorming",
        description: "Engaging discussions on complex technical challenges.",
        image_url: "/gallery/DSC_0018.JPG",
        created_at: 1738800000000,
    },
    {
        id: "gallery-6",
        title: "Lab Experiments",
        description: "Deep dive into research and development.",
        image_url: "/gallery/DSC_0024.JPG",
        created_at: 1739059200000,
    },
    {
        id: "gallery-7",
        title: "Prototype Testing",
        description: "Validating ideas through rigorous testing.",
        image_url: "/gallery/DSC_0027.JPG",
        created_at: 1739318400000,
    },
    {
        id: "gallery-8",
        title: "System Integration",
        description: "Bringing different components together for a unified solution.",
        image_url: "/gallery/DSC_0034.JPG",
        created_at: 1739577600000,
    },
    {
        id: "gallery-9",
        title: "Hardware Development",
        description: "Designing and building custom hardware solutions.",
        image_url: "/gallery/DSC_0040.JPG",
        created_at: 1739836800000,
    },
    {
        id: "gallery-10",
        title: "Software Architecture",
        description: "Crafting scalable and robust software systems.",
        image_url: "/gallery/DSC_0043.JPG",
        created_at: 1739923200000,
    },
    {
        id: "gallery-11",
        title: "Flagship Event",
        description: "Moments from our most significant technical gatherings.",
        image_url: "/gallery/DSC_0046.JPG",
        created_at: 1740009600000,
    },
    {
        id: "gallery-12",
        title: "Tech Talks",
        description: "Sharing knowledge and insights with the community.",
        image_url: "/gallery/DSCN0992.JPG",
        created_at: 1740096000000,
    },
    {
        id: "gallery-13",
        title: "Mentorship Session",
        description: "Guiding the next generation of tech leaders.",
        image_url: "/gallery/DSCN0994.JPG",
        created_at: 1740182400000,
    },
    {
        id: "gallery-14",
        title: "Collaboration Hub",
        description: "Where creativity meets technical expertise.",
        image_url: "/gallery/DSCN1004.JPG",
        created_at: 1740268800000,
    },
    {
        id: "gallery-15",
        title: "Project Milestone",
        description: "Celebrating key achievements in our journey.",
        image_url: "/gallery/DSCN1007.JPG",
        created_at: 1740355200000,
    },
    {
        id: "gallery-16",
        title: "Community Outreach",
        description: "Engaging with the broader tech ecosystem.",
        image_url: "/gallery/DSCN1064.JPG",
        created_at: 1740441600000,
    },
    {
        id: "gallery-17",
        title: "Future Innovations",
        description: "Glimpse into what's next for TECHSHASTRA.",
        image_url: "/gallery/DSCN1107.JPG",
        created_at: 1740528000000,
    },
    {
        id: "gallery-18",
        title: "Closing Ceremony",
        description: "Reflecting on success and looking forward.",
        image_url: "/gallery/DSCN1110.JPG",
        created_at: 1740614400000,
    }
];

const generateId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getStoredGalleryImages = (): GalleryImage[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * Retrieves all gallery images, including locally stored ones and demo data.
 * @returns Array of gallery images sorted newest first
 */
export const getAllGalleryImages = (): GalleryImage[] => {
    const stored = getStoredGalleryImages();
    // In production, you might want to remove sampleGalleryImages
    return [...stored, ...sampleGalleryImages].sort((a, b) => b.created_at - a.created_at);
};

export const addGalleryImage = (image: Omit<GalleryImage, "id" | "created_at">): GalleryImage => {
    const images = getStoredGalleryImages();
    const newImage: GalleryImage = {
        ...image,
        id: generateId(),
        created_at: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newImage, ...images]));
    } catch (e) {
        console.error("Gallery storage failed", e);
        throw e;
    }

    return newImage;
};

export const deleteGalleryImage = (id: string) => {
    const images = getStoredGalleryImages();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(images.filter(img => img.id !== id)));
};
