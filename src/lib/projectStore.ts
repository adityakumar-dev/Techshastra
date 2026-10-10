/** 
 * Represents the team members associated with a project.
 */
export interface Team {
    lead: string;    // Name of the project lead
    designer: string; // Name of the UI/UX designer
}

/**
 * Represents a project entry in the TECHSHASTRA showcase.
 */
export interface Project {
    id: string;          // Unique identifier for the project
    title: string;       // Public title of the project
    description: string; // Brief summary of the project goals
    image?: string;      // Optional URL for the project thumbnail
    tags: string[];      // Array of technologies or domains (e.g., IoT, AI)
    team: Team;          // Lead and designer info
    github: string;      // Link to the source code repository
    demo?: string;       // Optional link to a live demonstration
    status: "Completed" | "In Progress"; // Current development stage
    language: "javascript" | "python" | "other"; // Primary execution environment
    createdAt: number;   // Timestamp of project creation
}

const STORAGE_KEY = "techshastra_projects";

// Fallback for crypto.randomUUID() in non-secure contexts or older browsers
const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * DEMO DATA: Hardcoded projects used for initial demonstration.
 * Feel free to remove or replace these in your final application.
 */
export const hardcodedProjects: Project[] = [
    /*
    {
        id: "smart-campus",
        title: "Smart Campus System",
        description: "IoT-based attendance and campus management system with real-time tracking and analytics.",
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
        tags: ["IoT", "React", "Node.js", "MongoDB"],
        team: { lead: "Akhilesh Raje", designer: "Amitesh Kumar" },
        github: "https://github.com/stackblitz/stackblitz-js-sdk", // Placeholder for actual repo
        status: "Completed",
        language: "other",
        createdAt: 0
    },
    {
        id: "ai-assistant",
        title: "AI Study Assistant",
        description: "Machine learning powered chatbot to help students with course materials and doubt solving.",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        tags: ["AI/ML", "Python", "TensorFlow", "FastAPI"],
        team: { lead: "Pratyush Shrivastava", designer: "Design Team Alpha" },
        github: "https://github.com/stackblitz/stackblitz-js-sdk", // Placeholder
        status: "In Progress",
        language: "python",
        createdAt: 0
    },
    {
        id: "cybershield",
        title: "CyberShield Platform",
        description: "Educational cybersecurity training platform with interactive challenges and CTF competitions.",
        image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
        tags: ["Cybersecurity", "React", "Docker", "PostgreSQL"],
        team: { lead: "Lead Sec Specialist", designer: "UI/UX Board" },
        github: "https://github.com/stackblitz/stackblitz-js-sdk", // Placeholder
        status: "Completed",
        language: "other",
        createdAt: 0
    }
    */
];

export const getStoredProjects = (): Project[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

/**
 * Retrieves all projects, including locally stored ones and demo data.
 * @returns Array of projects
 */
export const getAllProjects = (): Project[] => {
    const stored = getStoredProjects();
    // In production, you might want to remove hardcodedProjects
    return [...stored, ...hardcodedProjects];
};

export const getProject = (id: string): Project | null => {
    const projects = getAllProjects();
    return projects.find(p => p.id === id) || null;
};

export const addProject = (project: Omit<Project, "id" | "createdAt">): Project => {
    const projects = getStoredProjects();
    const newProject: Project = {
        ...project,
        id: generateId(),
        createdAt: Date.now(),
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newProject, ...projects]));
    } catch (e) {
        console.error("Storage failed", e);
        throw e; // Rethrow to be handled by the UI
    }

    return newProject;
};

export const deleteProject = (id: string) => {
    const projects = getStoredProjects();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.filter(p => p.id !== id)));
};

export const parseGitHubUrl = (url: string) => {
    try {
        const cleanUrl = url.replace(/\/$/, "");
        const parts = cleanUrl.split("/");
        if (parts.length >= 2) {
            return {
                owner: parts[parts.length - 2],
                repo: parts[parts.length - 1],
            };
        }
    } catch (e) {
        console.error("Invalid GitHub URL", e);
    }
    return null;
};
