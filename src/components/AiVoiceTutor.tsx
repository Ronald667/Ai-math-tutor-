import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  Sparkles,
  Headphones,
  Sliders,
  Check,
  Radio,
  RefreshCw,
  Zap,
  BookOpen,
  Smile,
  Brain,
  Compass,
} from 'lucide-react';
import { MathProblem, VoiceTone, VoicePersonaInfo } from '../types';
import { MathView } from '../lib/mathParser';
import {
  VOICE_PERSONAS,
  VOICE_TONES,
  fetchRealisticSpeech,
} from '../lib/voiceTutorService';

interface AiVoiceTutorProps {
  currentProblem: MathProblem | null;
  initialStep?: number;
}

export const AiVoiceTutor: React.FC<AiVoiceTutorProps> = ({
  currentProblem,
  initialStep = 0,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<VoicePersonaInfo>(VOICE_PERSONAS[0]);
  const [selectedTone, setSelectedTone] = useState<VoiceTone>('encouraging');
  const [useRealisticVoice, setUseRealisticVoice] = useState<boolean>(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(initialStep);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (initialStep !== undefined) {
      setActiveStepIndex(initialStep);
    }
  }, [initialStep]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  // When step, problem, persona, or tone changes, reload script & speech
  useEffect(() => {
    stopPlayback();
    loadSpokenScriptAndAudio();
  }, [activeStepIndex, currentProblem, selectedPersona, selectedTone]);

  // Stop any currently running speech / audio element
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Animated Waveform Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barCount = 32;
      const barWidth = 4;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          const factor =
            Math.sin(phase + i * 0.3) *
            Math.cos(phase * 0.65 + i * 0.18);
          barHeight = Math.max(4, Math.abs(factor) * (height * 0.88));
        } else {
          barHeight = 4 + Math.sin(i * 0.4) * 2;
        }

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          if (selectedTone === 'encouraging') {
            grad.addColorStop(0, '#ec4899'); // Pink
            grad.addColorStop(1, '#8b5cf6'); // Purple
          } else if (selectedTone === 'analytical') {
            grad.addColorStop(0, '#3b82f6'); // Blue
            grad.addColorStop(1, '#06b6d4'); // Cyan
          } else if (selectedTone === 'energetic') {
            grad.addColorStop(0, '#f59e0b'); // Amber
            grad.addColorStop(1, '#ef4444'); // Red
          } else if (selectedTone === 'socratic') {
            grad.addColorStop(0, '#8b5cf6'); // Violet
            grad.addColorStop(1, '#3b82f6'); // Blue
          } else {
            grad.addColorStop(0, '#10b981'); // Emerald
            grad.addColorStop(1, '#06b6d4'); // Cyan
          }
        } else {
          grad.addColorStop(0, '#cbd5e1');
          grad.addColorStop(1, '#94a3b8');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.09 * playbackSpeed;
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, selectedTone]);

  // Load contextual spoken script from backend and prepare realistic audio
  const loadSpokenScriptAndAudio = async () => {
    if (!currentProblem) {
      setSpokenText('Select a problem from the library or scan a math sheet to begin.');
      return;
    }

    setIsLoadingScript(true);
    setSpeechNotice(null);
    let scriptContent = '';

    try {
      const res = await fetch('/api/voice-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: currentProblem,
          stepNumber: activeStepIndex > 0 ? activeStepIndex : undefined,
          persona: selectedPersona.name,
          tone: selectedTone,
        }),
      });

      const data = await res.json();
      if (data.script) {
        scriptContent = data.script;
        setSpokenText(data.script);
      } else {
        scriptContent = generateDefaultScript();
        setSpokenText(scriptContent);
      }
    } catch {
      scriptContent = generateDefaultScript();
      setSpokenText(scriptContent);
    } finally {
      setIsLoadingScript(false);
    }

    // Preload realistic audio in background if realistic mode is enabled
    if (useRealisticVoice && scriptContent) {
      preloadRealisticAudio(scriptContent);
    }
  };

  const preloadRealisticAudio = async (text: string) => {
    setIsLoadingAudio(true);
    try {
      const result = await fetchRealisticSpeech({
        text,
        voiceName: selectedPersona.voiceName,
        tone: selectedTone,
      });

      if (result.success && result.audioUrl) {
        setupAudioElement(result.audioUrl);
      }
    } catch (e) {
      console.warn('Preload audio notice:', e);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const setupAudioElement = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.playbackRate = playbackSpeed;

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setAudioCurrentTime(audio.currentTime || 0);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setAudioCurrentTime(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      setSpeechNotice('Realistic audio track encountered an issue; falling back to synthesized speech.');
    };

    audioRef.current = audio;
  };

  const generateDefaultScript = (): string => {
    if (!currentProblem) return '';
    if (activeStepIndex === 0) {
      return `Welcome! I am ${selectedPersona.name}. Let's examine ${currentProblem.title}. We are dealing with ${currentProblem.subtopic}. Together we will navigate each step with confidence.`;
    } else {
      const step = currentProblem.steps[activeStepIndex - 1];
      if (step) {
        return `In step ${step.number}, our goal is to ${step.title}. ${step.explanation} Remember, ${step.hint || 'take your time checking each sign.'}`;
      }
    }
    return '';
  };

  const handleTogglePlay = async () => {
    setSpeechNotice(null);

    if (isPlaying) {
      // Pause
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
      }
      setIsPlaying(false);
      return;
    }

    // Play
    if (useRealisticVoice) {
      // If audio element is ready, play it
      if (audioRef.current && audioRef.current.src) {
        try {
          audioRef.current.playbackRate = playbackSpeed;
          await audioRef.current.play();
          setIsPlaying(true);
          return;
        } catch (err: any) {
          console.warn('Realistic audio play notice:', err);
        }
      }

      // If audio is not yet loaded, fetch it now
      setIsLoadingAudio(true);
      try {
        const result = await fetchRealisticSpeech({
          text: spokenText,
          voiceName: selectedPersona.voiceName,
          tone: selectedTone,
        });

        if (result.success && result.audioUrl) {
          setupAudioElement(result.audioUrl);
          if (audioRef.current) {
            audioRef.current.playbackRate = playbackSpeed;
            await audioRef.current.play();
            setIsPlaying(true);
            setIsLoadingAudio(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Speech request error, falling back:', err);
      } finally {
        setIsLoadingAudio(false);
      }
    }

    // Fallback: Browser Web Speech API
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSpeechNotice('Audio playback not supported in this environment.');
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = selectedPersona.rate * playbackSpeed;
        utterance.pitch = selectedPersona.pitch;

        utterance.onend = () => {
          setIsPlaying(false);
        };
        utterance.onerror = () => {
          setIsPlaying(false);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    } catch {
      setSpeechNotice('Could not play audio. Please ensure browser audio output is enabled.');
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    stopPlayback();
    setAudioCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleNextStep = () => {
    if (!currentProblem) return;
    if (activeStepIndex < currentProblem.steps.length) {
      setActiveStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex((prev) => prev - 1);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Voice Tutor Header */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">AI Voice Tutor</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60">
                Studio Speech
              </span>
              {useRealisticVoice && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Realistic AI Voice Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Natural spoken explanations with customizable emotional tones and neural characters
            </p>
          </div>
        </div>

        {/* Realistic Voice Engine Toggle */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1.5 shadow-2xs">
          <button
            onClick={() => setUseRealisticVoice(!useRealisticVoice)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              useRealisticVoice
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{useRealisticVoice ? 'Realistic Neural Voice' : 'Standard Web Speech'}</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {speechNotice && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>{speechNotice}</span>
            <button
              onClick={() => setSpeechNotice(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-2 px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tone Selector Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Voice Tone & Teaching Style</span>
            </label>
            <span className="text-xs text-slate-500 font-medium">
              Current: <strong className="text-purple-700 capitalize">{selectedTone}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {VOICE_TONES.map((t) => {
              const isSelected = selectedTone === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTone(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-400/30 text-purple-950 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-purple-700 font-bold text-xs">
                      {getToneIcon(t.id)}
                      <span>{t.label.split('&')[0]}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persona Selector Section */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Voice Character</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {VOICE_PERSONAS.map((persona) => {
              const isSelected = selectedPersona.id === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersona(persona)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{persona.avatar}</span>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate">{persona.name}</div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-purple-300' : 'text-slate-500'}`}>
                      {persona.role}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Selector Chips */}
        {currentProblem && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveStepIndex(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                activeStepIndex === 0
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Problem Overview
            </button>
            {currentProblem.steps.map((step) => (
              <button
                key={step.number}
                onClick={() => setActiveStepIndex(step.number)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  activeStepIndex === step.number
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Step {step.number}: {step.title.substring(0, 20)}...
              </button>
            ))}
          </div>
        )}

        {/* Current Active Step Math Card */}
        {currentProblem && (
          <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
            <div className="text-xs font-semibold text-purple-400 mb-1">
              {activeStepIndex === 0 ? 'Problem Statement' : `Step ${activeStepIndex} Mathematical Rule`}
            </div>
            <div className="text-center font-mono py-2">
              <MathView
                math={
                  activeStepIndex === 0
                    ? currentProblem.problemLatex
                    : currentProblem.steps[activeStepIndex - 1]?.mathLatex || ''
                }
                block={true}
                className="text-base sm:text-xl text-cyan-300"
              />
            </div>
          </div>
        )}

        {/* Spoken Narration Script Box */}
        <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>
                Transcript ({selectedPersona.name} • Tone: {selectedTone}):
              </span>
            </span>
            <div className="flex items-center gap-2">
              {isLoadingScript && (
                <span className="text-xs text-purple-600 animate-pulse">Generating script...</span>
              )}
              {isLoadingAudio && (
                <span className="text-xs text-emerald-600 animate-pulse">Rendering realistic voice...</span>
              )}
              <button
                onClick={loadSpokenScriptAndAudio}
                className="p-1 rounded text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                title="Regenerate with current tone"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">{spokenText}</p>
        </div>

        {/* Audio Waveform Canvas & Progress */}
        <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-800 space-y-2">
          <canvas ref={canvasRef} width={360} height={55} className="w-full max-w-md h-12" />
          <div className="w-full max-w-md flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span>
                {useRealisticVoice ? `Realistic Neural (${selectedPersona.voiceName})` : 'Web Speech'}
              </span>
            </div>
            {audioDuration > 0 && (
              <span>
                {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
              </span>
            )}
          </div>
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            {[0.75, 1.0, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-white text-purple-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Primary Transport Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevStep}
              disabled={activeStepIndex <= 0}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition-colors"
              title="Previous Step"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={isLoadingAudio}
              className={`w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-purple-600/30 transition-transform ${
                isLoadingAudio ? 'opacity-80' : ''
              }`}
              title={isPlaying ? 'Pause Narration' : 'Play Voice Tutor'}
            >
              {isLoadingAudio ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNextStep}
              disabled={!currentProblem || activeStepIndex >= currentProblem.steps.length}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition-colors"
              title="Next Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Restart Audio"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {activeStepIndex === 0 ? 'Overview' : `Step ${activeStepIndex} of ${currentProblem?.steps.length || 1}`}
          </div>
        </div>
      </div>
    </div>
  );
};
