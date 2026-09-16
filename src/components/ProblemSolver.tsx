import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Printer,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Video,
  Volume2,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MathProblem, MathTopic } from '../types';
import { MathView, MixedMathText } from '../lib/mathParser';
import { downloadProblemPDF } from '../lib/pdfGenerator';

interface ProblemSolverProps {
  currentProblem: MathProblem | null;
  onSelectProblem: (problem: MathProblem) => void;
  onSolveNewProblem: (text: string, topic: MathTopic) => Promise<void>;
  isLoading: boolean;
  onOpenScanner: () => void;
  onLaunchVideoTutor: (problem: MathProblem) => void;
  onLaunchVoiceTutor: (problem: MathProblem, stepNumber?: number) => void;
  onLaunchTextTutor: (problem: MathProblem, stepNumber?: number) => void;
  onSaveToLibrary: (problem: MathProblem) => void;
}

const QUICK_MATH_SYMBOLS = [
  { label: '∫ dx', latex: '\\int f(x) \\, dx' },
  { label: 'd/dx', latex: '\\frac{d}{dx}[x^2]' },
  { label: 'lim', latex: '\\lim_{x \\to 0}' },
  { label: '√x', latex: '\\sqrt{x}' },
  { label: 'x²', latex: 'x^2' },
  { label: 'a/b', latex: '\\frac{a}{b}' },
  { label: 'ln(x)', latex: '\\ln(x)' },
  { label: 'sin(x)', latex: '\\sin(x)' },
  { label: 'π', latex: '\\pi' },
  { label: '∞', latex: '\\infty' },
  { label: '±', latex: '\\pm' },
];

