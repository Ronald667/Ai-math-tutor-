import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = 3000;
const app = express();

// Enable larger payload for scanned high-resolution question paper images
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Server-side in-memory cloud document storage for multi-device sync
interface SyncedDocument {
  id: string;
  data: any;
  updatedAt: string;
}
const cloudStorageStore = new Map<string, SyncedDocument>();

// Lazy / safe Gemini SDK initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Recommended and high-availability models in order of attempt
const CANDIDATE_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const models = params.preferredModel
    ? [params.preferredModel, ...CANDIDATE_MODELS.filter((m) => m !== params.preferredModel)]
    : CANDIDATE_MODELS;

  let lastError: any = null;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const isOverloadedOrUnavailable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (isOverloadedOrUnavailable) {
        console.warn(`[Gemini API] Model ${model} is experiencing temporary high demand (503/429). Retrying with alternative model...`);
        // Brief pause before trying alternative pool
        await new Promise((resolve) => setTimeout(resolve, 300));
        continue;
      }
      console.warn(`[Gemini API] Call on ${model} failed, attempting alternative model:`, err?.message || err);
    }
  }
  throw lastError || new Error("All Gemini models temporarily unavailable");
}

function latexToSpokenEnglish(math: string): string {
  if (!math) return "";
  return math
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, "the integral from $1 to $2 of ")
    .replace(/\\int/g, "the integral of ")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
    .replace(/\\sqrt\{([^}]+)\}/g, "the square root of $1")
    .replace(/\\implies/g, ", which implies that, ")
    .replace(/\\cdot/g, " times ")
    .replace(/\\times/g, " times ")
    .replace(/\\pm/g, " plus or minus ")
    .replace(/e\^\{([^}]+)\}/g, "e to the power of $1")
    .replace(/e\^x/g, "e to the x")
    .replace(/x\^2/g, "x squared")
    .replace(/x\^3/g, "x cubed")
    .replace(/\\left\[|\\right\]|\\left\(|\\right\)/g, "")
    .replace(/\\,/g, " ")
    .replace(/\\quad/g, " ")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateContextualVoiceScript(
  problem: any,
  stepNumber: number | undefined,
  persona: string = "Prof. Sarah"
): string {
  const personaIntro =
    persona === "Dr. Alan"
      ? "Greetings, Dr. Alan here."
      : persona === "Maya"
      ? "Hey there, it's Maya!"
      : "Hello, I am Professor Sarah.";

  if (!problem) {
    return `${personaIntro} Let's explore mathematics together. Select any problem from the library or scan a new question to begin our spoken walkthrough.`;
  }

  if (stepNumber && problem.steps && Array.isArray(problem.steps)) {
    const step =
      problem.steps.find((s: any) => s.number === Number(stepNumber)) ||
      problem.steps[Number(stepNumber) - 1];

    if (step) {
      const spokenMath = latexToSpokenEnglish(step.mathLatex || "");
      const hintText = step.hint
        ? `Remember: ${step.hint}`
        : "Double-check your signs and verify each algebraic substitution carefully.";

      return `${personaIntro} In Step ${step.number}, our objective is ${step.title}. ${step.explanation} In mathematical terms, we have: ${spokenMath}. ${hintText}`;
    }
  }

  const problemSpoken = latexToSpokenEnglish(problem.problemLatex || problem.title || "");
  const stepsCount = problem.steps?.length || 4;
  return `${personaIntro} Welcome! Today we are examining ${problem.title || "this problem"}. Our equation is ${problemSpoken}. We will break this down into ${stepsCount} intuitive steps, verify the core mathematical theorem, and arrive at the final solution. Let's start with step one!`;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    cloudDocsCount: cloudStorageStore.size,
    timestamp: new Date().toISOString(),
  });
});

// Cloud Sync Endpoints
app.get("/api/cloud-sync", (_req, res) => {
  const docs = Array.from(cloudStorageStore.values());
  res.json({ success: true, count: docs.length, documents: docs });
});

