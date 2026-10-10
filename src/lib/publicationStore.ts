export type PublicationType = "paper" | "book";

/**
 * Represents a publication (research paper or book) in the TECHSHASTRA archive.
 */
export interface Publication {
    id: string;          // Unique identifier for the publication
    title: string;       // Public title of the work
    authors: string;     // List of authors (comma separated)
    description: string; // Brief abstract or summary
    type: PublicationType; // "paper" or "book"
    file_url?: string;    // Optional URL to the full PDF or document
    link_url?: string;    // Optional external link (e.g., arXiv, IEEE)
    published_at: number; // Unix timestamp of publication
}

const STORAGE_KEY = "techshastra_publications";

/**
 * DEMO DATA: Hardcoded publications used for initial demonstration.
 * Feel free to remove or replace these in your final application.
 */
export const samplePublications: Publication[] = [
    /*
    {
        id: "pub-sample-1",
        title: "Advancements in Decentralized AI Systems",
        authors: "Akhilesh Raje, Pratyush Shrivastava",
        description: "A comprehensive study on the integration of blockchain technology with distributed artificial intelligence for enhanced security and privacy.",
        type: "paper",
        link_url: "https://arxiv.org/abs/2103.00020", // Sample link
        published_at: 1738281600000,
    },
    {
        id: "pub-sample-2",
        title: "The IoT Architect's Handbook",
        authors: "Amitesh Kumar",
        description: "A deep dive into industrial IoT architectures, protocol stacks, and edge computing paradigms for modern engineers.",
        type: "book",
        link_url: "https://www.google.co.in/books/edition/Internet_of_Things/66YvEAAAQBAJ", // Sample link
        published_at: 1735689600000,
    },
    {
        id: "pub-sample-3",
        title: "Low-Power Communication in Rural Networks",
        authors: "TECHSHASTRA Research Wing",
        description: "Experimental results from deploying LoRaWAN gateways in high-altitude terrain for environmental monitoring.",
        type: "paper",
        link_url: "https://ieeexplore.ieee.org/document/8761332", // Sample link
        published_at: 1739577600000,
    }
    */
];

const generateId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const getStoredPublications = (): Publication[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * Retrieves all publications, including locally stored ones and demo data.
 * @returns Array of publications sorted by date (newest first)
 */
export const getAllPublications = (): Publication[] => {
    const stored = getStoredPublications();
    // In production, you might want to remove samplePublications
    return [...stored, ...samplePublications].sort((a, b) => b.published_at - a.published_at);
};

export const addPublication = (pub: Omit<Publication, "id" | "published_at">): Publication => {
    const pubs = getStoredPublications();
    const newPub: Publication = {
        ...pub,
        id: generateId(),
        published_at: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newPub, ...pubs]));
    } catch (e) {
        console.error("Publication storage failed", e);
        throw e;
    }

    return newPub;
};

export const deletePublication = (id: string) => {
    const pubs = getStoredPublications();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pubs.filter(p => p.id !== id)));
};
