import { useState } from "react";
import { useTestStore } from "../store/testStore";
import { ExamType, Subject, Difficulty } from "../types";
import { 
  ArrowLeft, 
  Settings, 
  Sliders, 
  HelpCircle, 
  Check, 
  Clock, 
  Trophy, 
  Sparkles,
  AlertCircle
} from "lucide-react";
import { sampleQuestions } from "../data/questions";

interface TestSetupProps {
  onCancel: () => void;
  onStartTest: () => void;
}

export default function TestSetup({ onCancel, onStartTest }: TestSetupProps) {
  const { startTest, isGenerating } = useTestStore();

  const [examType, setExamType] = useState<ExamType>(ExamType.JEE_MAIN);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([
    Subject.PHYSICS,
    Subject.CHEMISTRY,
    Subject.MATHEMATICS,
  ]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<number>(15);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MIXED);
  const [testMode, setTestMode] = useState<"full" | "subject" | "chapter">("full");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toggle subject checks (must keep at least one subject checked)
  const toggleSubject = (sub: Subject) => {
    setErrorMessage(null);
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length === 1) {
        setErrorMessage("Please select at least one subject to generate the exam.");
        return;
      }
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const finalQuestionCount = isCustomCount ? customQuestions : questionCount;

  // Let's compute estimate available pool size based on settings select
  const getPoolSize = () => {
    let pool = sampleQuestions.filter((q) => {
      if (examType === ExamType.PYQS) {
        return q.examType === ExamType.PYQS || q.pyqYear !== undefined;
      }
      if (examType === ExamType.JEE_MAIN) {
        return q.examType === ExamType.JEE_MAIN;
      }
      return q.examType === ExamType.JEE_ADVANCED;
    });

    pool = pool.filter((q) => selectedSubjects.includes(q.subject));

    if (difficulty !== Difficulty.MIXED) {
      pool = pool.filter((q) => q.difficulty === difficulty);
    }
    return pool.length;
  };

  const availablePool = getPoolSize();
  const cappedCount = Math.min(finalQuestionCount, availablePool > 0 ? availablePool : 5);

  // Dynamic timing calculation helper (in minutes)
  const calculateEstimateDurationMinutes = () => {
    let totalMin = 0;
    // We assume dynamic breakdown based on difficulty selections
    const easyTime = 1.5;
    const medTime = 2.5;
    const hardTime = 4.0;

    if (difficulty === Difficulty.EASY) {
      totalMin = cappedCount * easyTime;
    } else if (difficulty === Difficulty.MEDIUM) {
      totalMin = cappedCount * medTime;
    } else if (difficulty === Difficulty.HARD) {
      totalMin = cappedCount * hardTime;
    } else {
      // Mixed: weighted average
      totalMin = cappedCount * 2.66; // average weighted representation
    }
    return Math.round(totalMin);
  };

  const estimatedMinutes = calculateEstimateDurationMinutes();
  const maxPossibleMarks = cappedCount * (examType === ExamType.JEE_ADVANCED ? 3.5 : 4); // average for advanced

  const handleLaunchMock = () => {
    if (selectedSubjects.length === 0) {
      setErrorMessage("Please select at least one subject.");
      return;
    }

    startTest({
      examType,
      selectedSubjects,
      questionLimit: cappedCount,
      difficulty,
      testMode,
    });
    
    onStartTest();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      
      {/* Return button */}
      <button 
        onClick={onCancel}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-800 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Dashboard</span>
      </button>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
        
        {/* Banner header */}
        <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-blue border border-blue-100">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-800">Test Generation Setup</h2>
              <p className="text-xs text-slate-400 font-medium font-sans">Configure customized mock conditions to generate an test sandbox.</p>
            </div>
          </div>
          <Sparkles className="h-5 w-5 text-brand-blue" />
        </div>

        <div className="p-6 space-y-8">
          
          {/* Error Prompt */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-800 animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Exam Type */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <span>Step 1: Choose Exam Target</span>
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { type: ExamType.JEE_MAIN, label: "JEE Main", desc: "MCQ + Numerical answers. Single correct scoring +4/-1, standard NTA format." },
                { type: ExamType.JEE_ADVANCED, label: "JEE Advanced", desc: "Rigorous puzzle sets. Includes multi-correct choice partial patterns & integers." },
                { type: ExamType.PYQS, label: "Previous Years (PYQs)", desc: "Contains verified previous years actual exam questions tagged with years." },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => { setExamType(item.type); setErrorMessage(null); }}
                  className={`relative flex flex-col items-start p-4 text-left rounded-xl border text-sm transition-all focus:outline-none cursor-pointer ${
                    examType === item.type
                      ? "border-brand-blue bg-blue-50/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-slate-800">{item.label}</span>
                    {examType === item.type && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue text-white text-[10px]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Standard Subjects and Multi Select */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 2: select Subjects (Multi-select)
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: Subject.PHYSICS, label: "Physics", color: "border-blue-200 text-blue-700 bg-blue-50/20" },
                { value: Subject.CHEMISTRY, label: "Chemistry", color: "border-emerald-200 text-emerald-700 bg-emerald-50/20" },
                { value: Subject.MATHEMATICS, label: "Mathematics", color: "border-violet-200 text-violet-700 bg-violet-50/20" },
              ].map((item) => {
                const isChecked = selectedSubjects.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleSubject(item.value)}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      isChecked
                        ? `${item.color} border-2 shadow-sm`
                        : "border-slate-200 text-slate-500 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`h-4 w-4 rounded flex items-center justify-center border transition ${
                      isChecked ? "bg-brand-blue-dark border-transparent text-white" : "border-slate-300"
                    }`}>
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Number of Questions Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 3: Number of Questions
            </label>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 50, 75].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => { setQuestionCount(num); setIsCustomCount(false); }}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                      questionCount === num && !isCustomCount
                        ? "bg-brand-blue text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {num} Questions
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsCustomCount(true)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                    isCustomCount
                      ? "bg-brand-blue text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Custom Limit
                </button>
              </div>

              {isCustomCount && (
                <div className="flex items-center gap-4 border border-slate-100 rounded-xl p-4 w-full bg-slate-50/50">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={5}
                      max={100}
                      step={5}
                      value={customQuestions}
                      onChange={(e) => setCustomQuestions(parseInt(e.target.value, 10))}
                      className="w-full accent-brand-blue"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold font-mono mt-1">
                      <span>5 QUESTIONS</span>
                      <span>50 INDEX</span>
                      <span>100 QUESTIONS</span>
                    </div>
                  </div>
                  <div className="bg-white border select-none border-slate-200 px-4 py-2.5 rounded-lg text-sm font-bold text-slate-800 font-mono">
                    {customQuestions} Qs
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Difficulty Settings */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 4: Target Difficulty Level
            </label>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { diff: Difficulty.EASY, label: "Easy", time: "1.5m / q", color: "border-emerald-200 hover:border-emerald-300" },
                { diff: Difficulty.MEDIUM, label: "Medium", time: "2.5m / q", color: "border-blue-200 hover:border-blue-300" },
                { diff: Difficulty.HARD, label: "Hard", time: "4.0m / q", color: "border-violet-200 hover:border-violet-300" },
                { diff: Difficulty.MIXED, label: "Mixed", time: "Weighted avg", color: "border-slate-200 hover:border-slate-300" },
              ].map((item) => (
                <button
                  key={item.diff}
                  type="button"
                  onClick={() => setDifficulty(item.diff)}
                  className={`flex flex-col items-start p-3 text-left rounded-xl border text-sm transition cursor-pointer ${
                    difficulty === item.diff
                      ? "border-brand-blue bg-blue-50/20 shadow-sm"
                      : `${item.color} bg-white hover:bg-slate-50/50`
                  }`}
                >
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="mt-1 font-mono text-[10px] text-slate-400 font-bold uppercase">{item.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Test Mode */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Step 5: select Test Mode
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { val: "full", label: "Full Exam Mode", desc: "Simulates complete standard distribution sets across selected fields." },
                { val: "subject", label: "Subject-focused Drill", desc: "Crystallized focus on subject specifics or standard numerical styles." },
                { val: "chapter", label: "Chapter-wise Review", desc: "Select and focus on specific chapters. (Structure loaded and future-ready)" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setTestMode(item.val as any)}
                  className={`flex flex-col items-start p-4 text-left rounded-xl border text-sm transition-all focus:outline-none cursor-pointer ${
                    testMode === item.val
                      ? "border-brand-blue bg-blue-50/20 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className="mt-1 text-xs text-slate-400 font-medium leading-normal">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 6: Live Pre-test Summary Details Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 mt-4">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Pre-Test Exam Specifications</span>
            <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4 font-mono text-xs font-semibold text-slate-600">
              <div className="bg-white border border-slate-200/60 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-400">QUESTIONS</span>
                <p className="mt-1 text-lg font-bold text-slate-800">{cappedCount}</p>
                <span className="text-[9px] text-slate-400 font-sans">Pool size: {availablePool}</span>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-400">TOTAL MARKS</span>
                <p className="mt-1 text-lg font-bold text-slate-800">{maxPossibleMarks}</p>
                <span className="text-[9px] text-slate-400 font-sans">Based on questions</span>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-xl p-3 text-center flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>DURATION</span>
                </span>
                <p className="mt-1 text-lg font-bold text-slate-800">{estimatedMinutes} Min</p>
                <span className="text-[9px] text-slate-400 font-sans">Auto-submit active</span>
              </div>
              <div className="bg-white border border-slate-200/60 rounded-xl p-3 text-center flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  <span>MARKING scheme</span>
                </span>
                <p className="mt-1 text-slate-800 font-bold">{examType === ExamType.JEE_ADVANCED ? "Partial (+4/-2)" : "+4 / -1 rules"}</p>
                <span className="text-[9px] text-slate-400 font-sans">Integer answers has 0 penalty</span>
              </div>
            </div>
          </div>

          {/* Setup Actions row */}
          <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={isGenerating}
              className="rounded-xl border border-slate-200 hover:bg-slate-50 px-5 py-3 font-semibold text-slate-600 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunchMock}
              disabled={isGenerating || availablePool === 0}
              className={`flex items-center gap-2 rounded-xl bg-brand-blue hover:bg-brand-blue-dark px-6 py-3 font-semibold text-white shadow-md shadow-brand-blue/15 transition cursor-pointer ${
                availablePool === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Assembling Exam Pool...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>Generate & Start Exam</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
