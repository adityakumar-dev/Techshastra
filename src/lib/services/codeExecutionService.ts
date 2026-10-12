/**
 * Real Sandboxed Code Execution Service for TechShastra Student Hub.
 *
 * Executes real code securely across Python, JavaScript, TypeScript, C++, and Java.
 * Uses Wandbox sandboxed compilers with isolated execution and stdin/stdout capture.
 * Provides fallback to client-side isolated evaluation for offline / resilience.
 */

export type SupportedLanguage = "python" | "javascript" | "typescript" | "cpp" | "java";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  isError: boolean;
  errorMessage?: string;
}

export interface TestCase {
  id: string | number;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface TestCaseResult {
  testCaseId: string | number;
  passed: boolean;
  input?: string;          // omitted if hidden
  expectedOutput?: string; // omitted if hidden
  actualOutput: string;
  runtimeMs: number;
  error?: string;
  isHidden: boolean;
}

export interface EvaluationResult {
  status: "Accepted" | "Wrong Answer" | "Compilation Error" | "Runtime Error" | "Time Limit Exceeded";
  passedTestCases: number;
  totalTestCases: number;
  testCaseResults: TestCaseResult[];
  runtimeMs: number;
  memoryKb?: number;
  compilationMessage?: string;
}

export const SUPPORTED_LANGUAGES: { id: SupportedLanguage; name: string }[] = [
  { id: "python", name: "Python 3.12" },
  { id: "javascript", name: "JavaScript (Node 20)" },
  { id: "typescript", name: "TypeScript 5.6" },
  { id: "cpp", name: "C++ 20 (GCC 13)" },
  { id: "java", name: "Java 21 (OpenJDK)" },
];

export interface ExecutionResponse extends ExecutionResult {
  status: "Success" | "Compilation Error" | "Runtime Error" | "Error";
  executionTimeMs: number;
  compileError?: string;
}

// Compiler mapping for Wandbox sandboxed execution API
const COMPILER_MAP: Record<SupportedLanguage, { compiler: string; defaultCode: string }> = {
  python: {
    compiler: "cpython-3.12.7",
    defaultCode: `import sys\n\ndef solve():\n    # Read input from standard input\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # Your logic here\n    print("Hello TechShastra")\n\nif __name__ == "__main__":\n    solve()\n`,
  },
  javascript: {
    compiler: "nodejs-20.17.0",
    defaultCode: `const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n    // Your solution here\n    console.log("Hello TechShastra");\n}\n\nsolve();\n`,
  },
  typescript: {
    compiler: "typescript-5.6.2",
    defaultCode: `import * as fs from 'fs';\n\nfunction solve(): void {\n    const input = fs.readFileSync(0, 'utf-8').trim();\n    console.log("Hello TechShastra");\n}\n\nsolve();\n`,
  },
  cpp: {
    compiler: "gcc-13.2.0",
    defaultCode: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Your solution here\n    cout << "Hello TechShastra" << endl;\n    return 0;\n}\n`,
  },
  java: {
    compiler: "openjdk-jdk-21+35",
    defaultCode: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n        System.out.println("Hello TechShastra");\n    }\n}\n`,
  },
};

/**
 * Execute code with optional stdin using isolated sandboxed engine.
 */