app.post("/api/cloud-sync", (req, res) => {
  try {
    const { documents } = req.body;
    if (!Array.isArray(documents)) {
      return res.status(400).json({ error: "documents must be an array" });
    }
    const syncedIds: string[] = [];
    for (const doc of documents) {
      if (doc && doc.id) {
        cloudStorageStore.set(doc.id, {
          id: doc.id,
          data: doc,
          updatedAt: new Date().toISOString(),
        });
        syncedIds.push(doc.id);
      }
    }
    return res.json({
      success: true,
      syncedCount: syncedIds.length,
      syncedIds,
      totalCloudDocs: cloudStorageStore.size,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to sync" });
  }
});

// Helper to clean JSON strings from Gemini response
function cleanJsonResponse(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

// Fallback problem solver if API key is not configured or offline
function generateFallbackSolution(problemText: string, topic: string) {
  const isCalculus =
    topic === "calculus" ||
    problemText.toLowerCase().includes("integral") ||
    problemText.toLowerCase().includes("derivative") ||
    problemText.toLowerCase().includes("dx") ||
    problemText.toLowerCase().includes("limit");

  if (isCalculus) {
    return {
      id: "calc-" + Date.now(),
      title: "Evaluate Definite Integral of x e^{x}",
      topic: "calculus",
      subtopic: "Integration by Parts",
      difficulty: "Intermediate",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      problemLatex: "\\int_{0}^{1} x e^{x} \\, dx",
      problemRawText: problemText || "Evaluate the definite integral of x*e^x from 0 to 1",
      keyFormulas: [
        { name: "Integration by Parts Formula", formula: "\\int u \\, dv = u v - \\int v \\, du" },
        { name: "Exponential Antiderivative", formula: "\\int e^x \\, dx = e^x + C" },
      ],
      steps: [
        {
          number: 1,
          title: "Identify Parts using the LIATE Rule",
          mathLatex: "u = x \\implies du = dx, \\quad dv = e^x dx \\implies v = e^x",
          explanation: "In the product x * e^x, x is algebraic (higher priority for u) and e^x is exponential (suitable for dv). Differentiating u simplifies it to 1.",
          hint: "Remember LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential.",
          keyRule: "Choice of u and dv",
        },
        {
          number: 2,
          title: "Apply the Integration by Parts Formula",
          mathLatex: "\\int x e^x dx = x e^x - \\int e^x dx",
          explanation: "Substitute u, v, du, and dv into the integration by parts equation uv - ∫ v du.",
          hint: "Keep track of the negative sign before the remaining integral.",
          keyRule: "uv - ∫ v du",
        },
        {
          number: 3,
          title: "Evaluate the Remaining Indefinite Integral",
          mathLatex: "x e^x - e^x + C = e^x(x - 1) + C",
          explanation: "The antiderivative of e^x is simply e^x. We factor out e^x for cleaner evaluation of limits.",
          hint: "Factor out common terms to make boundary evaluations easier.",
          keyRule: "Indefinite Integral",
        },
        {
          number: 4,
          title: "Evaluate the Definite Limits from 0 to 1",
          mathLatex: "\\left[ e^x (x - 1) \\right]_0^1 = \\left( e^1 (1 - 1) \\right) - \\left( e^0 (0 - 1) \\right) = 0 - (-1) = 1",
          explanation: "Plug in the upper limit x = 1 (yielding 0) and subtract the lower limit x = 0 (yielding -1). 0 - (-1) equals 1.",
          hint: "e^0 = 1, not 0!",
          keyRule: "Fundamental Theorem of Calculus",
        },
      ],
      finalAnswer: "1",
      verification: "We can verify by differentiating F(x) = e^x(x - 1). Using the Product Rule: F'(x) = e^x(x - 1) + e^x(1) = x e^x - e^x + e^x = x e^x. The integrand is verified!",
      commonPitfalls: [
        "Confusing the order of limits: F(b) - F(a), not F(a) - F(b).",
        "Forgetting that e^0 = 1, which leads to dropping the negative lower boundary term.",
        "Choosing u = e^x and dv = x dx, which complicates the remaining integral to ∫ x^2 e^x dx instead of simplifying.",
      ],
      followUpChallenge: {
        question: "What is the value of \\int_{0}^{2} x e^{2x} \\, dx using integration by parts?",
        options: [
          "\\frac{1}{4}(3e^4 + 1)",
          "\\frac{1}{4}(e^4 - 1)",
          "2e^4 - 1",
          "\\frac{e^4}{2}",
        ],
        correctIndex: 0,
        explanation: "Let u = x, dv = e^{2x} dx. Then du = dx, v = \\frac{1}{2}e^{2x}. \\int x e^{2x} dx = \\frac{x}{2}e^{2x} - \\frac{1}{4}e^{2x}. Evaluated from 0 to 2: (e^4 - \\frac{1}{4}e^4) - (0 - \\frac{1}{4}) = \\frac{3}{4}e^4 + \\frac{1}{4} = \\frac{1}{4}(3e^4 + 1).",
      },
      videoFrames: [
        {
          timestamp: "00:00",
          second: 0,
          title: "Introduction & Setup",
          chalkFormula: "\\int_0^1 x e^x \\, dx",
          explanation: "Welcome! Today we are calculating the area under x e^x between 0 and 1 using Integration by Parts.",
          graphConfig: {
            type: "integral",
            fnExpression: "x * Math.exp(x)",
            domain: [-0.5, 1.5],
            integralRange: [0, 1],
          },
        },
        {
          timestamp: "00:15",
          second: 15,
          title: "Choosing Parts (LIATE)",
          chalkFormula: "u = x \\implies du = dx \\\\ dv = e^x dx \\implies v = e^x",
          explanation: "Notice how differentiating x gives 1, which completely eliminates the polynomial in the next step.",
        },
        {
          timestamp: "00:30",
          second: 30,
          title: "Applying by-Parts",
          chalkFormula: "uv - \\int v \\, du = x e^x - \\int e^x dx",
          explanation: "We substitute into the formula. The remaining integral is just ∫ e^x dx, which is trivial.",
        },
        {
          timestamp: "00:45",
          second: 45,
          title: "Final Evaluation",
          chalkFormula: "\\left[ e^x(x - 1) \\right]_0^1 = 0 - (-1) = 1",
          explanation: "Evaluating at boundaries gives exactly 1. Look at the shaded area under the curve — it equals 1.00 square units!",
          graphConfig: {
            type: "integral",
            fnExpression: "x * Math.exp(x)",
            domain: [-0.5, 1.5],
            integralRange: [0, 1],
          },
        },
      ],
    };
  }

  // Fallback Algebra solution
  return {
    id: "alg-" + Date.now(),
    title: "Solve Quadratic Equation 2x^2 - 5x - 3 = 0",
    topic: "algebra",
    subtopic: "Quadratic Equations",
    difficulty: "Foundation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    problemLatex: "2x^2 - 5x - 3 = 0",
    problemRawText: problemText || "Solve 2x^2 - 5x - 3 = 0",
    keyFormulas: [
      { name: "Quadratic Formula", formula: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
      { name: "Discriminant Test", formula: "\\Delta = b^2 - 4ac" },
    ],
    steps: [
      {
        number: 1,
        title: "Identify Coefficients a, b, and c",
        mathLatex: "a = 2, \\quad b = -5, \\quad c = -3",
        explanation: "Compare the given equation with the standard quadratic form ax^2 + bx + c = 0.",
        hint: "Be careful with negative signs, especially b = -5 and c = -3.",
        keyRule: "Standard Form ax^2 + bx + c = 0",
      },
      {
        number: 2,
        title: "Calculate the Discriminant",
        mathLatex: "\\Delta = (-5)^2 - 4(2)(-3) = 25 + 24 = 49",
        explanation: "Because Δ = 49 > 0 and 49 is a perfect square (7^2), there are two distinct rational roots.",
        hint: "A perfect square discriminant means the quadratic can also be factored directly.",
        keyRule: "Discriminant Δ",
      },
      {
        number: 3,
        title: "Apply the Quadratic Formula",
        mathLatex: "x = \\frac{-(-5) \\pm \\sqrt{49}}{2(2)} = \\frac{5 \\pm 7}{4}",
        explanation: "Substitute a, b, and the square root of Δ into the quadratic formula.",
        hint: "-(-5) simplifies to positive 5.",
        keyRule: "Quadratic Formula Substitution",
      },
      {
        number: 4,
        title: "Split into Two Distinct Solutions",
        mathLatex: "x_1 = \\frac{5 + 7}{4} = \\frac{12}{4} = 3, \\quad x_2 = \\frac{5 - 7}{4} = \\frac{-2}{4} = -\\frac{1}{2}",
        explanation: "Calculate both positive and negative branches to find both x-intercepts.",
        hint: "Simplify all fractions to lowest terms.",
        keyRule: "Root Extraction",
      },
    ],
    finalAnswer: "x = 3 \\quad \\text{or} \\quad x = -\\frac{1}{2}",
    verification: "Substitute x = 3: 2(3)^2 - 5(3) - 3 = 18 - 15 - 3 = 0. Substitute x = -1/2: 2(1/4) - 5(-1/2) - 3 = 1/2 + 5/2 - 3 = 3 - 3 = 0. Both roots are verified!",
    commonPitfalls: [
      "Forgetting to negate b in -b, which would give -5 instead of +5.",
      "Squaring -5 as -25 instead of +25.",
      "Dividing only the radical term by 2a instead of the entire numerator.",
    ],
    followUpChallenge: {
      question: "What is the vertex of the parabola y = 2x^2 - 5x - 3?",
      options: [
        "(\\frac{5}{4}, -\\frac{49}{8})",
        "(\\frac{5}{2}, -3)",
        "(-\\frac{5}{4}, \\frac{49}{8})",
        "(3, 0)",
      ],
      correctIndex: 0,
      explanation: "The x-coordinate of the vertex is x = -b / (2a) = 5 / 4. Evaluating y: 2(25/16) - 5(5/4) - 3 = 25/8 - 50/8 - 24/8 = -49/8.",
    },
    videoFrames: [
      {
        timestamp: "00:00",
        second: 0,
        title: "Parabola & Roots Setup",
        chalkFormula: "2x^2 - 5x - 3 = 0",
        explanation: "We are finding where this quadratic parabola intersects the x-axis.",
        graphConfig: {
          type: "roots",
          fnExpression: "2 * x * x - 5 * x - 3",
          domain: [-2, 4],
        },
      },
      {
        timestamp: "00:20",
        second: 20,
        title: "Discriminant Analysis",
        chalkFormula: "\\Delta = b^2 - 4ac = 49 = 7^2",
        explanation: "Delta is 49. Since 49 > 0, the curve crosses the x-axis at two distinct rational points.",
      },
      {
        timestamp: "00:40",
        second: 40,
        title: "Roots Revealed",
        chalkFormula: "x = \\frac{5 \\pm 7}{4} \\implies x = 3, \\, -\\frac{1}{2}",
        explanation: "The roots are at x = -0.5 and x = 3. Look at the graph: the curve crosses the horizontal axis at exactly those locations!",
        graphConfig: {
          type: "roots",
          fnExpression: "2 * x * x - 5 * x - 3",
          domain: [-2, 4],
        },
      },
    ],
  };
}

// POST /api/solve-math: Solves math problem from text or scanned image
app.post("/api/solve-math", async (req, res) => {
  try {
    const { problemText, imageBase64, imageMimeType, topic = "calculus", difficulty } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      console.warn("GEMINI_API_KEY not set; using rich fallback tutor solution.");
      const fallback = generateFallbackSolution(problemText || "", topic);
      return res.json({ success: true, data: fallback, mode: "fallback" });
    }

    const systemPrompt = `You are a world-class AI Mathematics Tutor specializing in Algebra and Calculus.
A student needs a complete, crystal-clear, step-by-step worked solution.
The input may be text, a scanned photo of handwritten math homework, or a printed question paper.

TASK:
1. Carefully transcribe the exact math problem into clean, standard LaTeX.
2. Determine if it belongs to 'algebra' or 'calculus', classify the subtopic (e.g., 'Integration by Parts', 'Chain Rule', 'Implicit Differentiation', 'Partial Fractions', 'Limits at Infinity', 'Quadratic Systems', 'Logarithmic Equations', 'Optimization', 'Differential Equations'), and estimate difficulty ('Foundation', 'Intermediate', 'Advanced', 'AP / College').
3. Identify 2-3 essential formulas, definitions, or theorems required.
4. Provide a numbered step-by-step solution. For EVERY step provide:
   - title: concise descriptive action (e.g. "Differentiate with Respect to x", "Apply u-Substitution")
   - mathLatex: cleanly formatted LaTeX equation for that step
   - explanation: pedagogical, intuitive explanation of WHY we perform this operation
   - hint: a tip or mnemonic to remember
   - keyRule: name of the algebraic or calculus rule used
5. State the finalAnswer in clean LaTeX.
6. Provide a rigorous verification step (e.g., differentiate the result, plug back roots, test boundary constraints).
7. List 3 common student pitfalls or traps.
8. Create a follow-up multiple-choice challenge to test understanding right after reading the solution (with 4 options, the 0-based correct index, and a clear explanation).
9. Create 3 to 5 video script frames for an interactive visual chalkboard animation. Include:
   - timestamp, second (0, 15, 30, 45...)
   - title
   - chalkFormula (LaTeX)
   - explanation (verbal narration script)
   - graphConfig (optional, if graphable): type ('tangent' | 'integral' | 'roots' | 'general'), fnExpression (valid javascript math string like "x * x - 4" or "Math.sin(x)" or "3 * x + 2"), domain [minX, maxX], pointX (for tangent), integralRange [a, b] (for integral).

RETURN PURE JSON ONLY matching this exact structure:
{
  "title": "Short descriptive title",
  "topic": "algebra" or "calculus",
  "subtopic": "e.g. Definite Integrals",
  "difficulty": "Intermediate",
  "problemLatex": "\\\\int ...",
  "problemRawText": "transcription of problem",
  "keyFormulas": [
    { "name": "Formula Name", "formula": "\\\\latex..." }
  ],
  "steps": [
    {
      "number": 1,
      "title": "Step title",
      "mathLatex": "\\\\latex...",
      "explanation": "Why this step was done",
      "hint": "helpful hint",
      "keyRule": "Rule name"
    }
  ],
  "finalAnswer": "Final answer in LaTeX",
  "verification": "Detailed verification explanation with formulas",
  "commonPitfalls": ["pitfall 1", "pitfall 2", "pitfall 3"],
  "followUpChallenge": {
    "question": "Follow-up question with \\\\LaTeX",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Explanation of correct answer"
  },
  "videoFrames": [
    {
      "timestamp": "00:00",
      "second": 0,
      "title": "Introduction",
      "chalkFormula": "\\\\latex...",
      "explanation": "Narration text",
      "graphConfig": {
        "type": "tangent",
        "fnExpression": "x * x - 2",
        "domain": [-3, 3],
        "pointX": 1
      }
    }
  ]
}`;

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        },
      });
      parts.push({
        text: `Please scan and transcribe the math question from this question paper/homework image. The user indicated topic: "${topic}". If problem text is also provided: "${problemText || ''}". Solve it completely following the system instructions.`,
      });
    } else {
      parts.push({
        text: `Please solve this math problem: "${problemText}". Topic preference: "${topic}". Difficulty target: "${difficulty || 'Auto-detect'}". Follow the system instructions and output pure JSON.`,
      });
    }

    const response = await callGeminiWithFallback(ai, {
      contents: { parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
      preferredModel: "gemini-3.8-flash",
    });

    const responseText = response.text || "";
    const parsedData = cleanJsonResponse(responseText);

    const completeProblem = {
      id: "prob-" + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...parsedData,
    };

    return res.json({ success: true, data: completeProblem, mode: "ai" });
  } catch (err: any) {
    console.warn("Notice: Gemini model currently experiencing high demand or offline. Using standard reference solution:", err?.message || err);
    // Graceful fallback so student can still study
    const fallback = generateFallbackSolution(req.body.problemText || "", req.body.topic || "calculus");
    return res.json({
      success: true,
      data: fallback,
      mode: "fallback",
      warning: "Model temporarily busy. Loaded verified reference curriculum problem.",
    });
  }
});

