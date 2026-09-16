import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  X,
  RotateCw,
  Sparkles,
  Upload,
  AlertCircle,
  FileText,
  CheckCircle2,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { MathTopic, MathProblem } from '../types';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onProblemSolved: (problem: MathProblem) => void;
  defaultTopic?: MathTopic;
}

// Realistic sample exam papers for instant testing
const SAMPLE_QUESTION_PAPERS = [
  {
    id: 'sample-calc-1',
    title: 'Calculus Midterm: Integration by Parts',
    topic: 'calculus' as MathTopic,
    questionText: 'Evaluate the definite integral: \\int_{0}^{1} x e^{x} \\, dx',
    badge: 'Exam Problem #3',
    difficulty: 'Intermediate',
  },
  {
    id: 'sample-calc-2',
    title: 'AP Calculus BC: Tangent Line & Slope',
    topic: 'calculus' as MathTopic,
    questionText: 'Find the equation of the line tangent to f(x) = x^3 - 3x at the point where x = 2.',
    badge: 'Section B: Free Response',
    difficulty: 'Foundation',
  },
  {
    id: 'sample-alg-1',
    title: 'Algebra II: Quadratic Roots & Factoring',
    topic: 'algebra' as MathTopic,
    questionText: 'Solve for x: 2x^2 - 5x - 3 = 0 using the quadratic formula and check both roots.',
    badge: 'Unit 4 Exam',
    difficulty: 'Foundation',
  },
  {
    id: 'sample-alg-2',
    title: 'Algebra: System of Linear & Quadratic Eq',
    topic: 'algebra' as MathTopic,
    questionText: 'Find the intersection points of the parabola y = x^2 - 4x + 3 and the line y = 2x - 5.',
    badge: 'Challenge Set',
    difficulty: 'Advanced',
  },
];

