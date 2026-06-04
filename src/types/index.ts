export enum Subject {
  PHYSICS = "physics",
  CHEMISTRY = "chemistry",
  MATHEMATICS = "mathematics"
}

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  MIXED = "mixed"
}

export enum ExamType {
  JEE_MAIN = "JEE Main",
  JEE_ADVANCED = "JEE Advanced",
  PYQS = "PYQs"
}

export enum QuestionType {
  SINGLE_CORRECT = "single-correct",   // MCQ with single correct option
  MULTI_CORRECT = "multi-correct",     // MCQ with multiple correct options (JEE Advanced)
  NUMERICAL = "numerical"              // Numerical integer or decimal answer input
}

export interface Question {
  id: string;
  examType: ExamType; // Can be JEE Main, Advanced, or PYQs
  subject: Subject;
  chapter: string;
  type: QuestionType;
  difficulty: Difficulty;
  questionText: string;
  options?: string[]; // Array of option texts (A, B, C, D) for single/multi correct
  correctAnswer: string | string[]; // Single option index letter ("A"), array of letters (["A", "C"]), or number string ("42" or "2.5")
  solution: {
    explanation: string;
    formula?: string;
    shortcut?: string;
  };
  pyqYear?: number; // Tagged with year if it is PYQ or Advanced actual question
}

export interface TestSettings {
  id: string;
  examType: ExamType;
  selectedSubjects: Subject[];
  questionLimit: number;
  difficulty: Difficulty;
  testMode: "full" | "subject" | "chapter";
  selectedChapters?: string[];
}

export interface QuestionAttempt {
  questionId: string;
  status: "not-visited" | "not-answered" | "answered" | "marked" | "answered-marked";
  selectedValue?: string | string[]; // Selected option letter(s) or numerical value string
  isCorrect?: boolean;
  marksAwarded?: number;
  timeSpentSeconds: number; // Time spent on this question specifically
}

export interface TestAttempt {
  id: string;
  settings: TestSettings;
  questions: Question[];
  attempts: Record<string, QuestionAttempt>; // Map of questionId -> attempt details
  startTime: number; // timestamp
  submittedTime?: number; // timestamp
  timeSpentSeconds: number; // total time spent
  durationSeconds: number; // calculated total limit
  status: "idle" | "running" | "paused" | "submitted";
  score?: number;
  totalMarks?: number;
  accuracy?: number; // calculated
  subjectStats?: Record<Subject, {
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    score: number;
    timeSpent: number;
  }>;
  difficultyStats?: Record<string, {
    total: number;
    correct: number;
    incorrect: number;
  }>;
}

export interface AICoachFeedback {
  title: string;
  summary: string;
  strongTopics: string[];
  weakTopics: string[];
  studyActionPlan: string[];
  estimatedPrepTimeWeeks: number;
}