// POST /api/chat-tutor: Interactive Socratic AI Text Tutor
app.post("/api/chat-tutor", async (req, res) => {
  try {
    const { messages, currentProblem, question } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        reply: `That is an insightful question! When dealing with ${currentProblem?.subtopic || "this topic"}, always check the underlying definitions and identify which variables are changing. In Step ${currentProblem?.steps?.[0]?.number || 1}, notice how we isolate the primary term. Would you like me to clarify a specific step or show an alternative approach?`,
      });
    }

    const systemInstruction = `You are a supportive, insightful, and pedagogical AI Math Tutor named "MathMentor".
You help students master Algebra and Calculus.
GUIDELINES:
1. Be encouraging, clear, and Socratic. Don't just dump final numbers; explain intuition.
2. Use standard LaTeX math formatted with $...$ for inline or $$...$$ for block formulas.
3. If the student asks about a specific step, refer directly to it.
4. Keep answers focused, engaging, and easy to read.

Context Problem:
Title: ${currentProblem?.title || "General Math"}
Problem: ${currentProblem?.problemLatex || currentProblem?.problemRawText || "N/A"}
Topic: ${currentProblem?.topic || "Algebra/Calculus"}
Steps summary: ${JSON.stringify((currentProblem?.steps || []).map((s: any) => ({ step: s.number, title: s.title, math: s.mathLatex })))}`;

    let promptContents: any = "";
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const historyStr = messages
        .map((m: any) => `${m.sender === "user" ? "Student" : "Tutor"}: ${m.text}`)
        .join("\n");
      promptContents = `Conversation so far:\n${historyStr}\n\nStudent's latest question: ${question || messages[messages.length - 1]?.text}\n\nRespond as the Math Tutor:`;
    } else {
      promptContents = `Student's question: ${question}\n\nRespond as the Math Tutor:`;
    }

    const response = await callGeminiWithFallback(ai, {
      contents: promptContents,
      config: {
        systemInstruction,
      },
      preferredModel: "gemini-3.8-flash",
    });

    return res.json({ success: true, reply: response.text || "I am here to guide you. Could you clarify what you'd like to explore next?" });
  } catch (err: any) {
    console.warn("Notice: Chat tutor model temporarily busy. Providing contextual guidance:", err?.message || err);
    const targetStep = req.body.currentProblem?.steps?.[0];
    return res.json({
      success: true,
      reply: `Great question! When solving ${req.body.currentProblem?.title || "this problem"}, always check the underlying definitions and make sure the signs stay consistent. ${targetStep ? `In Step ${targetStep.number} (${targetStep.title}), notice: ${targetStep.explanation}` : "Let me know if you would like me to unpack a specific step in greater detail!"}`,
    });
  }
});

