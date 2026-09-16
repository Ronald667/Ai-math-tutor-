import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Clock,
  Target,
  Flame,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { StudentProgress, MathProblem } from '../types';

interface DashboardProps {
  progress: StudentProgress;
  onLaunchPractice: (topic: 'calculus' | 'algebra', subtopic: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ progress, onLaunchPractice }) => {
  const [activeRange, setActiveRange] = useState<'7d' | '30d'>('7d');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const maxActivityCount = Math.max(...progress.recentActivity.map((a) => a.count), 5);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Student Progress & Analytics</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of problem-solving activity, topic mastery, and conceptual strengths
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveRange('7d')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeRange === '7d' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setActiveRange('30d')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeRange === '30d' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Monthly View
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Solved */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Problems Solved</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{progress.totalSolved}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
            <span>+4 this week</span>
            <span className="text-slate-400">• Across both topics</span>
          </div>
        </div>

        {/* Study Streak */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-1.5">
            <span>{progress.streakDays}</span>
            <span className="text-sm font-semibold text-slate-500">Days</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 font-medium">
            <span>🔥 Daily study goal active</span>
          </div>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Solution Accuracy</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{progress.accuracyRate}%</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-medium">
            <span>High verification rate</span>
          </div>
        </div>

        {/* Study Hours */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Study Time</span>
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {(progress.studyTimeMinutes / 60).toFixed(1)}
            <span className="text-sm font-semibold text-slate-500 ml-1">hrs</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 font-medium">
            <span>{progress.studyTimeMinutes} total minutes</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Activity Chart & Topic Mastery Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Problem Solving Activity</h3>
              <p className="text-xs text-slate-500">Daily breakdown of questions completed & accuracy</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Goal: 3 / day
            </span>
          </div>

          {/* SVG Interactive Bar Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100 relative">
            {progress.recentActivity.map((day, idx) => {
              const heightPct = Math.max(12, (day.count / maxActivityCount) * 100);
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-10 px-2.5 py-1 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg pointer-events-none whitespace-nowrap z-10 flex items-center gap-1">
                      <span className="font-bold">{day.count} solved</span>
                      <span className="text-emerald-400">({day.accuracy}%)</span>
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[42px] rounded-t-xl transition-all duration-200 ${
                      isHovered
                        ? 'bg-indigo-600 shadow-md shadow-indigo-600/30'
                        : 'bg-gradient-to-t from-indigo-500 to-cyan-400'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-500 mt-2">{day.date}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-4 px-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-cyan-400" />
              <span>Solved Problem Volume</span>
            </div>
            <span>Average weekly pace: 2.6 problems/day</span>
          </div>
        </div>

        {/* Overall Topic Mastery Bars (1 col) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Subject Mastery</h3>
            <p className="text-xs text-slate-500 mb-5">Comprehension score based on completed steps</p>

            <div className="space-y-5">
              {/* Calculus Mastery */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Calculus (Differential & Integral)</span>
                  <span className="text-indigo-600">{progress.calculusMastery}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress.calculusMastery}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Level: Advanced College Prep</span>
              </div>

              {/* Algebra Mastery */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-800">Algebra (Quadratics, Polynomials, Logs)</span>
                  <span className="text-amber-600">{progress.algebraMastery}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress.algebraMastery}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Level: High Competence</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Combined Standing</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Grade A (Proficient)
            </span>
          </div>
        </div>
      </div>

      {/* 4. Subtopics Breakdown & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subtopic Mastery Table */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Subtopic Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Mastery progression by specific mathematical concept</p>

          <div className="space-y-3.5">
            {progress.topicBreakdown.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.category === 'calculus' ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400 text-[11px]">{item.solved} solved</span>
                    <span className="font-bold text-indigo-700">{item.mastery}%</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.category === 'calculus' ? 'bg-indigo-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations & Weak Areas */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-amber-50 text-amber-600">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">Personalized AI Study Recommendations</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Adaptive insights based on past pitfalls and challenge quizzes</p>

            {/* Weak Areas Alerts */}
            <div className="mb-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                Target Concepts to Strengthen:
              </span>
              {progress.weakAreas.map((weak, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/60 text-xs text-rose-900 flex items-start gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{weak}</span>
                </div>
              ))}
            </div>

            {/* Recommendations List */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                Suggested Next Drills:
              </span>
              {progress.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-200/80 text-indigo-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={() => onLaunchPractice('calculus', 'Integration by Parts')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs transition-all shadow-xs"
            >
              <span>Practice Recommended Problem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