export const CameraScanner: React.FC<CameraScannerProps> = ({
  isOpen,
  onClose,
  onProblemSolved,
  defaultTopic = 'calculus',
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'gallery' | 'samples'>('camera');
  const [selectedTopic, setSelectedTopic] = useState<MathTopic>(defaultTopic);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFacingUser, setIsFacingUser] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepMessage, setScanStepMessage] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or stop camera based on modal state and active tab
  useEffect(() => {
    if (isOpen && activeMode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, capturedImage, isFacingUser]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFacingUser ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable. You can use the Gallery upload or select a sample exam question paper below.');
      setCameraActive(false);
      setActiveMode('gallery');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleProcessScan = async (sampleData?: { questionText: string; topic: MathTopic }) => {
    setIsScanning(true);
    setScanStepMessage('Analyzing handwriting & question layout...');

    setScanError(null);
    try {
      setTimeout(() => {
        setScanStepMessage('Transcribing symbols into formal LaTeX equations...');
      }, 700);

      setTimeout(() => {
        setScanStepMessage('Formulating step-by-step solution & pedagogical guidance...');
      }, 1500);

      const payload: any = {
        topic: sampleData ? sampleData.topic : selectedTopic,
        problemText: sampleData ? sampleData.questionText : additionalNotes,
      };

      if (!sampleData && capturedImage) {
        payload.imageBase64 = capturedImage;
        payload.imageMimeType = 'image/jpeg';
      }

      const res = await fetch('/api/solve-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Solver error: ' + res.status);
      const data = await res.json();

      if (data.success && data.data) {
        // Attach scanned image if exists
        const problemResult = {
          ...data.data,
          scannedImageUrl: capturedImage || undefined,
        };
        onProblemSolved(problemResult);
        onClose();
      }
    } catch (err: any) {
      console.warn('Scan processing notice:', err?.message || err);
      setScanError('Could not process this scanned image. Please check camera lighting or enter the equation directly.');
    } finally {
      setIsScanning(false);
      setScanStepMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Scan Question Paper & Problem Sheet</h2>
              <p className="text-xs text-slate-500">Capture exam papers or select from gallery for AI transcription</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100/60 border-b border-slate-200/80 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveMode('camera');
                setCapturedImage(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeMode === 'camera'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Live Camera</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('gallery');
                stopCamera();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeMode === 'gallery'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gallery Upload</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('samples');
                stopCamera();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeMode === 'samples'
                  ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sample Question Papers</span>
            </button>
          </div>

          {/* Topic Selector */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedTopic('calculus')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedTopic === 'calculus'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calculus
            </button>
            <button
              onClick={() => setSelectedTopic('algebra')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedTopic === 'algebra'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Algebra
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          {/* CAMERA MODE */}
          {activeMode === 'camera' && (
            <div className="space-y-4">
              {!capturedImage ? (
                <div className="relative w-full h-80 sm:h-96 rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Document Scanning Target Frame */}
                      <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-cyan-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-t-2 border-l-2 border-cyan-400"></span>
                          <span className="w-4 h-4 border-t-2 border-r-2 border-cyan-400"></span>
                        </div>
                        <div className="text-center text-xs font-medium text-white/90 bg-black/60 px-3 py-1.5 rounded-full mx-auto backdrop-blur-xs">
                          Align question paper inside the frame
                        </div>
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-b-2 border-l-2 border-cyan-400"></span>
                          <span className="w-4 h-4 border-b-2 border-r-2 border-cyan-400"></span>
                        </div>
                      </div>

                      {/* Camera Controls Overlay */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                        <button
                          onClick={() => setIsFacingUser(!isFacingUser)}
                          title="Flip Camera"
                          className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs border border-white/20 transition-all"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={handleCaptureSnapshot}
                          className="w-16 h-16 rounded-full bg-white text-indigo-600 p-1.5 shadow-lg active:scale-95 transition-transform flex items-center justify-center border-4 border-indigo-200"
                        >
                          <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                            <Camera className="w-5 h-5" />
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <Camera className="w-10 h-10 mx-auto mb-2 text-slate-500 animate-pulse" />
                      <p className="text-sm font-medium text-slate-300">Starting camera preview...</p>
                      <p className="text-xs text-slate-500 mt-1">Make sure camera permissions are allowed in browser</p>
                      {cameraError && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2 text-left">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{cameraError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-80 flex items-center justify-center">
                    <img src={capturedImage} alt="Captured Question" className="max-h-80 object-contain" />
                    <button
                      onClick={() => {
                        setCapturedImage(null);
                        startCamera();
                      }}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium hover:bg-black/90 flex items-center gap-1.5 backdrop-blur-xs border border-white/20"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Optional: Add extra context or specify question number
                    </label>
                    <input
                      type="text"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="e.g., Problem 4b: Find derivative using product rule"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GALLERY MODE */}
          {activeMode === 'gallery' && (
            <div className="space-y-4">
              {!capturedImage ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50/50 hover:bg-indigo-50/20 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Click to upload or drag & drop question paper</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Supports high-resolution PNG, JPG, JPEG photo scans of handwritten math worksheets or printed exam tests
                  </p>
                  <span className="mt-3 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs">
                    Browse Files
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-80 flex items-center justify-center">
                    <img src={capturedImage} alt="Uploaded Question" className="max-h-80 object-contain" />
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-medium hover:bg-black/90 flex items-center gap-1.5 backdrop-blur-xs border border-white/20"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Choose Different File</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Optional: Specific instruction or problem number
                    </label>
                    <input
                      type="text"
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      placeholder="e.g. Focus on Question 3: Find the roots and vertex"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SAMPLES MODE */}
          {activeMode === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Click any sample exam question sheet below to simulate an instant scan & solution:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SAMPLE_QUESTION_PAPERS.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleProcessScan(sample)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/30 cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {sample.badge}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{sample.difficulty}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {sample.title}
                    </h4>
                    <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100 line-clamp-2">
                      {sample.questionText}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-xs text-indigo-600 font-medium">
                      <span>Click to scan & solve</span>
                      <Sparkles className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {scanError && (
          <div className="mx-5 mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>{scanError}</span>
            <button
              onClick={() => setScanError(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-2 px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 text-xs sm:text-sm font-medium transition-colors"
          >
            Cancel
          </button>

          {capturedImage && (
            <button
              onClick={() => handleProcessScan()}
              disabled={isScanning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{scanStepMessage || 'Transcribing & Solving...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Transcribe & Solve with AI</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