async function rawExecuteCode(
  language: SupportedLanguage,
  code: string,
  stdin: string = ""
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const config = COMPILER_MAP[language] || COMPILER_MAP.python;

  try {
    const response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        compiler: config.compiler,
        code: code,
        stdin: stdin,
      }),
    });

    if (!response.ok) {
      throw new Error(`Compiler service returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const runtimeMs = Math.round(performance.now() - startTime);

    const stdout = (data.program_output || data.compiler_output || "").trim();
    const stderr = (data.program_error || data.compiler_error || "").trim();
    const exitCode = parseInt(data.status || "0", 10);
    const isError = exitCode !== 0 || !!data.compiler_error || (stderr.length > 0 && stdout.length === 0);

    return {
      stdout,
      stderr,
      exitCode,
      runtimeMs,
      isError,
      errorMessage: isError ? (stderr || data.compiler_message || "Execution exited with non-zero status") : undefined,
    };
  } catch (err: any) {
    // If offline or network error, execute in local client-side sandbox for JavaScript
    if (language === "javascript") {
      try {
        return executeClientJs(code, stdin, startTime);
      } catch (localErr: any) {
        return {
          stdout: "",
          stderr: localErr.message || "Execution error",
          exitCode: 1,
          runtimeMs: Math.round(performance.now() - startTime),
          isError: true,
          errorMessage: localErr.message,
        };
      }
    }

    return {
      stdout: "",
      stderr: `Network/Execution Error: ${err.message || "Failed to reach compiler sandbox"}`,
      exitCode: 1,
      runtimeMs: Math.round(performance.now() - startTime),
      isError: true,
      errorMessage: err.message,
    };
  }
}

/**
 * Flexible wrapper for executeCode supporting either (language, code, stdin) or (code, language, stdin).
 */
export async function executeCode(
  arg1: SupportedLanguage | string,
  arg2: string | SupportedLanguage,
  stdin: string = ""
): Promise<ExecutionResponse> {
  let language: SupportedLanguage = "python";
  let code: string = "";

  if (["python", "javascript", "typescript", "cpp", "java"].includes(arg1 as string)) {
    language = arg1 as SupportedLanguage;
    code = arg2 as string;
  } else {
    code = arg1 as string;
    language = (arg2 as SupportedLanguage) || "python";
  }

  const res = await rawExecuteCode(language, code, stdin);
  const status = res.isError
    ? res.stderr?.includes("error:") || res.errorMessage?.includes("compiler")
      ? "Compilation Error"
      : "Runtime Error"
    : "Success";

  return {
    ...res,
    status,
    executionTimeMs: res.runtimeMs,
    compileError: res.errorMessage,
  };
}

/**
 * Fallback browser JS sandbox capturing console.log.
 */
function executeClientJs(code: string, stdin: string, startTime: number): ExecutionResult {
  const logs: string[] = [];
  const customConsole = {
    log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    error: (...args: any[]) => logs.push("[error] " + args.join(' ')),
    warn: (...args: any[]) => logs.push("[warn] " + args.join(' ')),
  };

  // Safe wrapper
  const runner = new Function("console", "input", `
    "use strict";
    try {
      ${code}
    } catch(e) {
      console.error(e.message);
    }
  `);

  runner(customConsole, stdin);
  const runtimeMs = Math.round(performance.now() - startTime);

  return {
    stdout: logs.join("\n"),
    stderr: "",
    exitCode: 0,
    runtimeMs,
    isError: false,
  };
}

/**
 * Normalize output string for whitespace-invariant comparison.
 */
function normalizeOutput(str: string): string {
  return str
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(line => line.trimEnd())
    .join("\n")
    .trim();
}

/**
 * Run code against all problem test cases (sample and hidden).
 * Hidden test case inputs and expected outputs are never leaked to students.
 */
export async function evaluateProblemSubmission(
  language: SupportedLanguage,
  code: string,
  testCases: TestCase[]
): Promise<EvaluationResult> {
  const overallStart = performance.now();
  const testCaseResults: TestCaseResult[] = [];
  let hasCompilationError = false;
  let hasRuntimeError = false;
  let passedCount = 0;

  for (const tc of testCases) {
    const res = await executeCode(language, code, tc.input);

    if (res.exitCode !== 0 && res.stderr && (res.stderr.includes("error:") || res.stderr.includes("SyntaxError"))) {
      hasCompilationError = true;
    } else if (res.isError) {
      hasRuntimeError = true;
    }

    const normalizedActual = normalizeOutput(res.stdout);
    const normalizedExpected = normalizeOutput(tc.expectedOutput);
    const passed = normalizedActual === normalizedExpected && !res.isError;

    if (passed) passedCount++;

    testCaseResults.push({
      testCaseId: tc.id,
      passed,
      // Strictly omit input and expected output if hidden!
      input: tc.isHidden ? undefined : tc.input,
      expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
      actualOutput: tc.isHidden && !passed ? "[Output hidden on secret test cases]" : res.stdout,
      runtimeMs: res.runtimeMs,
      error: res.errorMessage,
      isHidden: !!tc.isHidden,
    });

    // If first test case has compilation error, halt immediately to save time
    if (hasCompilationError && testCaseResults.length === 1) {
      break;
    }
  }

  const totalRuntimeMs = Math.round(performance.now() - overallStart);

  let status: EvaluationResult["status"] = "Wrong Answer";
  if (hasCompilationError) {
    status = "Compilation Error";
  } else if (hasRuntimeError && passedCount === 0) {
    status = "Runtime Error";
  } else if (passedCount === testCases.length) {
    status = "Accepted";
  }

  return {
    status,
    passedTestCases: passedCount,
    totalTestCases: testCases.length,
    testCaseResults,
    runtimeMs: totalRuntimeMs,
  };
}

export function getDefaultStarterCode(language: SupportedLanguage): string {
  return COMPILER_MAP[language]?.defaultCode || COMPILER_MAP.python.defaultCode;
}

export async function evaluateTestCases(
  code: string,
  language: SupportedLanguage,
  testCases: TestCase[]
) {
  const result = await evaluateProblemSubmission(language, code, testCases);
  return {
    status: result.status,
    passedCount: result.passedTestCases,
    totalCount: result.totalTestCases,
    totalRuntimeMs: result.runtimeMs,
    results: result.testCaseResults,
    compileError: result.compilationMessage,
  };
}
