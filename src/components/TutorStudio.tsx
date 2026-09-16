import React, { useState } from 'react';
import { Sparkles, MessageSquare, Volume2, Video, BookOpen, ArrowRight } from 'lucide-react';
import { MathProblem } from '../types';
import { AiTextTutor } from './AiTextTutor';
import { AiVoiceTutor } from './AiVoiceTutor';
import { AiVideoTutor } from './AiVideoTutor';
import { MathView } from '../lib/mathParser';

interface TutorStudioProps {
  currentProblem: MathProblem | null;
  initialMode?: 'video' | 'voice' | 'text';
  initialStep?: number;
  onGoToSolver: () => void;
}

export const TutorStudio: React.FC<TutorStudioProps> = ({
  currentProblem,
  initialMode = 'video',
  initialStep = 0,
  onGoToSolver,
}) => {
  const [activeTutorType, setActiveTutorType] = useState<'video' | 'voice' | 'text'>(initialMode);

  return (
    <div className="space-y-6">
      {/* Studio Header Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">AI Tutor Studio</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Personalized guidance through Video Whiteboard, Voice Explanations, and Interactive Text
          </p>
        </div>

        {/* Tutor Modality Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTutorType('video')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTutorType === 'video'
                ? 'bg-white text-amber-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-amber-600" />
            <span>Video Tutor</span>
          </button>

          <button
            onClick={() => setActiveTutorType('voice')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTutorType === 'voice'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Voice Tutor</span>
          </button>

          <button
            onClick={() => setActiveTutorType('text')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTutorType === 'text'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Text Tutor</span>
          </button>
        </div>
      </div>

      {/* Current Problem Banner */}
      {currentProblem ? (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-900">Current Topic Focus:</span>
            <span className="font-semibold text-slate-800">{currentProblem.title}</span>
            <span className="px-2 py-0.5 rounded bg-white text-indigo-700 font-mono font-bold border border-indigo-200">
              {currentProblem.topic}
            </span>
          </div>

          <button
            onClick={onGoToSolver}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold self-start sm:self-center"
          >
            <span>View Full Solution in Solver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-center justify-between">
          <span>No specific problem selected. Load a problem to get tailored step-by-step commentary!</span>
          <button onClick={onGoToSolver} className="font-bold text-amber-800 hover:underline">
            Choose Problem →
          </button>
        </div>
      )}

      {/* Active Modality Render */}
      <div>
        {activeTutorType === 'video' && <AiVideoTutor currentProblem={currentProblem} />}
        {activeTutorType === 'voice' && (
          <AiVoiceTutor currentProblem={currentProblem} initialStep={initialStep} />
        )}
        {activeTutorType === 'text' && (
          <AiTextTutor currentProblem={currentProblem} targetStepNumber={initialStep} />
        )}
      </div>
    </div>
  );
};
