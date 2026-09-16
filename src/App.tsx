import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { CameraScanner } from './components/CameraScanner';
import { ProblemSolver } from './components/ProblemSolver';
import { TutorStudio } from './components/TutorStudio';
import { Dashboard } from './components/Dashboard';
import { DocumentLibrary } from './components/DocumentLibrary';
import { MathProblem, MathTopic, StudentProgress } from './types';
import {
  getStoredProblems,
  saveProblemLocally,
  deleteProblemLocally,
  getStoredProgress,
  updateProgressAfterSolve,
  syncWithCloudServer,
} from './lib/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('solver');
  const [activeTopicFilter, setActiveTopicFilter] = useState<MathTopic | 'all'>('all');
  const [documents, setDocuments] = useState<MathProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [progress, setProgress] = useState<StudentProgress>(getStoredProgress());
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isLoadingSolver, setIsLoadingSolver] = useState<boolean>(false);
  const [solverError, setSolverError] = useState<string | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [tutorStudioConfig, setTutorStudioConfig] = useState<{
    mode: 'video' | 'voice' | 'text';
    step?: number;
  }>({
    mode: 'video',
    step: 0,
  });

  // Load initial documents and progress from local persistence
  useEffect(() => {
    const stored = getStoredProblems();
    setDocuments(stored);
    if (stored.length > 0) {
      setCurrentProblem(stored[0]);
    }
    setProgress(getStoredProgress());
  }, []);

  // Solve a new problem from text/equation input
  const handleSolveNewProblem = async (problemText: string, topic: MathTopic) => {
    setIsLoadingSolver(true);
    setSolverError(null);
    try {
      const res = await fetch('/api/solve-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText, topic }),
      });

      if (!res.ok) throw new Error('Failed to solve math problem');
      const data = await res.json();

      if (data.success && data.data) {
        const newProblem: MathProblem = data.data;
        handleSaveToLibrary(newProblem);
        setCurrentProblem(newProblem);
        setActiveTab('solver');
      }
    } catch (err: any) {
      console.warn('Solver request notice:', err?.message || err);
      setSolverError('Could not formulate step-by-step solution. Please verify mathematical syntax or try again.');
    } finally {
      setIsLoadingSolver(false);
    }
  };

  // When a problem is solved via Camera Scanner or Gallery
  const handleProblemSolvedFromScanner = (problem: MathProblem) => {
    handleSaveToLibrary(problem);
    setCurrentProblem(problem);
    setActiveTab('solver');
  };

  // Save problem to documents & update student progress
  const handleSaveToLibrary = (problem: MathProblem) => {
    const updated = saveProblemLocally(problem);
    setDocuments(updated);
    const updatedProg = updateProgressAfterSolve(problem);
    setProgress(updatedProg);
  };

  // Delete problem from documents
  const handleDeleteDocument = (id: string) => {
    const updated = deleteProblemLocally(id);
    setDocuments(updated);
    if (currentProblem?.id === id) {
      setCurrentProblem(updated.length > 0 ? updated[0] : null);
    }
  };

  // Cloud Sync Handler
  const handleManualSync = async () => {
    setCloudSyncStatus('syncing');
    try {
      const result = await syncWithCloudServer(documents, progress);
      if (result.success) {
        setCloudSyncStatus('synced');
      } else {
        setCloudSyncStatus('offline');
      }
    } catch (e) {
      setCloudSyncStatus('offline');
    }
  };

  // Navigation to Tutor Studio with specific context
  const handleLaunchVideoTutor = (problem: MathProblem) => {
    setCurrentProblem(problem);
    setTutorStudioConfig({ mode: 'video', step: 0 });
    setActiveTab('tutors');
  };

  const handleLaunchVoiceTutor = (problem: MathProblem, stepNumber?: number) => {
    setCurrentProblem(problem);
    setTutorStudioConfig({ mode: 'voice', step: stepNumber ?? 0 });
    setActiveTab('tutors');
  };

  const handleLaunchTextTutor = (problem: MathProblem, stepNumber?: number) => {
    setCurrentProblem(problem);
    setTutorStudioConfig({ mode: 'text', step: stepNumber });
    setActiveTab('tutors');
  };

  // Launch recommended practice from dashboard
  const handleLaunchPracticeFromDashboard = async (topic: 'calculus' | 'algebra', subtopic: string) => {
    // Find existing problem or formulate a prompt
    const matching = documents.find((d) => d.topic === topic);
    if (matching) {
      setCurrentProblem(matching);
      setActiveTab('solver');
    } else {
      await handleSolveNewProblem(`Solve practice problem on ${subtopic}`, topic);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTopicFilter={activeTopicFilter}
        setActiveTopicFilter={setActiveTopicFilter}
        onOpenScanner={() => setIsScannerOpen(true)}
        cloudSyncStatus={cloudSyncStatus}
        onManualSync={handleManualSync}
        streakDays={progress.streakDays}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {solverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
            <span>{solverError}</span>
            <button
              onClick={() => setSolverError(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-4 px-2 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === 'solver' && (
          <ProblemSolver
            currentProblem={currentProblem}
            onSelectProblem={setCurrentProblem}
            onSolveNewProblem={handleSolveNewProblem}
            isLoading={isLoadingSolver}
            onOpenScanner={() => setIsScannerOpen(true)}
            onLaunchVideoTutor={handleLaunchVideoTutor}
            onLaunchVoiceTutor={handleLaunchVoiceTutor}
            onLaunchTextTutor={handleLaunchTextTutor}
            onSaveToLibrary={handleSaveToLibrary}
          />
        )}

        {activeTab === 'tutors' && (
          <TutorStudio
            currentProblem={currentProblem}
            initialMode={tutorStudioConfig.mode}
            initialStep={tutorStudioConfig.step}
            onGoToSolver={() => setActiveTab('solver')}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            progress={progress}
            onLaunchPractice={handleLaunchPracticeFromDashboard}
          />
        )}

        {activeTab === 'library' && (
          <DocumentLibrary
            documents={documents}
            onSelectDocument={(doc) => {
              setCurrentProblem(doc);
              setActiveTab('solver');
            }}
            onDeleteDocument={handleDeleteDocument}
            onSyncWithCloud={handleManualSync}
            isSyncing={cloudSyncStatus === 'syncing'}
            cloudSyncStatus={cloudSyncStatus}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}
      </main>

      {/* Camera & Gallery Question Paper Scanner Modal */}
      <CameraScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onProblemSolved={handleProblemSolvedFromScanner}
        defaultTopic={currentProblem?.topic || 'calculus'}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Math Tutor • Step-by-Step Algebra & Calculus Intelligence</span>
          <div className="flex items-center gap-3">
            <span>Local & Cloud Synced</span>
            <span>•</span>
            <span>Offline Ready</span>
            <span>•</span>
            <span>Multimodal Camera & PDF Export</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