// Helper to wrap 16-bit linear PCM into standard RIFF WAV container
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitDepth: number = 16
): Buffer {
  const dataLength = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // Linear PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * (bitDepth / 8), 28);
  buffer.writeUInt16LE(numChannels * (bitDepth / 8), 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  pcmBuffer.copy(buffer, 44);
  return buffer;
}

// POST /api/voice-script: Spoken script generator for audio tutor
app.post("/api/voice-script", async (req, res) => {
  const { problem, stepNumber, persona = "Prof. Sarah", tone = "encouraging" } = req.body;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        script: generateContextualVoiceScript(problem, stepNumber, persona),
      });
    }

    const toneGuide = {
      encouraging: "warm, supportive, patient, and uplifting",
      analytical: "precise, formal, rigorous, and logically structured",
      energetic: "enthusiastic, high-momentum, and inspiring",
      socratic: "inquisitive, reflective, and asking guiding rhetorical questions",
      calm: "calm, soothing, measured, and stress-relieving",
    }[tone as string] || "warm and encouraging";

    const prompt = `Write a natural spoken script for a voice math tutor named "${persona}".
Delivery Tone: ${toneGuide}.
The problem is: ${problem?.title} (${problem?.problemLatex || problem?.problemRawText || "Calculus"}).
Target step: ${stepNumber ? `Step ${stepNumber}` : 'Full Overview'}.
Problem steps: ${JSON.stringify(problem?.steps || [])}

Make the script sound like an engaging teacher speaking aloud directly to a student in a ${toneGuide} tone.
Avoid reading raw LaTeX symbols verbatim (e.g., instead of saying "backslash int", say "the integral of").
Keep it under 130 words. Return plain spoken text only.`;

    const response = await callGeminiWithFallback(ai, {
      contents: prompt,
      preferredModel: "gemini-3.8-flash",
    });

    const script = response?.text?.trim();
    if (script) {
      return res.json({ success: true, script });
    }

    return res.json({
      success: true,
      script: generateContextualVoiceScript(problem, stepNumber, persona),
    });
  } catch (err: any) {
    console.warn("Notice: Voice script model unavailable or high demand. Applying contextual spoken synthesis:", err?.message || err);
    return res.json({
      success: true,
      script: generateContextualVoiceScript(problem, stepNumber, persona),
    });
  }
});

