import React, { useState } from "react";
import {
  executeCode,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
  type ExecutionResponse,
} from "@/lib/services/codeExecutionService";
import {
  Play,
  RotateCcw,
  Terminal,
  Copy,
  Check,
  Code2,
  Cpu,
  Clock,
  Sparkles,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { toast } from "sonner";

const DEFAULT_TEMPLATES: Record<SupportedLanguage, string> = {
  python: `# TechShastra Cloud Python Sandbox
import sys

def main():
    print("Welcome to TechShastra Online Sandbox!")
    # Read input lines if provided
    lines = sys.stdin.read().splitlines()
    if lines:
        print(f"Received {len(lines)} input line(s):", lines)
    else:
        print("Compute primes up to 20:")
        primes = [x for x in range(2, 21) if all(x % d != 0 for d in range(2, x))]
        print(primes)

if __name__ == "__main__":
    main()
`,
  javascript: `// TechShastra Node.js Sandbox
const fs = require('fs');

function main() {
  console.log("TechShastra JavaScript Sandbox Active");
  const input = fs.readFileSync(0, 'utf-8').trim();
  if (input) {
    console.log("STDIN:", input);
  } else {
    const arr = [10, 5, 20, 8, 12];
    console.log("Original Array:", arr);
    console.log("Sorted Array:", arr.sort((a, b) => a - b));
  }
}

main();
`,
  typescript: `// TechShastra TypeScript Sandbox
interface StudentRecord {
  id: string;
  name: string;
  role: string;
}

const user: StudentRecord = {
  id: "TS-2026",
  name: "TechShastra Member",
  role: "Full-Stack Engineer"
};

console.log("TypeScript Compiler Active");
console.log(JSON.stringify(user, null, 2));
`,
  cpp: `// TechShastra C++ 20 Sandbox
#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "TechShastra C++ Execution Engine" << std::endl;
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int sum = std::accumulate(nums.begin(), nums.end(), 0);
    std::cout << "Sum 1..10 = " << sum << std::endl;
    return 0;
}
`,
  java: `// TechShastra Java 21 Sandbox
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("TechShastra Java Runtime Sandbox");
        List<String> topics = Arrays.asList("DSA", "Web Development", "AI/ML", "Cloud");
        for (String topic : topics) {
            System.out.println("-> Topic: " + topic);
        }
    }
}
`,
};

export const CodePlayground: React.FC = () => {
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState<string>(DEFAULT_TEMPLATES.python);
  const [stdin, setStdin] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [output, setOutput] = useState<ExecutionResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCode(DEFAULT_TEMPLATES[newLang]);
    setOutput(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await executeCode(code, language, stdin);
      setOutput(res);
      if (res.status === "Success") {
        toast.success(`Executed cleanly in ${res.executionTimeMs}ms`);
      } else {
        toast.error(`Execution finished with status: ${res.status}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Code copied to clipboard");
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background text-foreground overflow-hidden">
      {/* Top action toolbar */}
      <div className="h-12 border-b border-border/40 bg-card/60 backdrop-blur-sm px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={17} className="text-primary" />
            <h1 className="text-xs sm:text-sm font-heading font-semibold text-foreground">
              Sandboxed Code Playground
            </h1>
          </div>
          <span className="text-[10px] hidden sm:inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Real Multi-Language Compiler
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <Select
            value={language}
            onValueChange={(val) => handleLanguageChange(val as SupportedLanguage)}
          >
            <SelectTrigger className="h-8 text-xs font-mono rounded-xl w-36 bg-background/80 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.id} value={lang.id} className="text-xs font-mono">
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyCode}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCode(DEFAULT_TEMPLATES[language])}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
            title="Reset code template"
          >
            <RotateCcw size={14} />
          </Button>

          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="h-8 rounded-xl gap-1.5 text-xs font-medium shadow-sm shadow-primary/20"
          >
            {isRunning ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Play size={13} className="fill-current" />
            )}
            <span>Execute Code</span>
          </Button>
        </div>
      </div>

      {/* Main Resizable split area */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left panel: Code Editor */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col bg-[#0d1117] text-white">
              <div className="h-8 px-3 border-b border-white/10 bg-[#161b22] flex items-center justify-between text-[11px] text-gray-400 font-mono select-none">
                <span className="flex items-center gap-1.5">
                  <Code2 size={13} className="text-primary" />
                  main.{language === "python" ? "py" : language === "cpp" ? "cpp" : language === "java" ? "java" : "js"}
                </span>
                <span>Press Tab to indent</span>
              </div>

              <div className="flex-1 relative font-mono text-xs overflow-hidden">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault();
                      const start = e.currentTarget.selectionStart;
                      const end = e.currentTarget.selectionEnd;
                      const val = e.currentTarget.value;
                      setCode(val.substring(0, start) + "  " + val.substring(end));
                      setTimeout(() => {
                        if (e.target) {
                          (e.target as HTMLTextAreaElement).selectionStart = start + 2;
                          (e.target as HTMLTextAreaElement).selectionEnd = start + 2;
                        }
                      }, 0);
                    }
                  }}
                  className="w-full h-full p-4 bg-transparent text-gray-100 resize-none outline-none font-mono leading-relaxed selection:bg-primary/30"
                  spellCheck={false}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel: STDIN Input (top) + Terminal Output (bottom) */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <ResizablePanelGroup direction="vertical">
              {/* STDIN Input */}
              <ResizablePanel defaultSize={35} minSize={15}>
                <div className="h-full flex flex-col bg-card/60 backdrop-blur-sm border-b border-border/40">
                  <div className="h-8 px-3 border-b border-border/30 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-[11px] uppercase tracking-wider">
                      Standard Input (STDIN)
                    </span>
                    <button
                      onClick={() => setStdin("")}
                      className="text-[10px] hover:text-foreground text-muted-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex-1 p-2">
                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Optional inputs fed to program standard input..."
                      className="w-full h-full p-2 bg-muted/20 border border-border/40 rounded-lg text-xs font-mono resize-none outline-none text-foreground placeholder:text-muted-foreground/60"
                      spellCheck={false}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Terminal Output */}
              <ResizablePanel defaultSize={65} minSize={25}>
                <div className="h-full flex flex-col bg-[#0b0e14] text-gray-200 font-mono text-xs">
                  <div className="h-8 px-3 border-b border-white/10 bg-[#12161f] flex items-center justify-between text-[11px] text-gray-400 select-none">
                    <div className="flex items-center gap-1.5">
                      <Terminal size={13} className="text-emerald-400" />
                      <span>Console Output</span>
                    </div>
                    {output && (
                      <span className="text-[10px] text-gray-500">
                        {output.executionTimeMs} ms • {output.status}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto font-mono whitespace-pre-wrap scrollbar-thin">
                    {isRunning ? (
                      <div className="flex items-center gap-2 text-gray-400 py-6 justify-center">
                        <Loader2 size={15} className="animate-spin text-primary" />
                        <span>Compiling and executing in isolated sandbox...</span>
                      </div>
                    ) : !output ? (
                      <span className="text-gray-500 italic">
                        Ready. Click "Execute Code" to run your program.
                      </span>
                    ) : output.status === "Compilation Error" || output.status === "Runtime Error" ? (
                      <div className="space-y-2 text-rose-400">
                        <p className="font-bold">❌ {output.status}:</p>
                        <pre className="text-rose-300 text-[11px]">
                          {output.stderr || output.compileError || output.stdout}
                        </pre>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {output.stdout ? (
                          <pre className="text-emerald-300 font-mono text-xs">
                            {output.stdout}
                          </pre>
                        ) : (
                          <span className="text-gray-500 italic">
                            [Program terminated successfully with no standard output]
                          </span>
                        )}
                        {output.stderr && (
                          <div className="pt-2 border-t border-white/10 text-amber-400 text-[11px]">
                            <p className="font-semibold">Stderr log:</p>
                            <pre>{output.stderr}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default CodePlayground;
