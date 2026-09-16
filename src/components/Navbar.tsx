import React from 'react';
import {
  Camera,
  BookOpen,
  Sparkles,
  BarChart3,
  Cloud,
  CloudOff,
  FolderSync,
  Volume2,
  Video,
  MessageSquare,
  Sigma,
} from 'lucide-react';
import { MathTopic } from '../types';

export type ActiveTab = 'solver' | 'tutors' | 'dashboard' | 'library';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeTopicFilter: MathTopic | 'all';
  setActiveTopicFilter: (topic: MathTopic | 'all') => void;
  onOpenScanner: () => void;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  onManualSync: () => void;
  streakDays: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeTopicFilter,
  setActiveTopicFilter,
  onOpenScanner,
  cloudSyncStatus,
  onManualSync,
  streakDays,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Sigma className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">AI Math Tutor</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Algebra & Calculus
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Step-by-step guidance & multimodal scanner</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-sm font-medium">
            <button
              id="nav-tab-solver"
              onClick={() => setActiveTab('solver')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'solver'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Solver & Scanner</span>
            </button>

            <button
              id="nav-tab-tutors"
              onClick={() => setActiveTab('tutors')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'tutors'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI Tutor Studio</span>
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                <MessageSquare className="w-2.5 h-2.5" />
                <Volume2 className="w-2.5 h-2.5" />
                <Video className="w-2.5 h-2.5" />
              </span>
            </button>

            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Progress</span>
            </button>

            <button
              id="nav-tab-library"
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'library'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FolderSync className="w-4 h-4" />
              <span>Cloud Library</span>
            </button>
          </nav>

          {/* Right Actions: Streak, Cloud Sync, Scan Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            <div
              title={`${streakDays}-Day Study Streak!`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold"
            >
              <span className="text-sm">🔥</span>
              <span>{streakDays}d streak</span>
            </div>

            {/* Cloud Sync Status Indicator */}
            <button
              id="btn-cloud-sync"
              onClick={onManualSync}
              title={
                cloudSyncStatus === 'synced'
                  ? 'Documents Synced to Cloud. Click to re-sync.'
                  : cloudSyncStatus === 'syncing'
                  ? 'Syncing in progress...'
                  : 'Offline mode: stored in LocalStorage & IndexedDB. Click to sync.'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-blue-50 text-blue-800 border-blue-200/80 animate-pulse'
                  : 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
              }`}
            >
              {cloudSyncStatus === 'synced' && <Cloud className="w-3.5 h-3.5 text-emerald-600" />}
              {cloudSyncStatus === 'syncing' && <FolderSync className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
              {cloudSyncStatus === 'offline' && <CloudOff className="w-3.5 h-3.5 text-amber-600" />}
              <span className="hidden sm:inline">
                {cloudSyncStatus === 'synced' ? 'Cloud Synced' : cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Offline'}
              </span>
            </button>

            {/* Scan Question Paper Trigger */}
            <button
              id="btn-open-scanner"
              onClick={onOpenScanner}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-medium text-xs sm:text-sm shadow-xs shadow-indigo-600/20 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span className="font-semibold">Scan Paper</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('solver')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'solver' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Solver</span>
          </button>
          <button
            onClick={() => setActiveTab('tutors')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'tutors' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Tutors</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Progress</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-0.5 ${
              activeTab === 'library' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            <FolderSync className="w-4 h-4" />
            <span>Library</span>
          </button>
        </div>
      </div>
    </header>
  );
};
