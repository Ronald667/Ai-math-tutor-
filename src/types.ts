export type MathTopic = 'algebra' | 'calculus';

export type ProblemDifficulty = 'Foundation' | 'Intermediate' | 'Advanced' | 'AP / College';

export interface SolutionStep {
  number: number;
  title: string;
  mathLatex: string;
  explanation: string;
  hint?: string;
  keyRule?: string;
}

export interface FollowUpChallenge {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VideoScriptFrame {
  timestamp: string;
  second: number;
  title: string;
  chalkFormula: string;
  explanation: string;
  highlightTerm?: string;
  graphConfig?: {
    type: 'tangent' | 'integral' | 'roots' | 'general';
    fnExpression: string;
    domain: [number, number];
    pointX?: number;
    integralRange?: [number, number];
  };
}

export interface MathProblem {
  id: string;
  title: string;
  topic: MathTopic;
  subtopic: string;
  difficulty: ProblemDifficulty;
  createdAt: string;
  updatedAt: string;
  problemLatex: string;
  problemRawText?: string;
  scannedImageUrl?: string;
  keyFormulas: Array<{ name: string; formula: string }>;
  steps: SolutionStep[];
  finalAnswer: string;
  verification: string;
  commonPitfalls: string[];
  followUpChallenge?: FollowUpChallenge;
  videoFrames?: VideoScriptFrame[];
  folderId?: string;
  tags?: string[];
  isFavorite?: boolean;
  syncedToCloud?: boolean;
}

export interface DocumentFolder {
  id: string;
  name: string;
  color: string;
  icon?: string;
  count?: number;
}

export interface TutorMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  mathLatex?: string;
  timestamp: string;
  stepReference?: number;
}

export interface StudentProgress {
  totalSolved: number;
  streakDays: number;
  lastStudyDate: string;
  studyTimeMinutes: number;
  accuracyRate: number;
  algebraMastery: number; // 0 - 100
  calculusMastery: number; // 0 - 100
  topicBreakdown: {
    name: string;
    solved: number;
    mastery: number;
    category: 'algebra' | 'calculus';
  }[];
  recentActivity: {
    date: string;
    count: number;
    accuracy: number;
  }[];
  weakAreas: string[];
  recommendations: string[];
}

export type VoiceTone = 'encouraging' | 'analytical' | 'energetic' | 'socratic' | 'calm';

export type GeminiVoiceName = 'Kore' | 'Fenrir' | 'Zephyr' | 'Puck' | 'Charon';

export interface VoicePersonaInfo {
  id: string;
  name: string;
  voiceName: GeminiVoiceName;
  gender: 'female' | 'male';
  role: string;
  avatar: string;
  pitch: number;
  rate: number;
}

export interface VoiceToneOption {
  id: VoiceTone;
  label: string;
  description: string;
  badge: string;
  promptInstruction: string;
}

