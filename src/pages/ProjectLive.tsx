import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import sdk from "@stackblitz/sdk";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Github, Code2, Rocket } from "lucide-react";
import { getAllProjects, parseGitHubUrl } from "@/lib/projectStore";
import { getProjectById } from "@/lib/services/projectService";
import PythonRunner from "@/components/PythonRunner";

const ProjectLive = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
    const [isRunning, setIsRunning] = useState(false); // Start only when lite iframe loads
    const [showExtendPrompt, setShowExtendPrompt] = useState(false);
    const [embedError, setEmbedError] = useState<string | null>(null);
    const [isEmbedding, setIsEmbedding] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [previewMode, setPreviewMode] = useState<'lite' | 'full'>('lite'); // Start with lite for speed
    const [isStackBlitzCompatible, setIsStackBlitzCompatible] = useState(true); // Assume compatible until proven otherwise
    const containerRef = useRef<HTMLDivElement>(null);
    const embedInstanceRef = useRef<any>(null);

    // Timer countdown - only active in lite mode
    useEffect(() => {
        if (!isRunning || !project || previewMode === 'full') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setIsRunning(false);
                    setShowExtendPrompt(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isRunning, project, previewMode]);

    useEffect(() => {
        const loadProject = async () => {
            let p: any = null;
            if (id) {
                try {
                    const remote = await getProjectById(id);
                    if (remote) {
                        p = {
                            ...remote,
                            github: remote.github_url,
                            demo: remote.demo_url,
                        };
                    }
                } catch (_err) {}
            }
            if (!p) {
                p = getAllProjects().find(proj => proj.id === id);
            }
            if (!p) {
                navigate("/projects");
                return;
            }
            setProject(p);
            setLoading(false);

            if (p.language !== "python" && previewMode === 'full' && containerRef.current) {
                const gitInfo = parseGitHubUrl(p.github || p.github_url);
                if (gitInfo) {
                    console.log("Embedding StackBlitz:", gitInfo, "Mode:", previewMode);
                    setIsEmbedding(true);
                }
            }
        };

        loadProject();
    }, [id, previewMode, navigate]);

    // StackBlitz full-mode embed — runs after project state is set
    useEffect(() => {
        if (!project || previewMode !== 'full' || project.language === 'python' || !containerRef.current) return;
        const gitInfo = parseGitHubUrl(project.github || project.github_url);
        if (gitInfo) {
            setIsEmbedding(true);
            try {
                const instance = sdk.embedGithubProject(
                    containerRef.current,
                    `${gitInfo.owner}/${gitInfo.repo}`,
                    {
                        height: 600,
                        view: "preview",
                        hideExplorer: true,
                        hideNavigation: false,
                        theme: "dark",
                    }
                );
                embedInstanceRef.current = instance;
                console.log("StackBlitz embed successful");
                setIsEmbedding(false);
            } catch (error) {
                console.error("StackBlitz embed error:", error);
                setEmbedError("Failed to load preview. This repository may not be compatible with StackBlitz.");
                setIsStackBlitzCompatible(false);
                setIsEmbedding(false);
            }
        }
    }, [project, previewMode]);



    const handleExtend = () => {
        setTimeLeft(180); // Add another 3 minutes
        setIsRunning(true);
        setShowExtendPrompt(false);
    };

    const handleIframeLoad = () => {
        setIframeLoaded(true);
        if (previewMode === 'lite') {
            setIsRunning(true); // Start timer only when lite preview fully loads
        }
    };

    // Reset state when switching modes
    useEffect(() => {
        if (previewMode === 'full') {
            setIsRunning(false);
            setShowExtendPrompt(false);
        } else {
            setTimeLeft(180);
            setIframeLoaded(false);
            setIsRunning(false);
            setShowExtendPrompt(false);
        }
    }, [previewMode]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading || !project) return null;

    const gitInfo = parseGitHubUrl(project.github);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 py-24">
                {/* Navigation Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/projects")}
                            className="px-0 hover:bg-transparent text-foreground/50 hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            <span className="text-xs uppercase tracking-widest font-light">Back to Showcase</span>
                        </Button>
                        <h1 className="text-3xl md:text-5xl font-heading font-light tracking-tight flex items-center gap-4">
                            {project.title}
                            <span className="inline-flex items-center px-4 py-1 rounded-full glass border-0 text-[10px] tracking-widest uppercase text-primary font-medium">
                                {project.language === 'python' ? 'Python Environment' : 'Live Runtime'}
                            </span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Preview Mode Toggle - Only show if StackBlitz compatible */}
                        {project.language !== 'python' && isStackBlitzCompatible && (
                            <div className="flex items-center gap-1 glass border-0 rounded-full p-1">
                                <button
                                    onClick={() => setPreviewMode('lite')}
                                    className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-medium transition-all ${previewMode === 'lite'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground/50 hover:text-foreground'
                                        }`}
                                >
                                    ⚡ Lite
                                </button>
                                <button
                                    onClick={() => setPreviewMode('full')}
                                    className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-medium transition-all ${previewMode === 'full'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground/50 hover:text-foreground'
                                        }`}
                                >
                                    🚀 Full
                                </button>
                            </div>
                        )}

                        {/* Runtime Timer - only visible in Lite mode */}
                        {previewMode === 'lite' && (
                            <div className={`glass border-0 rounded-full px-4 py-2 flex items-center gap-2 ${timeLeft < 30 ? 'bg-red-500/20 text-red-400' : 'bg-primary/10 text-primary'}`}>
                                <span className="text-[10px] uppercase tracking-widest font-medium">{iframeLoaded ? 'Runtime' : 'Loading'}</span>
                                <span className="font-mono text-sm font-bold">{iframeLoaded ? formatTime(timeLeft) : '...'}</span>
                            </div>
                        )}

                        <Button variant="outline" className="glass border-0 rounded-full px-6" asChild>
                            <a href={project.github} target="_blank" rel="noreferrer">
                                <Github className="w-4 h-4 mr-2" />
                                <span className="text-[10px] uppercase tracking-widest">Source</span>
                            </a>
                        </Button>
                        <Button className="bg-primary text-primary-foreground rounded-full px-8 shadow-xl" asChild>
                            <a href={project.demo || project.github} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                <span className="text-[10px] uppercase tracking-widest">Full View</span>
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Live Container */}
                <div className="space-y-12">
                    {project.language === "python" && gitInfo ? (
                        <PythonRunner owner={gitInfo.owner} repo={gitInfo.repo} />
                    ) : previewMode === 'lite' && gitInfo ? (
                        /* ⚡ Lite Mode: Fast CodeSandbox iframe */
                        <div className="relative">
                            <div
                                className="rounded-3xl overflow-hidden border border-primary/10 shadow-3xl bg-black/20 backdrop-blur-sm min-h-[600px] relative"
                                style={{ opacity: (isRunning || !iframeLoaded) ? 1 : 0.3, pointerEvents: (isRunning || !iframeLoaded) ? 'auto' : 'none' }}
                            >
                                {!iframeLoaded && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <div className="text-center space-y-4">
                                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                            <p className="text-foreground/50 text-sm">Loading fast preview...</p>
                                        </div>
                                    </div>
                                )}
                                <iframe
                                    src={`https://codesandbox.io/embed/github/${gitInfo.owner}/${gitInfo.repo}?fontsize=14&theme=dark&view=preview&hidenavigation=1&editorsize=0&hidedevtools=1`}
                                    className="w-full rounded-3xl"
                                    style={{ height: '600px', border: 'none' }}
                                    title={project.title}
                                    allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                                    sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                                    onLoad={handleIframeLoad}
                                />
                            </div>

                            {/* Extend Prompt Overlay - lite mode only */}
                            {showExtendPrompt && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-3xl">
                                    <div className="glass p-8 rounded-2xl text-center space-y-4 max-w-md">
                                        <h3 className="text-2xl font-heading font-light">Runtime Expired</h3>
                                        <p className="text-foreground/70 text-sm">
                                            Lite preview paused. Switch to Full mode for unlimited access, or extend.
                                        </p>
                                        <div className="flex gap-3 justify-center">
                                            <Button
                                                onClick={handleExtend}
                                                className="bg-primary text-primary-foreground rounded-full px-8 py-6"
                                            >
                                                <span className="text-xs uppercase tracking-widest">Extend 3 Min</span>
                                            </Button>
                                            <Button
                                                onClick={() => setPreviewMode('full')}
                                                variant="outline"
                                                className="glass border-0 rounded-full px-8 py-6"
                                            >
                                                <span className="text-xs uppercase tracking-widest">🚀 Go Full</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* 🚀 Full Mode: StackBlitz IDE - no timer */
                        <div className="relative">
                            <div
                                ref={containerRef}
                                className="rounded-3xl overflow-hidden border border-primary/10 shadow-3xl bg-black/20 backdrop-blur-sm min-h-[600px] flex items-center justify-center"
                            >
                                {isEmbedding && (
                                    <div className="text-center space-y-4">
                                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="text-foreground/50 text-sm">Loading full IDE...</p>
                                    </div>
                                )}
                                {embedError && (
                                    <div className="text-center space-y-4 p-8">
                                        <p className="text-red-400 text-sm">{embedError}</p>
                                        <Button
                                            variant="outline"
                                            className="glass border-0 rounded-full"
                                            asChild
                                        >
                                            <a href={project.github} target="_blank" rel="noreferrer">
                                                <Github className="w-4 h-4 mr-2" />
                                                <span className="text-[10px] uppercase tracking-widest">View on GitHub Instead</span>
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Project Details Card */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass p-8 rounded-3xl space-y-6">
                                <h3 className="font-heading text-sm tracking-[0.2em] uppercase text-primary flex items-center gap-2">
                                    <Code2 className="w-4 h-4" />
                                    Documentation
                                </h3>
                                <p className="text-lg font-light text-foreground/70 leading-relaxed italic">
                                    "{project.description}"
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map(tag => (
                                        <span key={tag} className="px-3 py-1 bg-primary/5 rounded-full text-[10px] uppercase tracking-widest text-foreground/40 font-light">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="glass p-8 rounded-3xl space-y-8 h-fit">
                            <h3 className="font-heading text-sm tracking-[0.2em] uppercase text-primary flex items-center gap-2">
                                <Rocket className="w-4 h-4" />
                                Project Leads
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-[10px] font-bold">
                                        {project.team.lead[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest font-medium text-foreground">{project.team.lead}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-foreground/40">Technical Lead</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-[10px] font-bold">
                                        {project.team.designer[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-widest font-medium text-foreground">{project.team.designer}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-foreground/40">UI/UX Architect</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProjectLive;
