import { useState } from "react";
import { useTestStore } from "../store/testStore";
import { Question, Subject, Difficulty, QuestionType } from "../types";
import { 
  ArrowLeft, 
  Filter, 
  Check, 
  X, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  Sparkles,
  ChevronDown,
  ListFilter
} from "lucide-react";

interface SolutionsReviewProps {
  attemptId: string;
  onBackToScorecard: () => void;
}

export default function SolutionsReview({ attemptId, onBackToScorecard }: SolutionsReviewProps) {
  const { pastAttempts } = useTestStore();

  const attempt = pastAttempts.find((a) => a.id === attemptId);

  // Filters state
  const [subjectFilter, setSubjectFilter] = useState<"all" | Subject>("all");
  const [resultFilter, setResultFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");
  const [diffFilter, setDiffFilter] = useState<"all" | Difficulty>("all");

  if (!attempt) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-slate-400">Quiz session details not found.</p>
        <button onClick={onBackToScorecard} className="mt-4 rounded bg-brand-blue py-2 px-4 text-white">
          Back
        </button>
      </div>
    );
  }

  // Filter matching questions
  const filteredQuestions = attempt.questions.filter((q) => {
    const userAttempt = attempt.attempts[q.id];
    
    // 1. Filter by subject
    if (subjectFilter !== "all" && q.subject !== subjectFilter) {
      return false;
    }

    // 2. Filter by difficulty
    if (diffFilter !== "all" && q.difficulty !== diffFilter) {
      return false;
    }

    // 3. Filter by correct/incorrect results
    const isChose = userAttempt?.selectedValue !== undefined && userAttempt.selectedValue !== "" && (Array.isArray(userAttempt.selectedValue) ? userAttempt.selectedValue.length > 0 : true);
    if (resultFilter === "correct") {
      return userAttempt?.isCorrect === true;
    }
    if (resultFilter === "incorrect") {
      return userAttempt?.isCorrect === false;
    }
    if (resultFilter === "unattempted") {
      return !isChose;
    }

    return true;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToScorecard}
            className="rounded-lg border border-slate-200 hover:bg-slate-50 p-2 text-slate-500 transition cursor-pointer"
            title="Back to Scorecard Analytics"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">Solutions & Question auditing</h2>
            <p className="text-xs text-slate-400 font-medium font-mono">Exam Session: {attempt.settings.examType} | {attempt.questions.length} total questions</p>
          </div>
        </div>
        <button
          onClick={onBackToScorecard}
          className="rounded-xl border border-brand-blue/30 text-brand-blue-dark hover:bg-blue-50/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition cursor-pointer"
        >
          View Scorecard
        </button>
      </div>

      {/* Interactive Filters Grid */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs space-y-3.5">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5 leading-none">
          <ListFilter className="h-4 w-4" />
          <span>Solution Query Filters</span>
        </span>
        
        <div className="grid gap-3 sm:grid-cols-3 font-semibold text-xs text-slate-600">
          
          {/* Subject selections */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Subject Choice</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 outline-none px-3 py-2 text-xs"
            >
              <option value="all">All Subjects</option>
              <option value={Subject.PHYSICS}>Physics</option>
              <option value={Subject.CHEMISTRY}>Chemistry</option>
              <option value={Subject.MATHEMATICS}>Mathematics</option>
            </select>
          </div>

          {/* Correct / Incorrect Filter */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Result Status</span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 outline-none px-3 py-2 text-xs"
            >
              <option value="all">All Responses</option>
              <option value="correct">Correct Attempts</option>
              <option value="incorrect">Incorrect Attempts</option>
              <option value="unattempted">Unattempted Sets</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Difficulty level</span>
            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 outline-none px-3 py-2 text-xs"
            >
              <option value="all">All Difficulties</option>
              <option value={Difficulty.EASY}>Easy</option>
              <option value={Difficulty.MEDIUM}>Medium</option>
              <option value={Difficulty.HARD}>Hard</option>
            </select>
          </div>

        </div>
      </div>

      {/* Answer list */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-xs text-slate-400">
            No items matches the active filters combination. Clear queries to view all test questions.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const userAttempt = attempt.attempts[q.id];
            const ansSelected = userAttempt?.selectedValue;
            const isCorrect = userAttempt?.isCorrect;

            const isAttempted = ansSelected !== undefined && ansSelected !== "" && (Array.isArray(ansSelected) ? ansSelected.length > 0 : true);

            // Row header color tags
            let statusColorCard = "border-slate-100 bg-white";
            let iconTextMark = null;

            if (!isAttempted) {
              statusColorCard = "border-slate-200 bg-slate-50/20";
              iconTextMark = (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 font-mono">
                  UNATTEMPTED (0 MARKS)
                </span>
              );
            } else if (isCorrect === true) {
              statusColorCard = "border-emerald-200 bg-emerald-50/5";
              iconTextMark = (
                <span className="rounded bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 font-mono">
                  CORRECT (+{userAttempt.marksAwarded} MARKS)
                </span>
              );
            } else {
              statusColorCard = "border-rose-200 bg-rose-50/5";
              iconTextMark = (
                <span className="rounded bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 font-mono">
                  INCORRECT ({userAttempt ? userAttempt.marksAwarded : 0} MARKS)
                </span>
              );
            }

            return (
              <div 
                key={q.id}
                className={`overflow-hidden rounded-2xl border shadow-xs transition-all duration-250 ${statusColorCard}`}
              >
                {/* Single Question Header */}
                <div className="border-b border-dashed border-slate-200/80 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <span className="uppercase font-bold text-slate-500 bg-slate-100 border rounded px-1.5 py-0.5 text-[10px]">
                      {q.subject}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-mono">{q.chapter}</span>
                    <span>•</span>
                    <span className="capitalize">{q.difficulty}</span>
                  </div>
                  <div>{iconTextMark}</div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Question description */}
                  <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium select-all">
                    {q.questionText}
                  </div>

                  {/* MCQ Options Display if applicable */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2 pt-2 text-xs sm:text-sm font-medium">
                      {q.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrectOption = Array.isArray(q.correctAnswer) 
                          ? q.correctAnswer.includes(letter) 
                          : q.correctAnswer === letter;
                        
                        const isChosenOption = Array.isArray(ansSelected)
                          ? ansSelected.includes(letter)
                          : ansSelected === letter;

                        let styleText = "border-slate-100 bg-slate-50/50 text-slate-700";
                        if (isCorrectOption) {
                          styleText = "border-emerald-300 bg-emerald-50/20 text-emerald-800 font-bold";
                        } else if (isChosenOption) {
                          styleText = "border-rose-300 bg-rose-50/20 text-rose-800";
                        }

                        return (
                          <div
                            key={letter}
                            className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 ${styleText}`}
                          >
                            <span className="font-bold font-mono">{letter}.</span>
                            <span>{opt}</span>
                            {isCorrectOption && <Check className="ml-auto h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                            {isChosenOption && !isCorrectOption && <X className="ml-auto h-3.5 w-3.5 text-rose-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary of what they selected vs correctness */}
                  <div className="rounded-xl bg-slate-100/50 p-4 border border-slate-100 text-xs text-slate-700 grid gap-3 sm:grid-cols-2 font-semibold">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Your Recorded Response</span>
                      <p className="flex items-center gap-1">
                        {isAttempted ? (
                          <>
                            {isCorrect ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <X className="h-4 w-4 text-rose-600" />
                            )}
                            <span className="font-mono font-bold text-slate-800">
                              {Array.isArray(ansSelected) ? ansSelected.join(", ") : String(ansSelected)}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Unattempted / Left Blank</span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Correct Answer key</span>
                      <p className="font-mono font-extrabold text-emerald-700">
                        {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : String(q.correctAnswer)}
                      </p>
                    </div>
                  </div>

                  {/* Step-by-Step Solution container */}
                  <div className="rounded-xl border border-blue-50 bg-blue-50/15 p-4 space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-dashed border-blue-100/80 pb-2">
                      <Lightbulb className="h-4.5 w-4.5 text-brand-blue" />
                      <span className="text-[11px] font-bold tracking-widest text-brand-blue uppercase leading-none">
                        Step-by-Step Scientific Solution
                      </span>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed font-sans whitespace-pre-line">
                      {q.solution.explanation}
                    </p>

                    {/* Formula reference if present */}
                    {q.solution.formula && (
                      <div className="rounded-lg bg-white border border-blue-100 px-3 py-2 text-xs font-mono text-slate-600 select-all">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none block mb-1">Key Formulas Reference</span>
                        <span>{q.solution.formula}</span>
                      </div>
                    )}

                    {/* Shortcut reference if present */}
                    {q.solution.shortcut && (
                      <div className="text-[11px] text-orange-700 leading-normal font-medium bg-orange-50/20 border border-orange-100/30 rounded px-3 py-2">
                        <span className="font-bold flex items-center gap-1">
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          <span>Shortcut / Speed Strategy Tip:</span>
                        </span>
                        <p className="mt-1 font-sans">{q.solution.shortcut}</p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
