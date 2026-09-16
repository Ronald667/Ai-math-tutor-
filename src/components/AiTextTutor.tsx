import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Bot, User, CornerDownLeft, RefreshCw } from 'lucide-react';
import { MathProblem, TutorMessage } from '../types';
import { MathView, MixedMathText } from '../lib/mathParser';

interface AiTextTutorProps {
  currentProblem: MathProblem | null;
  targetStepNumber?: number;
}

const DEFAULT_PROMPT_CHIPS = [
  'Why did we use this specific rule or substitution?',
  'Can you explain this using an intuitive visual analogy?',
  'Show me an alternative method to solve this.',
  'What is the most common pitfall students make on this problem?',
  'Give me a similar practice problem to test myself.',
];

export const AiTextTutor: React.FC<AiTextTutorProps> = ({ currentProblem, targetStepNumber }) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'msg-init',
      sender: 'tutor',
      text: currentProblem
        ? `Hello! I'm your AI Math Tutor. I'm ready to walk you through **${currentProblem.title}**. ${
            targetStepNumber
              ? `I see you are focusing on **Step ${targetStepNumber}**. What part would you like to clarify?`
              : 'Ask me anything about the principles, steps, or intuition behind this problem!'
          }`
        : "Hello! I am your AI Math Tutor. Ask me any conceptual or practical question about Algebra or Calculus!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepReference: targetStepNumber,
    },
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // When targetStepNumber changes, post a helpful message
  useEffect(() => {
    if (targetStepNumber && currentProblem) {
      const step = currentProblem.steps.find((s) => s.number === targetStepNumber);
      if (step) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'msg-step-' + Date.now(),
            sender: 'tutor',
            text: `Let's focus on **Step ${step.number}: ${step.title}** ($${step.mathLatex}$). What would you like to unpack here?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            stepReference: targetStepNumber,
          },
        ]);
      }
    }
  }, [targetStepNumber, currentProblem]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: TutorMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          currentProblem,
          question: trimmed,
        }),
      });

      const data = await res.json();
      const tutorReply: TutorMessage = {
        id: 'tutor-' + Date.now(),
        sender: 'tutor',
        text: data.reply || 'Let us explore this further. Remember to verify the underlying definitions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, tutorReply]);
    } catch (err) {
      console.warn('Text tutor notice:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'tutor-err-' + Date.now(),
          sender: 'tutor',
          text: 'Remember to check the order of operations and keep track of negative signs during substitution.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">AI Socratic Text Tutor</h3>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {currentProblem ? `Discussing: ${currentProblem.title}` : 'General Algebra & Calculus Q&A'}
            </p>
          </div>
        </div>

        {currentProblem && (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60">
            {currentProblem.topic}
          </span>
        )}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'tutor' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white shadow-xs rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-tl-xs'
              }`}
            >
              {msg.stepReference && msg.sender === 'tutor' && (
                <div className="mb-1.5 pb-1 border-b border-indigo-100 text-[11px] font-bold text-indigo-700">
                  Step {msg.stepReference} Focus
                </div>
              )}
              <MixedMathText text={msg.text} />
              <div
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs rounded-tl-xs text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Tutor is formulating response...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1">Ask:</span>
        {DEFAULT_PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 text-xs shrink-0 border border-slate-200 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a question about this step or concept..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white disabled:opacity-40 transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
