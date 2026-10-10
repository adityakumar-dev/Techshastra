import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Loader2, Code, Terminal } from "lucide-react";

interface PythonRunnerProps {
    owner: string;
    repo: string;
}

const PythonRunner = ({ owner, repo }: PythonRunnerProps) => {
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [output, setOutput] = useState<string[]>([]);
    const [code, setCode] = useState<string>("");
    const pyodideRef = useRef<any>(null);

    useEffect(() => {
        const loadPyodide = async () => {
            if (pyodideRef.current) return;

            try {
                // Load Pyodide from CDN
                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
                script.onload = async () => {
                    // @ts-ignore
                    pyodideRef.current = await window.loadPyodide({
                        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
                    });
                    setLoading(false);
                    fetchMainFile();
                };
                document.body.appendChild(script);
            } catch (err) {
                console.error("Pyodide load failed", err);
                setOutput(["Error: Failed to load Python environment."]);
                setLoading(false);
            }
        };

        const fetchMainFile = async () => {
            try {
                const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
                const files = await response.json();

                // Find main.py or any .py file
                const mainFile = files.find((f: any) => f.name === "main.py" || f.name.endsWith(".py"));

                if (mainFile) {
                    const contentResponse = await fetch(mainFile.download_url);
                    const text = await contentResponse.text();
                    setCode(text);
                } else {
                    setCode("# No .py files found. Type your code here.\nprint('Hello TechShastra!')");
                }
            } catch (e) {
                console.error("Fetch failed", e);
                setCode("print('Hello TechShastra!')");
            }
        };

        loadPyodide();
    }, [owner, repo]);

    const runCode = async () => {
        if (!pyodideRef.current || executing) return;

        setExecuting(true);
        setOutput([]);

        try {
            // Capture stdout
            pyodideRef.current.setStdout({
                batched: (str: string) => setOutput(prev => [...prev, str])
            });

            await pyodideRef.current.runPythonAsync(code);
        } catch (err: any) {
            setOutput(prev => [...prev, `\nError: ${err.message}`]);
        } finally {
            setExecuting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm font-light tracking-widest uppercase">Initializing Python Environment...</p>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-primary/10 bg-black/40 backdrop-blur-xl h-[600px]">
            {/* Editor Panel */}
            <div className="flex flex-col border-r border-primary/10">
                <div className="flex items-center justify-between p-3 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-2 text-primary">
                        <Code className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-widest font-medium">Source Editor</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={() => setCode("")} className="w-8 h-8">
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            onClick={runCode}
                            disabled={executing}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-4"
                        >
                            {executing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                            <span className="text-[10px] uppercase tracking-widest">Run</span>
                        </Button>
                    </div>
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    className="flex-1 p-6 bg-transparent text-sm font-mono text-foreground/80 resize-none focus:outline-none scrollbar-hide"
                />
            </div>

            {/* Terminal Panel */}
            <div className="flex flex-col bg-black/60">
                <div className="flex items-center gap-2 p-3 bg-primary/5 border-b border-primary/10 text-primary/60">
                    <Terminal className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-widest font-medium">Console Output</span>
                </div>
                <div className="flex-1 p-6 font-mono text-sm overflow-y-auto scrollbar-hide">
                    {output.length === 0 ? (
                        <span className="text-foreground/20 italic">No output yet. Click run to execute.</span>
                    ) : (
                        output.map((line, i) => (
                            <div key={i} className="text-green-500/80 leading-relaxed">$ {line}</div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PythonRunner;
