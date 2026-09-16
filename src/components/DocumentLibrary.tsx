import React, { useState } from 'react';
import {
  FolderSync,
  Cloud,
  CloudOff,
  Download,
  Printer,
  Trash2,
  Search,
  BookOpen,
  Camera,
  FileText,
  CheckCircle,
  ExternalLink,
  Wifi,
  WifiOff,
  Filter,
  Sparkles,
} from 'lucide-react';
import { MathProblem, MathTopic } from '../types';
import { MathView } from '../lib/mathParser';
import { downloadProblemPDF } from '../lib/pdfGenerator';

interface DocumentLibraryProps {
  documents: MathProblem[];
  onSelectDocument: (doc: MathProblem) => void;
  onDeleteDocument: (id: string) => void;
  onSyncWithCloud: () => Promise<void>;
  isSyncing: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline';
  onOpenScanner: () => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({
  documents,
  onSelectDocument,
  onDeleteDocument,
  onSyncWithCloud,
  isSyncing,
  cloudSyncStatus,
  onOpenScanner,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<'all' | 'calculus' | 'algebra' | 'scans'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    // Category match
    if (selectedFolder === 'calculus' && doc.topic !== 'calculus') return false;
    if (selectedFolder === 'algebra' && doc.topic !== 'algebra') return false;
    if (selectedFolder === 'scans' && !doc.scannedImageUrl) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchSubtopic = doc.subtopic.toLowerCase().includes(q);
      const matchLatex = doc.problemLatex.toLowerCase().includes(q);
      return matchTitle || matchSubtopic || matchLatex;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Cloud Sync Center */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FolderSync className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Study Document Library & Cloud Storage
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organized repository of all scanned exam papers, solved worksheets, and printable study guides
          </p>
        </div>

        {/* Cloud Sync Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSyncWithCloud}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs'
            }`}
          >
            {isSyncing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Syncing Documents...</span>
              </>
            ) : cloudSyncStatus === 'synced' ? (
              <>
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>Sync Complete</span>
              </>
            ) : (
              <>
                <FolderSync className="w-4 h-4" />
                <span>Sync to Cloud Storage</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Offline Access Guarantee Callout Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-5 border border-indigo-100 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
                Offline Mode Active for Remote Study Sessions
              </h4>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Local Cache Ready
              </span>
            </div>
            <p className="text-xs text-indigo-900/80 mt-0.5">
              All generated worksheets, formulas, and solutions are safely preserved locally in browser storage.
              You can study, review, and print even without active internet connectivity!
            </p>
          </div>
        </div>

        <span className="hidden md:inline text-xs font-mono text-indigo-600 font-bold bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shrink-0 shadow-2xs">
          {documents.length} Docs Cached
        </span>
      </div>

      {/* 3. Folder Navigation & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Folders */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
          <button
            onClick={() => setSelectedFolder('all')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFolder === 'all'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Worksheets ({documents.length})
          </button>
          <button
            onClick={() => setSelectedFolder('calculus')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFolder === 'calculus'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Calculus ({documents.filter((d) => d.topic === 'calculus').length})
          </button>
          <button
            onClick={() => setSelectedFolder('algebra')}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFolder === 'algebra'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Algebra ({documents.filter((d) => d.topic === 'algebra').length})
          </button>
          <button
            onClick={() => setSelectedFolder('scans')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl transition-all ${
              selectedFolder === 'scans'
                ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Camera className="w-3 h-3" />
            <span>Scanned Papers ({documents.filter((d) => !!d.scannedImageUrl).length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or equations..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
        </div>
      </div>

      {/* 4. Document Cards Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                {/* Header Tag row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {doc.topic}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{doc.difficulty}</span>
                  </div>

                  {/* Cloud status badge */}
                  <span
                    className="flex items-center gap-1 text-[11px] font-medium text-emerald-700"
                    title="Stored locally with cloud sync backup"
                  >
                    <Cloud className="w-3 h-3 text-emerald-600" />
                    <span>Cloud Ready</span>
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => onSelectDocument(doc)}
                  className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 cursor-pointer transition-colors line-clamp-1"
                >
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{doc.subtopic}</p>

                {/* LaTeX preview box */}
                <div
                  onClick={() => onSelectDocument(doc)}
                  className="mt-3 p-3 rounded-xl bg-slate-900 text-white font-mono text-xs overflow-x-auto text-center cursor-pointer hover:bg-slate-800 transition-colors"
                >
                  <MathView math={doc.problemLatex} />
                </div>

                {/* Scanned Paper preview thumbnail if exists */}
                {doc.scannedImageUrl && (
                  <div className="mt-2.5 flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <img
                      src={doc.scannedImageUrl}
                      alt="Scanned Sheet"
                      className="w-8 h-8 object-cover rounded"
                    />
                    <span className="text-[11px] text-slate-600 font-medium">Scanned paper attached</span>
                  </div>
                )}
              </div>

              {/* Bottom Card Actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {/* Export PDF Button */}
                  <button
                    onClick={() => downloadProblemPDF(doc)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors"
                    title="Export to PDF file for easy sharing and printing"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => {
                      onSelectDocument(doc);
                      setTimeout(() => window.print(), 300);
                    }}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors"
                    title="Print Worksheet"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => onSelectDocument(doc)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Open Solver</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Documents Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No documents match your search query. Try clearing the filter.'
              : 'Start by solving a problem or scanning your exam test paper!'}
          </p>
          <div className="mt-4">
            <button
              onClick={onOpenScanner}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Question Paper</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
