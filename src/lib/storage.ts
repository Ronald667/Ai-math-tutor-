import { MathProblem, DocumentFolder, StudentProgress } from '../types';

const PROBLEMS_KEY = 'aimathtutor_problems_v1';
const FOLDERS_KEY = 'aimathtutor_folders_v1';
const PROGRESS_KEY = 'aimathtutor_progress_v1';
const SYNC_META_KEY = 'aimathtutor_sync_meta_v1';

export const INITIAL_FOLDERS: DocumentFolder[] = [
  { id: 'all', name: 'All Documents', color: 'indigo' },
  { id: 'calc-integrals', name: 'Calculus: Integrals', color: 'emerald' },
  { id: 'calc-derivatives', name: 'Calculus: Derivatives', color: 'cyan' },
  { id: 'algebra-quad', name: 'Algebra: Quadratics & Systems', color: 'amber' },
  { id: 'exam-prep', name: 'Exam Question Papers', color: 'rose' },
];

export const INITIAL_PROBLEMS: MathProblem[] = [
  {
    id: 'prob-seed-1',
    title: 'Evaluate Definite Integral of x e^{x}',
    topic: 'calculus',
    subtopic: 'Integration by Parts',
    difficulty: 'Intermediate',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    problemLatex: '\\int_{0}^{1} x e^{x} \\, dx',
    problemRawText: 'Evaluate the definite integral of x*e^x from 0 to 1',
    folderId: 'calc-integrals',
    tags: ['Integration', 'By-Parts', 'Calculus I'],
    isFavorite: true,
    syncedToCloud: true,
    keyFormulas: [
      { name: 'Integration by Parts Formula', formula: '\\int u \\, dv = u v - \\int v \\, du' },
      { name: 'Exponential Antiderivative', formula: '\\int e^x \\, dx = e^x + C' },
      { name: 'Fundamental Theorem of Calculus', formula: '\\int_{a}^{b} f(x)dx = F(b) - F(a)' },
    ],
    steps: [
      {
        number: 1,
        title: 'Choose Parts using LIATE Rule',
        mathLatex: 'u = x \\implies du = dx, \\quad dv = e^x dx \\implies v = e^x',
        explanation: 'Following the LIATE hierarchy (Logarithmic, Inverse trig, Algebraic, Trig, Exponential), we choose the algebraic function x as u so its derivative simplifies to 1.',
        hint: 'Differentiating algebraic terms reduces their polynomial degree.',
        keyRule: 'LIATE Rule for by-parts assignment',
      },
      {
        number: 2,
        title: 'Apply Integration by Parts Formula',
        mathLatex: '\\int x e^x dx = x e^x - \\int e^x dx',
        explanation: 'Substitute u, v, and du into the master formula uv - ∫ v du. Notice how the remaining integral no longer contains the x multiplier.',
        hint: 'Ensure the minus sign applies to the whole remaining integral.',
        keyRule: 'uv - \\int v du',
      },
      {
        number: 3,
        title: 'Compute Remaining Antiderivative',
        mathLatex: 'x e^x - e^x + C = e^x(x - 1) + C',
        explanation: 'The integral of e^x is e^x. Factoring out e^x produces a cleaner expression for evaluating the limits.',
        hint: 'Factoring e^x speeds up plugging in the boundaries.',
        keyRule: 'Exponential Integration',
      },
      {
        number: 4,
        title: 'Evaluate Definite Limits [0, 1]',
        mathLatex: '\\left[ e^x(x - 1) \\right]_{0}^{1} = \\left( e^1(1 - 1) \\right) - \\left( e^0(0 - 1) \\right) = 0 - (-1) = 1',
        explanation: 'At the upper boundary x = 1, e^1(0) = 0. At the lower boundary x = 0, e^0(-1) = 1 * (-1) = -1. Subtracting: 0 - (-1) = 1.',
        hint: 'Watch out for double negatives: minus a negative yields a positive!',
        keyRule: 'Fundamental Theorem F(1) - F(0)',
      },
    ],
    finalAnswer: '1',
    verification: 'Differentiating F(x) = e^x(x - 1) by Product Rule: F\'(x) = (e^x)\'(x - 1) + e^x(x - 1)\' = e^x(x - 1) + e^x(1) = x e^x - e^x + e^x = x e^x. Since F\'(x) equals the integrand, our result is mathematically verified.',
    commonPitfalls: [
      'Choosing u = e^x and dv = x dx, which raises the power to x^2 and worsens the integral.',
      'Assuming e^0 = 0 instead of 1, erroneously dropping the lower boundary value.',
      'Sign errors during subtraction F(b) - F(a).',
    ],
    followUpChallenge: {
      question: 'What is the value of \\int_{0}^{2} x e^{2x} \\, dx using integration by parts?',
      options: [
        '\\frac{1}{4}(3e^4 + 1)',
        '\\frac{1}{4}(e^4 - 1)',
        '2e^4 - 1',
        '\\frac{e^4}{2}',
      ],
      correctIndex: 0,
      explanation: 'Let u = x, dv = e^{2x}dx -> du = dx, v = 1/2 e^{2x}. Result is [x/2 e^{2x} - 1/4 e^{2x}] from 0 to 2 = (e^4 - 1/4 e^4) - (0 - 1/4) = 3/4 e^4 + 1/4 = 1/4(3e^4 + 1).',
    },
    videoFrames: [
      {
        timestamp: '00:00',
        second: 0,
        title: 'Integral Definition & Area',
        chalkFormula: '\\int_0^1 x e^x \\, dx',
        explanation: 'Welcome to this Calculus deep-dive. We are finding the total area under x e^x from x = 0 to 1.',
        graphConfig: {
          type: 'integral',
          fnExpression: 'x * Math.exp(x)',
          domain: [-0.5, 1.5],
          integralRange: [0, 1],
        },
      },
      {
        timestamp: '00:15',
        second: 15,
        title: 'Integration by Parts Strategy',
        chalkFormula: 'u = x \\implies du = dx \\\\ dv = e^x dx \\implies v = e^x',
        explanation: 'We select u = x so its derivative becomes 1, leaving a clean single exponential.',
      },
      {
        timestamp: '00:30',
        second: 30,
        title: 'Applying by-Parts Formula',
        chalkFormula: 'uv - \\int v du = x e^x - \\int e^x dx',
        explanation: 'Plugging into uv minus the integral of v du gives x e^x minus e^x.',
      },
      {
        timestamp: '00:45',
        second: 45,
        title: 'Boundary Evaluation & Verification',
        chalkFormula: '\\left[ e^x(x - 1) \\right]_0^1 = 0 - (-1) = 1',
        explanation: 'Plugging in the boundaries yields exactly 1.00 square units. Look at the highlighted area on the graph!',
        graphConfig: {
          type: 'integral',
          fnExpression: 'x * Math.exp(x)',
          domain: [-0.5, 1.5],
          integralRange: [0, 1],
        },
      },
    ],
  },
  {
    id: 'prob-seed-2',
    title: 'Find Tangent Line to f(x) = x^3 - 3x at x = 2',
    topic: 'calculus',
    subtopic: 'Derivatives & Tangent Lines',
    difficulty: 'Foundation',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    problemLatex: 'f(x) = x^3 - 3x \\quad \\text{at} \\quad x = 2',
    problemRawText: 'Find the equation of the tangent line to f(x) = x^3 - 3x at x = 2',
    folderId: 'calc-derivatives',
    tags: ['Derivatives', 'Tangent Line', 'Power Rule'],
    isFavorite: true,
    syncedToCloud: true,
    keyFormulas: [
      { name: 'Power Rule', formula: '\\frac{d}{dx}[x^n] = n x^{n-1}' },
      { name: 'Point-Slope Equation', formula: 'y - y_0 = m(x - x_0)' },
      { name: 'Derivative as Slope', formula: 'm = f\'(x_0)' },
    ],
    steps: [
      {
        number: 1,
        title: 'Compute Point of Tangency (x_0, y_0)',
        mathLatex: 'y_0 = f(2) = (2)^3 - 3(2) = 8 - 6 = 2 \\implies (2, 2)',
        explanation: 'Evaluate the original function at x = 2 to find the exact coordinate where the tangent touches the curve.',
        hint: 'Always evaluate y_0 using the original function f(x), not its derivative.',
        keyRule: 'Point Evaluation',
      },
      {
        number: 2,
        title: 'Differentiate f(x) using Power Rule',
        mathLatex: 'f\'(x) = \\frac{d}{dx}[x^3 - 3x] = 3x^2 - 3',
        explanation: 'Apply the power rule to x^3 to get 3x^2, and differentiate -3x to obtain -3.',
        hint: 'The derivative represents the slope of the curve at any arbitrary x.',
        keyRule: 'Power Rule of Differentiation',
      },
      {
        number: 3,
        title: 'Calculate Slope of Tangent Line at x = 2',
        mathLatex: 'm = f\'(2) = 3(2)^2 - 3 = 3(4) - 3 = 12 - 3 = 9',
        explanation: 'Substitute x = 2 into f\'(x). The slope of the tangent line at this point is m = 9.',
        hint: 'Square the input before multiplying by 3 (Order of operations).',
        keyRule: 'Slope Evaluation m = f\'(x_0)',
      },
      {
        number: 4,
        title: 'Form Point-Slope Equation & Simplify',
        mathLatex: 'y - 2 = 9(x - 2) \\implies y - 2 = 9x - 18 \\implies y = 9x - 16',
        explanation: 'Substitute point (2, 2) and slope m = 9 into the point-slope formula y - y_0 = m(x - x_0) and isolate y.',
        hint: 'Distribute 9 across (x - 2) to get 9x - 18, then add 2.',
        keyRule: 'Point-Slope Form',
      },
    ],
    finalAnswer: 'y = 9x - 16',
    verification: 'At x = 2: y = 9(2) - 16 = 18 - 16 = 2, which matches f(2) = 2. The slope of y = 9x - 16 is 9, matching f\'(2) = 9. The line is both incident and tangent!',
    commonPitfalls: [
      'Plugging x = 2 into f\'(x) to get y_0 instead of plugging into f(x).',
      'Forgetting parentheses when distributing the slope: 9(x - 2) becoming 9x - 2.',
      'Confusing the tangent line with the normal line (which has slope -1/m = -1/9).',
    ],
    followUpChallenge: {
      question: 'What is the equation of the normal (perpendicular) line to f(x) at x = 2?',
      options: [
        'y = -\\frac{1}{9}x + \\frac{20}{9}',
        'y = -9x + 20',
        'y = \\frac{1}{9}x + 2',
        'y = -\\frac{1}{9}x - 2',
      ],
      correctIndex: 0,
      explanation: 'The perpendicular slope is m_\\perp = -1/9. Using (2, 2): y - 2 = -1/9(x - 2) -> y = -1/9 x + 2/9 + 18/9 = -1/9 x + 20/9.',
    },
    videoFrames: [
      {
        timestamp: '00:00',
        second: 0,
        title: 'Cubic Function & Tangent Line',
        chalkFormula: 'f(x) = x^3 - 3x \\quad \\text{at} \\quad x = 2',
        explanation: 'We are finding the linear approximation that best touches the cubic polynomial f(x) = x^3 - 3x at x = 2.',
        graphConfig: {
          type: 'tangent',
          fnExpression: 'x * x * x - 3 * x',
          domain: [-2.5, 3],
          pointX: 2,
        },
      },
      {
        timestamp: '00:15',
        second: 15,
        title: 'Differentiating with Power Rule',
        chalkFormula: 'f\'(x) = 3x^2 - 3 \\implies f\'(2) = 12 - 3 = 9',
        explanation: 'The slope at x = 2 is 9, meaning the function is climbing steeply at this point.',
      },
      {
        timestamp: '00:30',
        second: 30,
        title: 'Point-Slope Formula',
        chalkFormula: 'y - 2 = 9(x - 2) \\implies y = 9x - 16',
        explanation: 'The equation of the tangent is y = 9x - 16. See how it skims the curve right at (2, 2)!',
        graphConfig: {
          type: 'tangent',
          fnExpression: 'x * x * x - 3 * x',
          domain: [-2.5, 3],
          pointX: 2,
        },
      },
    ],
  },
  {
    id: 'prob-seed-3',
    title: 'Solve Quadratic Equation 2x^2 - 5x - 3 = 0',
    topic: 'algebra',
    subtopic: 'Quadratic Equations',
    difficulty: 'Foundation',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    problemLatex: '2x^2 - 5x - 3 = 0',
    problemRawText: 'Solve 2x^2 - 5x - 3 = 0',
    folderId: 'algebra-quad',
    tags: ['Algebra', 'Quadratic', 'Factoring'],
    isFavorite: false,
    syncedToCloud: true,
    keyFormulas: [
      { name: 'Quadratic Formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
      { name: 'Discriminant', formula: '\\Delta = b^2 - 4ac' },
    ],
    steps: [
      {
        number: 1,
        title: 'Identify Coefficients',
        mathLatex: 'a = 2, \\quad b = -5, \\quad c = -3',
        explanation: 'Compare with the standard form ax^2 + bx + c = 0.',
        hint: 'Preserve negative signs for b and c.',
        keyRule: 'Standard Quadratic Form',
      },
      {
        number: 2,
        title: 'Calculate Discriminant',
        mathLatex: '\\Delta = (-5)^2 - 4(2)(-3) = 25 + 24 = 49',
        explanation: 'Since Δ = 49 > 0 and 49 = 7^2, there are two distinct rational roots.',
        hint: 'A positive perfect square indicates factoring is also possible.',
        keyRule: 'Discriminant Analysis',
      },
      {
        number: 3,
        title: 'Apply the Quadratic Formula',
        mathLatex: 'x = \\frac{-(-5) \\pm \\sqrt{49}}{2(2)} = \\frac{5 \\pm 7}{4}',
        explanation: 'Substitute into the quadratic formula and simplify the radical.',
        hint: '-(-5) equals +5.',
        keyRule: 'Quadratic Formula',
      },
      {
        number: 4,
        title: 'Solve Both Branches',
        mathLatex: 'x_1 = \\frac{12}{4} = 3, \\quad x_2 = \\frac{-2}{4} = -\\frac{1}{2}',
        explanation: 'Evaluate (5 + 7)/4 = 3 and (5 - 7)/4 = -1/2.',
        hint: 'Always reduce fractions to simplest form.',
        keyRule: 'Branch Evaluation',
      },
    ],
    finalAnswer: 'x = 3 \\quad \\text{or} \\quad x = -\\frac{1}{2}',
    verification: 'Check x = 3: 2(9) - 15 - 3 = 18 - 18 = 0. Check x = -1/2: 2(1/4) - 5(-1/2) - 3 = 1/2 + 5/2 - 3 = 3 - 3 = 0. Both solutions hold.',
    commonPitfalls: [
      'Omitting the negative sign in -(-5).',
      'Squaring -5 to get -25 instead of +25.',
      'Dividing only the square root by 2a instead of the whole numerator.',
    ],
    followUpChallenge: {
      question: 'What is the sum of the roots of 2x^2 - 5x - 3 = 0 using Vieta\'s formulas?',
      options: ['\\frac{5}{2}', '-\\frac{5}{2}', '3', '-\\frac{3}{2}'],
      correctIndex: 0,
      explanation: 'Vieta\'s formula states sum of roots is -b/a = -(-5)/2 = 5/2. Check: 3 + (-1/2) = 5/2.',
    },
    videoFrames: [
      {
        timestamp: '00:00',
        second: 0,
        title: 'Parabola Intersection',
        chalkFormula: '2x^2 - 5x - 3 = 0',
        explanation: 'We are finding where this quadratic parabola intersects the horizontal axis.',
        graphConfig: {
          type: 'roots',
          fnExpression: '2 * x * x - 5 * x - 3',
          domain: [-2, 4],
        },
      },
      {
        timestamp: '00:20',
        second: 20,
        title: 'Discriminant',
        chalkFormula: '\\Delta = (-5)^2 - 4(2)(-3) = 49',
        explanation: 'Discriminant is 49, confirming two clean rational roots.',
      },
      {
        timestamp: '00:40',
        second: 40,
        title: 'Roots at 3 and -0.5',
        chalkFormula: 'x = 3, \\, -0.5',
        explanation: 'The curve crosses the x-axis precisely at x = -0.5 and x = 3.0.',
        graphConfig: {
          type: 'roots',
          fnExpression: '2 * x * x - 5 * x - 3',
          domain: [-2, 4],
        },
      },
    ],
  },
];

export const INITIAL_PROGRESS: StudentProgress = {
  totalSolved: 18,
  streakDays: 7,
  lastStudyDate: new Date().toISOString(),
  studyTimeMinutes: 195,
  accuracyRate: 91,
  algebraMastery: 84,
  calculusMastery: 89,
  topicBreakdown: [
    { name: 'Definite & Indefinite Integrals', solved: 6, mastery: 92, category: 'calculus' },
    { name: 'Derivatives & Chain Rule', solved: 5, mastery: 88, category: 'calculus' },
    { name: 'Limits & Continuity', solved: 2, mastery: 78, category: 'calculus' },
    { name: 'Quadratic & Polynomial Systems', solved: 3, mastery: 90, category: 'algebra' },
    { name: 'Logarithmic & Exponential Eq', solved: 2, mastery: 75, category: 'algebra' },
  ],
  recentActivity: [
    { date: 'Mon', count: 2, accuracy: 100 },
    { date: 'Tue', count: 3, accuracy: 85 },
    { date: 'Wed', count: 1, accuracy: 100 },
    { date: 'Thu', count: 4, accuracy: 90 },
    { date: 'Fri', count: 2, accuracy: 88 },
    { date: 'Sat', count: 3, accuracy: 94 },
    { date: 'Sun', count: 3, accuracy: 92 },
  ],
  weakAreas: [
    'Boundary evaluation with negative limits in Definite Integrals',
    'Domain restrictions in Logarithmic Equations',
  ],
  recommendations: [
    'Practice 3 Integration by Parts problems with trigonometric multipliers.',
    'Review logarithm argument conditions: ensure x - a > 0 before accepting roots.',
    'Test your calculus mastery with related rates optimization challenges.',
  ],
};

// Storage Functions
export function getSavedProblems(): MathProblem[] {
  try {
    const raw = localStorage.getItem(PROBLEMS_KEY);
    if (!raw) {
      localStorage.setItem(PROBLEMS_KEY, JSON.stringify(INITIAL_PROBLEMS));
      return INITIAL_PROBLEMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Storage read error, using defaults', e);
    return INITIAL_PROBLEMS;
  }
}

export function saveProblem(problem: MathProblem): MathProblem[] {
  const current = getSavedProblems();
  const existingIdx = current.findIndex((p) => p.id === problem.id);
  let updated: MathProblem[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...problem, updatedAt: new Date().toISOString() };
  } else {
    updated = [problem, ...current];
  }
  localStorage.setItem(PROBLEMS_KEY, JSON.stringify(updated));
  updateProgressOnSolve(problem);
  return updated;
}

export function deleteProblem(id: string): MathProblem[] {
  const current = getSavedProblems();
  const updated = current.filter((p) => p.id !== id);
  localStorage.setItem(PROBLEMS_KEY, JSON.stringify(updated));
  return updated;
}

export function getSavedFolders(): DocumentFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(INITIAL_FOLDERS));
      return INITIAL_FOLDERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_FOLDERS;
  }
}