export const ProblemSolver: React.FC<ProblemSolverProps> = ({
  currentProblem,
  onSolveNewProblem,
  isLoading,
  onOpenScanner,
  onLaunchVideoTutor,
  onLaunchVoiceTutor,
  onLaunchTextTutor,
  onSaveToLibrary,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<MathTopic>('calculus');
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);
  const [savedLocally, setSavedLocally] = useState<boolean>(false);
  const [expandedHints, setExpandedHints] = useState<Record<number, boolean>>({});

  // Follow-up Quiz State
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const handleQuickInsert = (symbolLatex: string) => {
    setInputText((prev) => (prev ? `${prev} ${symbolLatex}` : symbolLatex));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await onSolveNewProblem(inputText, selectedTopic);
    setSelectedQuizOption(null);
    setQuizSubmitted(false);
  };

  const handleCopyAnswer = () => {
    if (!currentProblem?.finalAnswer) return;
    navigator.clipboard.writeText(currentProblem.finalAnswer);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleSaveDoc = () => {
    if (!currentProblem) return;
    onSaveToLibrary(currentProblem);
    setSavedLocally(true);
    setTimeout(() => setSavedLocally(false), 2500);
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedQuizOption(optionIdx);
    setQuizSubmitted(true);

    if (currentProblem?.followUpChallenge && optionIdx === currentProblem.followUpChallenge.correctIndex) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    }
  };

  const toggleHint = (stepNum: number) => {
    setExpandedHints((prev) => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Problem Input & Quick Math Toolbar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Math Solver & Step-by-Step Reasoner
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Type any algebra or calculus equation, or scan homework with camera
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedTopic('calculus')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedTopic === 'calculus'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Calculus
              </button>
              <button
                type="button"
                onClick={() => setSelectedTopic('algebra')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedTopic === 'algebra'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Algebra
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200/80 transition-colors"
            >
              <span>Scan Paper</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                selectedTopic === 'calculus'
                  ? 'e.g. Evaluate definite integral of x*e^x from 0 to 1, or find tangent to y = x^3 - 3x at x = 2'
                  : 'e.g. Solve 2x^2 - 5x - 3 = 0, or find the intersection of y = x^2 - 4x + 3 and y = 2x - 5'
              }
              className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50 resize-none font-mono"
            />
          </div>

          {/* Math Symbol Quick Insertion Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Insert:
            </span>
            {QUICK_MATH_SYMBOLS.map((sym, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickInsert(sym.latex)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 text-slate-700 font-mono text-xs shrink-0 transition-colors"
              >
                {sym.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Supports LaTeX, plain equations, or natural word problems</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-sm shadow-sm shadow-indigo-600/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Solving Step-by-Step...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Solve Problem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Solved Problem Detail Section */}
      {currentProblem ? (
        <div className="space-y-6">
          {/* Action Header Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                  {currentProblem.topic}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {currentProblem.subtopic}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  {currentProblem.difficulty}
                </span>
              </div>

              {/* Action Buttons: PDF Export, Print, Tutors */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-export-pdf"
                  onClick={() => downloadProblemPDF(currentProblem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
                  title="Export results to a PDF file for easy sharing and printing"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
                  title="Print worksheet directly"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <button
                  onClick={handleSaveDoc}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
                  title="Save to Cloud Document Library"
                >
                  {savedLocally ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Saved</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>

                {/* Video Tutor Launch Button */}
                <button
                  onClick={() => onLaunchVideoTutor(currentProblem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold transition-colors"
                  title="Launch Animated Chalkboard Video Tutor"
                >
                  <Video className="w-3.5 h-3.5 text-amber-600" />
                  <span>Video Tutor</span>
                </button>

                {/* Voice Tutor Launch Button */}
                <button
                  onClick={() => onLaunchVoiceTutor(currentProblem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/80 text-xs font-bold transition-colors"
                  title="Listen to AI Voice Tutor explanation"
                >
                  <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Voice Tutor</span>
                </button>
              </div>
            </div>

            {/* Problem Title & LaTeX Presentation Box */}
            <div className="pt-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">{currentProblem.title}</h2>
              <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center justify-center text-center overflow-x-auto shadow-inner">
                <MathView math={currentProblem.problemLatex} block={true} className="text-lg sm:text-2xl text-cyan-300" />
              </div>
            </div>

            {/* Scanned Paper Thumbnail if present */}
            {currentProblem.scannedImageUrl && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src={currentProblem.scannedImageUrl}
                  alt="Scanned Homework Sheet"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-2xs"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Scanned Question Paper Attached</span>
                  <p className="text-slate-500 mt-0.5">Original handwritten snapshot preserved in study document</p>
                </div>
              </div>
            )}

            {/* Key Formulas & Theorems */}
            {currentProblem.keyFormulas && currentProblem.keyFormulas.length > 0 && (
              <div className="mt-5 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block mb-2">
                  Essential Theorems & Formulas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentProblem.keyFormulas.map((form, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-white border border-indigo-200/70 shadow-2xs flex flex-col justify-center"
                    >
                      <span className="text-[11px] font-semibold text-slate-600 mb-1">{form.name}</span>
                      <MathView math={form.formula} className="text-xs font-mono text-indigo-700" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Step-by-Step Solutions Accordion */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Step-by-Step Solution Breakdown</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {currentProblem.steps.length} Steps
                </span>
              </h3>
              <span className="text-xs text-slate-400">Click &quot;Ask Tutor&quot; on any step for Socratic help</span>
            </div>

            {currentProblem.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {step.number || idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{step.title}</h4>
                      {step.keyRule && (
                        <span className="text-[11px] font-medium text-slate-500">Rule: {step.keyRule}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onLaunchTextTutor(currentProblem, step.number || idx + 1)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                      title="Ask Text Tutor about this specific step"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Ask Tutor</span>
                    </button>
                    <button
                      onClick={() => onLaunchVoiceTutor(currentProblem, step.number || idx + 1)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                      title="Listen to audio explanation of this step"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Step Math Expression */}
                <div className="my-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 overflow-x-auto text-center font-mono">
                  <MathView math={step.mathLatex} block={true} className="text-base sm:text-lg text-indigo-900" />
                </div>

                {/* Step Explanation Text */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{step.explanation}</p>

                {/* Toggleable Hint / Mnemonic */}
                {step.hint && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => toggleHint(step.number || idx + 1)}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>{expandedHints[step.number || idx + 1] ? 'Hide Tip' : 'Show Pro Tip / Mnemonic'}</span>
                      {expandedHints[step.number || idx + 1] ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedHints[step.number || idx + 1] && (
                      <div className="mt-2 p-3 rounded-lg bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900">
                        {step.hint}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 4. Final Answer Highlight Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-md shadow-emerald-600/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-emerald-100 block mb-1">
                  Final Verified Answer
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight bg-black/20 px-4 py-2 rounded-xl inline-block mt-1">
                  <MathView math={currentProblem.finalAnswer} className="text-white" />
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleCopyAnswer}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white text-xs font-semibold transition-colors"
                >
                  {copiedAnswer ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAnswer ? 'Copied!' : 'Copy LaTeX'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Mathematical Verification Proof */}
          {currentProblem.verification && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold">Rigorous Mathematical Verification</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                <MixedMathText text={currentProblem.verification} />
              </p>
            </div>
          )}

          {/* 6. Common Pitfalls & Traps Alert */}
          {currentProblem.commonPitfalls && currentProblem.commonPitfalls.length > 0 && (
            <div className="bg-rose-50/70 rounded-2xl p-5 border border-rose-200/80 shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-rose-950">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-bold">Common Student Pitfalls to Avoid</h4>
              </div>
              <ul className="space-y-2">
                {currentProblem.commonPitfalls.map((pitfall, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. Real-Time Feedback: Follow-Up Practice Challenge */}
          {currentProblem.followUpChallenge && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Test Your Understanding: Quick Follow-Up Drill
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  Instant Feedback
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-800 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MixedMathText text={currentProblem.followUpChallenge.question} />
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {currentProblem.followUpChallenge.options.map((opt, optIdx) => {
                  const isSelected = selectedQuizOption === optIdx;
                  const isCorrect = optIdx === currentProblem.followUpChallenge!.correctIndex;
                  let btnStyle = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                    } else if (isSelected && !isCorrect) {
                      btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 line-through';
                    }
                  } else if (isSelected) {
                    btnStyle = 'bg-indigo-50 border-indigo-400 text-indigo-900';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={quizSubmitted}
                      onClick={() => handleQuizAnswer(optIdx)}
                      className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-sans font-bold text-[11px] flex items-center justify-center shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <MathView math={opt} />
                      </div>

                      {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <div
                  className={`p-4 rounded-xl text-xs sm:text-sm leading-relaxed border ${
                    selectedQuizOption === currentProblem.followUpChallenge.correctIndex
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/80 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {selectedQuizOption === currentProblem.followUpChallenge.correctIndex ? (
                      <span className="text-emerald-700">🎉 Correct! Outstanding work!</span>
                    ) : (
                      <span className="text-amber-800">Review the reasoning:</span>
                    )}
                  </div>
                  <MixedMathText text={currentProblem.followUpChallenge.explanation} />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Sparkles className="w-12 h-12 mx-auto text-indigo-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Math Problem Loaded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Type an equation above, or click &quot;Scan Paper&quot; to take a photo of your math test.
          </p>
        </div>
      )}
    </div>
  );
};
