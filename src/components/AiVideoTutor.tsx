import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Video,
  Sparkles,
  Sliders,
  TrendingUp,
  Volume2,
  VolumeX,
  Radio,
  Check,
  Smile,
  Brain,
  Zap,
  Compass,
  BookOpen,
  Headphones,
  RefreshCw,
} from 'lucide-react';
import { MathProblem, VideoScriptFrame, VoiceTone, VoicePersonaInfo } from '../types';
import { MathView } from '../lib/mathParser';
import {
  VOICE_PERSONAS,
  VOICE_TONES,
  fetchRealisticSpeech,
} from '../lib/voiceTutorService';

interface AiVideoTutorProps {
  currentProblem: MathProblem | null;
}

export const AiVideoTutor: React.FC<AiVideoTutorProps> = ({ currentProblem }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(60);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Realistic AI Voice & Tone configuration
  const [useRealisticVoice, setUseRealisticVoice] = useState<boolean>(true);
  const [selectedPersona, setSelectedPersona] = useState<VoicePersonaInfo>(VOICE_PERSONAS[0]);
  const [selectedTone, setSelectedTone] = useState<VoiceTone>('encouraging');
  const [showToneDrawer, setShowToneDrawer] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  // Interactive parameter for tangent exploration
  const [interactiveParamX, setInteractiveParamX] = useState<number>(1.5);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Video frames for this problem
  const frames: VideoScriptFrame[] = currentProblem?.videoFrames || [
    {
      timestamp: '00:00',
      second: 0,
      title: 'Problem Formulation',
      chalkFormula: currentProblem?.problemLatex || '\\int f(x) dx',
      explanation: `Welcome to this visual walkthrough of ${
        currentProblem?.title || 'this problem'
      }. We begin by identifying the target expression and key concepts.`,
      graphConfig: {
        type: 'tangent',
        fnExpression: 'x * x - 2',
        domain: [-3, 3],
        pointX: 1,
      },
    },
    {
      timestamp: '00:20',
      second: 20,
      title: 'Applying Core Principle',
      chalkFormula:
        currentProblem?.steps?.[0]?.mathLatex ||
        "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h)-f(x)}{h}",
      explanation: `Next, we apply the foundational mathematical rule. Watch how algebraic terms simplify logically.`,
    },
    {
      timestamp: '00:40',
      second: 40,
      title: 'Final Resolution & Verification',
      chalkFormula: currentProblem?.finalAnswer || 'x = 0',
      explanation: `Here is our final solution. Notice how the visual curve validates this exact numeric result.`,
    },
  ];

  // Current active frame based on timeline progress
  const activeFrameIndex = Math.min(
    frames.length - 1,
    Math.max(
      0,
      frames.findIndex((f, idx) => {
        const nextSec = frames[idx + 1] ? frames[idx + 1].second : duration + 1;
        return currentTime >= f.second && currentTime < nextSec;
      })
    )
  );
  const currentFrame = frames[activeFrameIndex >= 0 ? activeFrameIndex : 0];

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            stopAudio();
            return 0;
          }
          return prev + 0.25 * playbackSpeed;
        });
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, duration]);

  // Audio speech narration when frame changes during video playback
  useEffect(() => {
    if (!isPlaying || !soundEnabled || !currentFrame) {
      stopAudio();
      return;
    }

    playFrameNarration(currentFrame.explanation);
  }, [activeFrameIndex, isPlaying, soundEnabled, selectedTone, selectedPersona, useRealisticVoice]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const playFrameNarration = async (text: string) => {
    stopAudio();

    if (useRealisticVoice) {
      setIsLoadingAudio(true);
      try {
        const result = await fetchRealisticSpeech({
          text,
          voiceName: selectedPersona.voiceName,
          tone: selectedTone,
        });

        if (result.success && result.audioUrl) {
          const audio = new Audio(result.audioUrl);
          audio.playbackRate = playbackSpeed;
          audioRef.current = audio;
          await audio.play();
          setIsLoadingAudio(false);
          return;
        }
      } catch (err) {
        console.warn('Notice: Realistic voice playback notice:', err);
      } finally {
        setIsLoadingAudio(false);
      }
    }

    // Fallback: Web Speech API
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05 * playbackSpeed;
        utterance.pitch = selectedPersona.pitch;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis notice:', e);
      }
    }
  };

  // Render Chalkboard Canvas & Dynamic Math Graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark Chalkboard background
    ctx.fillStyle = '#090d16'; // Deep navy slate
    ctx.fillRect(0, 0, width, height);

    // Subtle chalk grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Coordinate axes
    const originX = width / 2;
    const originY = height / 2 + 15;
    const scale = 45;

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;

    // X axis
    ctx.beginPath();
    ctx.moveTo(30, originY);
    ctx.lineTo(width - 30, originY);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(originX, 25);
    ctx.lineTo(originX, height - 25);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('x', width - 22, originY + 12);
    ctx.fillText('y', originX + 8, 32);

    // Dynamic Math Function Plotting based on current problem
    const isIntegral =
      currentProblem?.topic === 'calculus' &&
      (currentProblem?.subtopic?.toLowerCase().includes('integral') ||
        currentProblem?.problemLatex?.includes('\\int'));

    const isTangent =
      currentProblem?.topic === 'calculus' &&
      (currentProblem?.subtopic?.toLowerCase().includes('tangent') ||
        currentProblem?.subtopic?.toLowerCase().includes('derivative'));

    // Plot primary function curve f(x)
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8'; // Sky cyan
    ctx.lineWidth = 2.5;

    let hasStarted = false;
    for (let px = 30; px < width - 30; px += 2) {
      const mathX = (px - originX) / scale;
      let mathY = 0;

      if (isIntegral) {
        // e.g. f(x) = x * exp(-x^2) or sin(x)
        mathY = Math.sin(mathX) * 1.8 + Math.cos(mathX * 0.5) * 0.5;
      } else if (isTangent) {
        // Parabola f(x) = 0.4 * x^2 - 1.2
        mathY = 0.45 * mathX * mathX - 1.2;
      } else {
        // Polynomial / Quadratic
        mathY = 0.3 * Math.pow(mathX, 3) - 1.5 * mathX;
      }

      const py = originY - mathY * scale;
      if (py >= 20 && py <= height - 20) {
        if (!hasStarted) {
          ctx.moveTo(px, py);
          hasStarted = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.stroke();

    // If Integral: draw shaded area under curve
    if (isIntegral) {
      const aX = originX - scale * 1.5;
      const bX = originX + scale * 1.8;

      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.moveTo(aX, originY);
      for (let px = aX; px <= bX; px += 2) {
        const mathX = (px - originX) / scale;
        const mathY = Math.sin(mathX) * 1.8 + Math.cos(mathX * 0.5) * 0.5;
        const py = originY - mathY * scale;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(bX, originY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px sans-serif';
      ctx.fillText('∫ Area under curve', originX - 45, originY - 40);
    }

    // If Tangent / Derivative: draw tangent line at interactiveParamX
    if (isTangent) {
      const tx = interactiveParamX;
      const ty = 0.45 * tx * tx - 1.2;
      const slope = 0.9 * tx;

      const ptScreenX = originX + tx * scale;
      const ptScreenY = originY - ty * scale;

      // Draw point on curve
      ctx.fillStyle = '#f59e0b'; // Amber
      ctx.beginPath();
      ctx.arc(ptScreenX, ptScreenY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Draw tangent line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      const x1 = tx - 2;
      const y1 = ty - slope * 2;
      const x2 = tx + 2;
      const y2 = ty + slope * 2;
      ctx.moveTo(originX + x1 * scale, originY - y1 * scale);
      ctx.lineTo(originX + x2 * scale, originY - y2 * scale);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '11px monospace';
      ctx.fillText(`m = dy/dx = ${slope.toFixed(2)}`, ptScreenX + 8, ptScreenY - 8);
    }

    // Chalk dust particles effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < 20; i++) {
      const rx = (Math.sin(i * 99 + currentTime) * 0.5 + 0.5) * width;
      const ry = (Math.cos(i * 33 + currentTime) * 0.5 + 0.5) * height;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }
  }, [currentTime, currentProblem, interactiveParamX]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    stopAudio();
    setIsPlaying(false);
  };

  const handleToggleFullscreen = async () => {
    const elem = containerRef.current;
    if (!elem) return;

    try {
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          setIsFullscreen(true);
        } else {
          setIsFullscreen(!isFullscreen);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  };

  // Tone icons helper
  const getToneIcon = (tone: VoiceTone) => {
    switch (tone) {
      case 'encouraging':
        return <Smile className="w-3.5 h-3.5" />;
      case 'analytical':
        return <Brain className="w-3.5 h-3.5" />;
      case 'energetic':
        return <Zap className="w-3.5 h-3.5" />;
      case 'socratic':
        return <Compass className="w-3.5 h-3.5" />;
      case 'calm':
        return <BookOpen className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'relative'
      }`}
    >
      {/* Top Video Header */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                AI Whiteboard Video Tutor
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                Chalkboard Lesson
              </span>
              {useRealisticVoice && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Realistic Voice ({selectedPersona.voiceName})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {currentProblem?.title || 'Interactive Visual Mathematics'}
            </p>
          </div>
        </div>

        {/* Action Controls in Header: Tone selector & Audio toggles */}
        <div className="flex items-center gap-2">
          {/* Tone Drawer Toggle Button */}
          <button
            onClick={() => setShowToneDrawer(!showToneDrawer)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
              showToneDrawer
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Adjust voice delivery tone and tutor character"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="capitalize">{selectedTone} Tone</span>
          </button>

          {/* Realistic Voice vs Web Speech toggle */}
          <button
            onClick={() => setUseRealisticVoice(!useRealisticVoice)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
              useRealisticVoice
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={useRealisticVoice ? 'Using Realistic Neural TTS' : 'Using Standard Speech'}
          >
            <Radio className="w-4 h-4" />
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
              soundEnabled
                ? 'bg-slate-800 text-cyan-300 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundEnabled ? 'Mute voice narration' : 'Unmute voice narration'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Tone & Voice Customization Drawer */}
      {showToneDrawer && (
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Voice Tone & Style for Video Narration</span>
            </div>
            <button
              onClick={() => setShowToneDrawer(false)}
              className="text-xs text-slate-400 hover:text-white self-end sm:self-auto"
            >
              Done ✕
            </button>
          </div>

          {/* Tone Options */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {VOICE_TONES.map((tone) => {
              const isSelected = selectedTone === tone.id;
              return (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                      {getToneIcon(tone.id)}
                      <span>{tone.label.split('&')[0]}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                    {tone.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Voice Character Selection */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Character</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {VOICE_PERSONAS.map((persona) => {
                const isSelected = selectedPersona.id === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xl">{persona.avatar}</span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold truncate text-white">{persona.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{persona.voiceName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Visual Chalkboard Canvas Area */}
      <div className="relative flex-1 min-h-[360px] sm:min-h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={420}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Overlay: Chalk Formula & Step Title Card */}
        <div className="absolute top-4 left-4 max-w-sm p-3.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 shadow-lg text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5 flex items-center gap-1.5">
            <span>{currentFrame.title}</span>
            {isLoadingAudio && (
              <span className="text-[9px] text-emerald-400 animate-pulse flex items-center gap-0.5">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Voice readying...</span>
              </span>
            )}
          </div>
          <div className="font-mono text-cyan-300 text-sm">
            <MathView math={currentFrame.chalkFormula} />
          </div>
        </div>

        {/* Interactive Tangent Scrubbing Control in-canvas */}
        <div className="absolute top-4 right-4 p-3 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-right">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 mb-1">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Scrub x-point for Tangent:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-2"
              max="2.5"
              step="0.05"
              value={interactiveParamX}
              onChange={(e) => setInteractiveParamX(parseFloat(e.target.value))}
              className="w-32 accent-amber-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-amber-400 w-10 text-right">
              {interactiveParamX.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Live Synced Caption Subtitle Bar */}
      <div className="px-5 py-3 bg-slate-900/95 border-t border-slate-800 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans flex-1">
          <span className="font-bold text-amber-400 mr-2">
            [{selectedPersona.name} • {selectedTone} tone]:
          </span>
          {currentFrame.explanation}
        </div>
        {soundEnabled && isPlaying && (
          <div className="flex items-center gap-1 shrink-0 self-center">
            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-emerald-400 rounded-full animate-pulse delay-75" />
            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
          </div>
        )}
      </div>

      {/* Video Progress Bar & Timeline Bookmarks */}
      <div className="px-5 pt-3 bg-slate-950">
        <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-150"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Frame Bookmarks on timeline */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1.5">
          {frames.map((frame, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentTime(frame.second)}
              className={`hover:text-amber-400 transition-colors flex items-center gap-1 ${
                activeFrameIndex === idx ? 'text-amber-400 font-bold' : ''
              }`}
            >
              <span>{frame.timestamp}</span>
              <span className="hidden sm:inline">• {frame.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Transport Controls */}
      <div className="p-4 bg-slate-950 flex flex-wrap items-center justify-between gap-4 border-t border-slate-900">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePlay}
            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 flex items-center justify-center font-bold shadow-md transition-all"
            title={isPlaying ? 'Pause Video' : 'Play Video'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Restart from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="text-xs font-mono text-slate-400">
            {Math.floor(currentTime / 60)}:
            {Math.floor(currentTime % 60)
              .toString()
              .padStart(2, '0')}{' '}
            / 1:00
          </div>
        </div>

        {/* Playback speed switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
          {[0.75, 1, 1.25, 1.5].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                playbackSpeed === speed
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