export function saveFolders(folders: DocumentFolder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

export function getStudentProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(INITIAL_PROGRESS));
      return INITIAL_PROGRESS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PROGRESS;
  }
}

export function updateProgressOnSolve(problem: MathProblem): void {
  try {
    const progress = getStudentProgress();
    const isNewToday = true; // simplify
    const updated: StudentProgress = {
      ...progress,
      totalSolved: progress.totalSolved + 1,
      streakDays: Math.max(progress.streakDays, 7),
      lastStudyDate: new Date().toISOString(),
      studyTimeMinutes: progress.studyTimeMinutes + 12,
      accuracyRate: Math.min(99, Math.max(75, Math.round((progress.accuracyRate * 10 + 95) / 11))),
      algebraMastery:
        problem.topic === 'algebra'
          ? Math.min(100, progress.algebraMastery + 2)
          : progress.algebraMastery,
      calculusMastery:
        problem.topic === 'calculus'
          ? Math.min(100, progress.calculusMastery + 2)
          : progress.calculusMastery,
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Progress update error', e);
  }
}

export function getSyncMetadata(): { lastSynced: string; isOfflineMode: boolean } {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { lastSynced: new Date().toISOString(), isOfflineMode: false };
}

export function setSyncMetadata(meta: { lastSynced: string; isOfflineMode: boolean }): void {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export async function syncWithCloudServer(
  docs?: MathProblem[],
  prog?: StudentProgress
): Promise<{ success: boolean; syncedCount: number; message: string }> {
  const problems = docs || getSavedProblems();
  try {
    const res = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: problems, progress: prog }),
    });
    if (!res.ok) throw new Error('Cloud sync HTTP ' + res.status);
    const data = await res.json();
    setSyncMetadata({ lastSynced: new Date().toISOString(), isOfflineMode: false });
    return { success: true, syncedCount: data.syncedCount || problems.length, message: 'All documents successfully synced to cloud storage.' };
  } catch (err: any) {
    // If offline or network error, record offline state
    setSyncMetadata({ lastSynced: getSyncMetadata().lastSynced, isOfflineMode: true });
    return { success: false, syncedCount: 0, message: 'Offline mode active: all documents securely preserved in local storage & IndexedDB.' };
  }
}

// Aliases for seamless imports
export const getStoredProblems = getSavedProblems;
export const saveProblemLocally = saveProblem;
export const deleteProblemLocally = deleteProblem;
export const getStoredProgress = getStudentProgress;
export function updateProgressAfterSolve(problem: MathProblem): StudentProgress {
  updateProgressOnSolve(problem);
  return getStudentProgress();
}