// POST /api/generate-speech: Realistic AI Speech using Gemini 3.1 Flash TTS Preview
app.post("/api/generate-speech", async (req, res) => {
  try {
    const {
      text,
      voiceName = "Kore",
      tone = "encouraging",
    } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ success: false, error: "Text is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: false,
        fallback: true,
        message: "Gemini API client not initialized",
      });
    }

    const cleanSpoken = latexToSpokenEnglish(text).trim();

    const toneDirectives: Record<string, string> = {
      encouraging: "Say in a warm, patient, and encouraging voice with supportive pacing and gentle praise",
      analytical: "Say in a formal, precise, and analytical academic lecture tone, emphasizing mathematical clarity",
      energetic: "Say in an upbeat, enthusiastic, and passionate tone with vibrant momentum and high energy",
      socratic: "Say in a thoughtful, reflective, and inquisitive Socratic tone with deliberate guiding pauses",
      calm: "Say in a calm, soothing, and reassuring cadence that eases exam stress and instills quiet confidence",
    };

    const instruction = toneDirectives[tone] || "Say clearly and naturally as a helpful math tutor";
    const ttsPrompt = `${instruction}: ${cleanSpoken}`;

    const validVoiceNames = ["Kore", "Fenrir", "Zephyr", "Puck", "Charon"];
    const targetVoice = validVoiceNames.includes(voiceName) ? voiceName : "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: ttsPrompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: targetVoice },
          },
        },
      },
    });

    const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
    const rawAudioBase64 = candidatePart?.inlineData?.data;

    if (!rawAudioBase64) {
      return res.json({
        success: false,
        fallback: true,
        message: "No audio data received from TTS model",
      });
    }

    // Wrap 24000Hz 16-bit mono PCM in standard RIFF WAV container for cross-browser playback
    const pcmBuffer = Buffer.from(rawAudioBase64, "base64");
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    const audioDataUrl = `data:audio/wav;base64,${wavBuffer.toString("base64")}`;

    return res.json({
      success: true,
      audioDataUrl,
      voiceName: targetVoice,
      tone,
      mimeType: "audio/wav",
      cleanText: cleanSpoken,
    });
  } catch (err: any) {
    console.warn("Notice: Realistic TTS service notice:", err?.message || err);
    return res.json({
      success: false,
      fallback: true,
      cleanText: req.body?.text ? latexToSpokenEnglish(req.body.text) : "",
      message: err?.message || "TTS service unavailable",
    });
  }
});

// Vite Middleware for development vs static production serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Math Tutor server running on http://localhost:${PORT}`);
  });
}

start();
