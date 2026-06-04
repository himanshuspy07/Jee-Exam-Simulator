import { useState, useEffect, useRef } from "react";
import { useTestStore } from "../store/testStore";
import { QuestionType, Subject, ExamType } from "../types";
import { 
  Clock, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Check, 
  Bookmark, 
  CornerDownRight, 
  AlertTriangle,
  Info,
  BookOpen,
  Edit3
} from "lucide-react";
import FormulaBooklet from "./FormulaBooklet";
import Scratchpad from "./Scratchpad";

interface TestSandboxProps {
  onSubmitted: () => void;
}

export default function TestSandbox({ onSubmitted }: TestSandboxProps) {
  const { 
    activeTest, 
    activeQuestionIndex, 
    updateActiveQuestionAttempt,
    clearResponse, 
    nextQuestion, 
    prevQuestion, 
    setQuestionIndex,
    submitTest
  } = useTestStore();

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Warnings tracking to trigger only once
  const warned30 = useRef(false);
  const warned10 = useRef(false);
  const warned5 = useRef(false);

  // Setup initial timer values from active test
  useEffect(() => {
    if (activeTest) {
      // Calculate remaining based on startTime + duration
      const elapsed = Math.round((Date.now() - activeTest.startTime) / 1000);
      const remaining = Math.max(0, activeTest.durationSeconds - elapsed);
      setTimeRemaining(remaining);
    }
  }, [activeTest]);

  // Handle Accidental Refresh / beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to exit the exam? Your active answers are auto-saved, but exam timing continues.";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Main ticking effect for countdown timer and question time-tracking
  useEffect(() => {
    if (!activeTest) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }

        const newRemaining = prev - 1;

        // Timed Popup Warnings
        const minutesLeft = Math.ceil(newRemaining / 60);
        if (minutesLeft === 30 && !warned30.current) {
          warned30.current = true;
          setShowWarning("30 minutes remaining! Pace your physics and maths sections.");
        } else if (minutesLeft === 10 && !warned10.current) {
          warned10.current = true;
          setShowWarning("10 minutes remaining. Verify your unattempted items.");
        } else if (minutesLeft === 5 && !warned5.current) {
          warned5.current = true;
          setShowWarning("CRITICAL: Only 5 minutes remaining. Auto-submission will trigger shortly.");
        }

        return newRemaining;
      });

      // Ticking current question's time spent dynamically
      const activeQuestionId = activeTest.questions[activeQuestionIndex]?.id;
      if (activeQuestionId) {
        const attempt = activeTest.attempts[activeQuestionId];
        if (attempt) {
          attempt.timeSpentSeconds = (attempt.timeSpentSeconds || 0) + 1;
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTest, activeQuestionIndex]);

  if (!activeTest) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <Info className="h-10 w-10 animate-bounce text-slate-300" />
        <p className="mt-4 font-semibold text-sm">Loading Exam sandbox...</p>
      </div>
    );
  }

  const currentQuestion = activeTest.questions[activeQuestionIndex];
  const currentAttempt = activeTest.attempts[currentQuestion.id];
  const userSelection = currentAttempt?.selectedValue;

  const totalQuestions = activeTest.questions.length;

  const handleAutoSubmit = async () => {
    await submitTest();
    onSubmitted();
  };

  const handleManualSubmit = async () => {
    setShowSubmitConfirm(false);
    await submitTest();
    onSubmitted();
  };

  const handleOptionSelect = (optionLetter: string) => {
    if (currentQuestion.type === QuestionType.MULTI_CORRECT) {
      // Manage array list for checkboxes
      const currentSelected: string[] = Array.isArray(userSelection) ? [...userSelection] : [];
      if (currentSelected.includes(optionLetter)) {
        const updated = currentSelected.filter((l) => l !== optionLetter);
        updateActiveQuestionAttempt(updated, updated.length > 0 ? "answered" : "not-answered");
      } else {
        const updated = [...currentSelected, optionLetter].sort();
        updateActiveQuestionAttempt(updated, "answered");
      }
    } else {
      // MCQ Single Radio Option
      updateActiveQuestionAttempt(optionLetter, "answered");
    }
  };

  const handleNumericalChange = (valStr: string) => {
    updateActiveQuestionAttempt(valStr, valStr.trim() !== "" ? "answered" : "not-answered");
  };

  // Bottom action buttons triggers
  const handleSaveAndNext = () => {
    const status = userSelection && (Array.isArray(userSelection) ? userSelection.length > 0 : String(userSelection).trim() !== "") 
      ? "answered" 
      : "not-answered";
    updateActiveQuestionAttempt(userSelection || "", status);
    nextQuestion();
  };

  const handleMarkForReviewAndNext = () => {
    const isAnswered = userSelection && (Array.isArray(userSelection) ? userSelection.length > 0 : String(userSelection).trim() !== "");
    const reviewStatus = isAnswered ? "answered-marked" : "marked";
    updateActiveQuestionAttempt(userSelection || "", reviewStatus);
    nextQuestion();
  };

  // Jump to first question of a subject (Physics, Chemistry, Math tabs)
  const jumpToSubject = (subj: Subject) => {
    const index = activeTest.questions.findIndex((q) => q.subject === subj);
    if (index !== -1) {
      setQuestionIndex(index);
    }
  };

  // Helpers to count answers for navigation grid headings
  const counts = {
    answered: Object.values(activeTest.attempts).filter((a) => a.status === "answered").length,
    notAnswered: Object.values(activeTest.attempts).filter((a) => a.status === "not-answered").length,
    marked: Object.values(activeTest.attempts).filter((a) => a.status === "marked").length,
    answeredMarked: Object.values(activeTest.attempts).filter((a) => a.status === "answered-marked").length,
    unvisited: Object.values(activeTest.attempts).filter((a) => a.status === "not-visited").length,
  };

  // Timer displays
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-slate-100 flex flex-col justify-between">
      
      {/* 30, 10, 5 Warning popups */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-2xl border border-slate-100 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500 border border-amber-100">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <h4 className="font-display font-bold text-slate-800">Timing Advisory Notification</h4>
            <p className="text-xs text-slate-500 leading-normal">{showWarning}</p>
            <button
              onClick={() => setShowWarning(null)}
              className="w-full rounded-xl bg-brand-blue py-2.5 text-xs font-semibold text-white cursor-pointer"
            >
              Continue Solving
            </button>
          </div>
        </div>
      )}

      {/* Manual Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <h4 className="font-display text-lg font-bold text-slate-900">Are you sure you want to submit?</h4>
            
            {/* Quick summary of solve quantities */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl font-mono text-slate-600">
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Answered:</span>
                <span className="font-bold text-emerald-600">{counts.answered}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Marked:</span>
                <span className="font-bold text-violet-600">{counts.marked + counts.answeredMarked}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Not Answered:</span>
                <span className="font-bold text-rose-600">{counts.notAnswered}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-slate-400">Not Visited:</span>
                <span className="font-bold text-slate-500">{counts.unvisited}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              Once submitted, your answers will be evaluated to create your score breakdown, accuracy distribution and personalized AI roadmap suggestions.
            </p>

            <div className="flex gap-3 justify-end text-xs font-bold font-sans">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-slate-600 transition cursor-pointer"
              >
                No, Keep Solving
              </button>
              <button
                onClick={handleManualSubmit}
                className="rounded-xl bg-brand-blue hover:bg-brand-blue-dark px-5 py-2.5 text-white transition cursor-pointer"
              >
                Yes, Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Sandbox Split pane layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-4 overflow-hidden">
        
        {/* Left Side: Question Pane */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[450px]">
          {/* Header info */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-orange-50 border border-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-600 uppercase">
                {currentQuestion.subject}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Chapter: <strong className="text-slate-700">{currentQuestion.chapter}</strong>
              </span>
            </div>

            {/* Floating Workspace tools */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFormulaOpen(true)}
                className="flex items-center gap-1 bg-white border border-slate-200 hover:border-brand-blue/30 text-brand-blue text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer select-none"
                title="Open revision reference sheet"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Formulas</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScratchpadOpen(true)}
                className="flex items-center gap-1 bg-white border border-slate-200 hover:border-brand-blue/30 text-brand-blue text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer select-none"
                title="Launch digital worksheet calculator"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Scratchpad</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 hidden sm:block mx-1" />

              <div className="text-xs font-bold text-slate-500 font-mono">
                Q. {activeQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>
          </div>

          {/* Question Text & Elements scrollable panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* Tag indicator if PYQ */}
            {currentQuestion.pyqYear && (
              <div className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                <span>Actual PYQ - Year {currentQuestion.pyqYear}</span>
              </div>
            )}

            {/* Question Text */}
            <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium md:text-base selection:bg-brand-blue/20">
              {currentQuestion.questionText}
            </div>

            {/* Answer choice inputs depending on Question type */}
            {currentQuestion.type === QuestionType.NUMERICAL ? (
              /* Numerical Answer Input */
              <div className="space-y-3 pt-4 border-t border-slate-100 max-w-sm">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <CornerDownRight className="h-4 w-4 text-brand-blue" />
                  <span>Enter Numerical Answer value</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={String(userSelection || "")}
                    onChange={(e) => handleNumericalChange(e.target.value)}
                    placeholder="Enter decimal or integer answer..."
                    className="w-full text-sm font-mono font-bold rounded-xl border border-slate-200 outline-none px-4 py-3 bg-slate-50 focus:bg-white focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Tip: Round correctly to two decimal places if needed. (No negative marking applies).
                </p>
              </div>
            ) : (
              /* MCQ Selection Radio buttons or Checkboxes */
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-brand-blue" />
                  <span>
                    {currentQuestion.type === QuestionType.MULTI_CORRECT
                      ? "Select MULTIPLE correct answers (Checkbox, multi marks apply)"
                      : "Select SINGLE correct answer (Radio selection)"}
                  </span>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {currentQuestion.options?.map((optionText, idx) => {
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D
                    const isChecked = currentQuestion.type === QuestionType.MULTI_CORRECT
                      ? (Array.isArray(userSelection) && userSelection.includes(letter))
                      : userSelection === letter;

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => handleOptionSelect(letter)}
                        className={`group relative flex items-start gap-3 p-4 text-left rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? "border-brand-blue bg-blue-50/10 shadow-xs"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/20"
                        }`}
                      >
                        {/* Bullet Letter Box */}
                        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold font-mono transition ${
                          isChecked
                            ? "bg-brand-blue text-white border-transparent"
                            : "bg-slate-50 text-slate-500 border-slate-200 group-hover:border-slate-300"
                        }`}>
                          {letter}
                        </div>
                        <span className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed select-none">
                          {optionText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side Panel: Timer, Filters, Palette Nav Grid */}
        <div className="w-full md:w-80 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-sm overflow-hidden">
          
          <div className="p-4 space-y-4 flex-1">
            
            {/* Clock timer panel */}
            <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-4 font-mono text-center space-y-1">
              <span className="text-[10px] font-bold text-brand-blue uppercase tracking-widest flex items-center justify-center gap-1.5 leading-none">
                <Clock className="h-3 w-3" />
                <span>Time Remaining</span>
              </span>
              <p className={`text-2xl font-bold font-sans tracking-tight tracking-wide ${timeRemaining < 300 ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>
                {formatTime(timeRemaining)}
              </p>
            </div>

            {/* Subject Shortcuts */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Subject Quick Filter</span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: Subject.PHYSICS, label: "Physics", icon: "P" },
                  { value: Subject.CHEMISTRY, label: "Chem", icon: "C" },
                  { value: Subject.MATHEMATICS, label: "Math", icon: "M" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => jumpToSubject(item.value)}
                    className="rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 py-1.5 text-xs font-semibold text-slate-750 font-mono flex items-center justify-center gap-1 transition leading-none cursor-pointer"
                  >
                    <span className="bg-slate-200/50 text-[10px] rounded h-4 w-4 flex items-center justify-center font-bold text-slate-500">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* NTA Question Nav Grid Palette */}
            <div className="space-y-2 flex-1 flex flex-col">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Question Palette Grid</span>
              
              <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                {activeTest.questions.map((q, idx) => {
                  const attempt = activeTest.attempts[q.id];
                  const state = attempt?.status || "not-visited";
                  
                  // Palette style classes mapping
                  let btnClass = "palette-unvisited";
                  if (state === "not-answered") btnClass = "palette-unanswered";
                  else if (state === "answered") btnClass = "palette-answered";
                  else if (state === "marked") btnClass = "palette-marked";
                  else if (state === "answered-marked") btnClass = "palette-answered-marked";

                  const isActive = idx === activeQuestionIndex;

                  return (
                    <button
                      key={q.id}
                      onClick={() => setQuestionIndex(idx)}
                      className={`h-9 w-9 text-xs font-bold font-mono rounded-lg flex items-center justify-center transition-all cursor-pointer ${btnClass} ${
                        isActive
                          ? "ring-2 ring-brand-blue ring-offset-2 scale-105"
                          : ""
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Palette Color Codes Legends */}
          <div className="border-t border-slate-100 p-3 bg-slate-50/50 space-y-2 text-[10px]">
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase leading-none">Legend Indices</span>
            <div className="grid grid-cols-2 gap-2 text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded palette-unvisited inline-block shrink-0" />
                <span>Unvisited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded palette-unanswered inline-block shrink-0" />
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded palette-answered inline-block shrink-0" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded palette-marked inline-block shrink-0" />
                <span>Marked</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5">
                <span className="h-3 w-4 rounded palette-answered-marked inline-block shrink-0" />
                <span>Answered + Marked</span>
              </div>
            </div>

            {/* Ultimate Submit Primary action */}
            <div className="pt-2 border-t mt-2">
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full rounded-xl bg-brand-blue hover:bg-brand-blue-dark py-3 font-semibold text-xs tracking-wider uppercase text-white shadow-md shadow-brand-blue/15 transition cursor-pointer"
              >
                Submit Exam Paper
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Navigation Bar */}
      <footer className="border-t border-slate-200 bg-white px-4 py-3.5">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Left footer buttons (Clear and Mark actions) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={clearResponse}
              className="flex items-center gap-1 rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Response</span>
            </button>
            <button
              onClick={handleMarkForReviewAndNext}
              className="flex items-center gap-1 rounded-xl border border-violet-200 hover:bg-violet-55/10 text-violet-700 px-4 py-2.5 text-xs font-semibold transition cursor-pointer"
            >
              <Bookmark className="h-4 w-4" />
              <span>Mark for Review & Next</span>
            </button>
          </div>

          {/* Right footer buttons (Skip and Save actions) */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex gap-1">
              <button
                onClick={prevQuestion}
                disabled={activeQuestionIndex === 0}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2.5 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextQuestion}
                disabled={activeQuestionIndex === totalQuestions - 1}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2.5 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={handleSaveAndNext}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 rounded-xl bg-green-600 hover:bg-green-700 font-semibold px-6 py-2.5 text-xs text-white uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Save & Next</span>
              <Check className="h-4 w-4" />
            </button>
          </div>

        </div>
      </footer>

      <FormulaBooklet isOpen={isFormulaOpen} onClose={() => setIsFormulaOpen(false)} />
      <Scratchpad isOpen={isScratchpadOpen} onClose={() => setIsScratchpadOpen(false)} />

    </div>
  );
}
