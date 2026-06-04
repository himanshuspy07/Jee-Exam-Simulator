import { useEffect, useState } from "react";
import { useTestStore } from "../store/testStore";
import { ExamType, Subject, Difficulty } from "../types";
import { 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Activity, 
  Lightbulb, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

interface AnalyticsViewProps {
  attemptId: string;
  onGoHome: () => void;
  onLaunchReview: () => void;
}

export default function AnalyticsView({ attemptId, onGoHome, onLaunchReview }: AnalyticsViewProps) {
  const { pastAttempts, coachFeedback, feedbackLoading, fetchCoachFeedback } = useTestStore();
  const [selectedPacingQuestIdx, setSelectedPacingQuestIdx] = useState<number>(0);

  const attempt = pastAttempts.find((a) => a.id === attemptId);

  // Trigger coach feedback retrieval immediately for this attempt if not already present
  useEffect(() => {
    if (attemptId) {
      fetchCoachFeedback(attemptId);
    }
  }, [attemptId]);

  if (!attempt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-500" />
        <h3 className="mt-4 text-lg font-bold">Session attempt not found</h3>
        <p className="mt-2 text-sm text-slate-500">The requested test record could not be located in local storage.</p>
        <button onClick={onGoHome} className="mt-6 rounded-lg bg-brand-blue px-4 py-2 text-white font-semibold cursor-pointer">
          Go Back Home
        </button>
      </div>
    );
  }

  // Aggregate numbers
  const pct = attempt.totalMarks && attempt.totalMarks > 0 
    ? Math.round(((attempt.score || 0) / attempt.totalMarks) * 100) 
    : 0;

  const totalQuestions = attempt.questions.length;
  const attemptedCount = Object.values(attempt.attempts).filter(
    (a) => a.selectedValue !== undefined && a.selectedValue !== "" && (Array.isArray(a.selectedValue) ? a.selectedValue.length > 0 : true)
  ).length;

  const correctCount = Object.values(attempt.attempts).filter((a) => a.isCorrect === true).length;
  const incorrectCount = Object.values(attempt.attempts).filter((a) => a.isCorrect === false).length;
  const unattemptedCount = totalQuestions - attemptedCount;

  // Format Time representation
  const formatTimeMinutes = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  // 1. Chart Data: Correct vs Incorrect Pie
  const resultPieData = [
    { name: "Correct Answers", value: correctCount, color: "#22C55E" },
    { name: "Incorrect Answers", value: incorrectCount, color: "#EF4444" },
    { name: "Unattempted", value: unattemptedCount, color: "#94A3B8" },
  ].filter(item => item.value > 0); // exclude empty categories

  // 2. Chart Data: Subject Performance Accuracies
  const subjectBarData = Object.keys(attempt.subjectStats || {}).map((key) => {
    const stats = (attempt.subjectStats as any)[key];
    const accuracy = stats.correctCount + stats.incorrectCount > 0
      ? Math.round((stats.correctCount / (stats.correctCount + stats.incorrectCount)) * 100)
      : 0;
    return {
      subject: stats.subjectName,
      "Accuracy (%)": accuracy,
      Score: stats.score,
    };
  });

  // 3. Chart Data: Time Spent by Subject
  const timePieData = Object.keys(attempt.subjectStats || {}).map((key, idx) => {
    const stats = (attempt.subjectStats as any)[key];
    const colors = ["#5B8DEF", "#10B981", "#8B5CF6"];
    return {
      name: stats.subjectName,
      value: Math.max(1, Math.round(stats.timeSpentSeconds / 60)), // in minutes
      color: colors[idx % colors.length],
    };
  });

  // Pull Gemini advice if available
  const advice = coachFeedback[attempt.id];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div>
          <span className="rounded-md bg-blue-50 border border-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700 uppercase">
            {attempt.settings.examType} Performance Summary
          </span>
          <h2 className="mt-3 font-display text-xl font-bold text-slate-950 sm:text-2xl">
            Test scorecard & analytics
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Submitted on {new Date(attempt.submittedTime || 0).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex gap-3 text-xs leading-none">
          <button
            onClick={onLaunchReview}
            className="flex items-center gap-1.5 rounded-xl bg-brand-blue hover:bg-brand-blue-dark px-5 py-3.5 font-bold text-white shadow-md shadow-brand-blue/10 cursor-pointer"
          >
            <BookOpen className="h-4 w-4" />
            <span>Review Solutions</span>
          </button>
          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 px-5 py-3.5 font-bold text-slate-600 transition cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>

      {/* Main Stats Grid Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Score Got */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">SCORE SECURED</span>
          <div className="my-3">
            <h3 className="font-sans text-4xl font-extrabold text-slate-800 leading-none">
              {attempt.score}
              <span className="text-lg font-semibold text-slate-400 ml-1">/{attempt.totalMarks}</span>
            </h3>
            <span className={`inline-block mt-2.5 rounded-full px-3 py-1 text-xs font-bold ${
              pct >= 70 ? "bg-emerald-50 text-emerald-700" : pct >= 45 ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
            }`}>
              {pct}% overall rate
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Matches correct options weights</p>
        </div>

        {/* Accuracy */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">TEST ACCURACY</span>
          <div className="my-3 flex flex-col items-center">
            <h3 className="font-sans text-4xl font-extrabold text-slate-800 leading-none">{attempt.accuracy}%</h3>
            <div className="h-1.5 w-32 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${attempt.accuracy}%` }} />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium font-mono">
            {correctCount} correct vs {incorrectCount} incorrect
          </p>
        </div>

        {/* Time spent */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">TOTAL TIME ELAPSED</span>
          <div className="my-3">
            <h3 className="font-sans text-2xl font-extrabold text-slate-800 leading-none">
              {formatTimeMinutes(attempt.timeSpentSeconds)}
            </h3>
            <span className="inline-block mt-2 text-xs text-slate-400 leading-none">
              Allowed: {Math.round(attempt.durationSeconds / 60)} minutes
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase">
            Avg pacing: {totalQuestions > 0 ? Math.round((attempt.timeSpentSeconds / totalQuestions) * 10) / 10 : 0}s per Q
          </p>
        </div>

        {/* Attempt Rate */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center flex flex-col justify-between">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none">ATTEMPT RATE</span>
          <div className="my-3 flex flex-col items-center">
            <h3 className="font-sans text-4xl font-extrabold text-slate-800 leading-none">
              {totalQuestions > 0 ? Math.round((attemptedCount / totalQuestions) * 100) : 0}%
            </h3>
            <span className="inline-block mt-2 text-xs text-slate-400 font-medium">
              Solved {attemptedCount} out of {totalQuestions}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            {unattemptedCount} left unattempted
          </p>
        </div>

      </div>

      {/* Visual Analytics Charts Panel */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Pie correct vs incorrect breakdown */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h4 className="font-display text-sm font-bold text-slate-800 mb-3">Response Distribution</h4>
          <div className="h-56">
            {resultPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Zero attempted questions to display.</div>
            ) : (
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={resultPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {resultPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} questions`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="border-t pt-3 flex justify-around text-[10px] font-bold uppercase font-mono text-slate-500">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span>Correct ({correctCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              <span>Wrong ({incorrectCount})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Unsolved ({unattemptedCount})</span>
            </div>
          </div>
        </div>

        {/* Accuracies by subject (Bar chart) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:col-span-2">
          <h4 className="font-display text-sm font-bold text-slate-800 mb-3">Subject Accuracy Rate</h4>
          <div className="h-56">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={subjectBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="subject" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Accuracy (%)" fill="#5B8DEF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Time Management & Pacing Diagnostics Panel */}
      {(() => {
        const pacingStats = { stalled: 0, ideal: 0, rushed: 0, skipped: 0 };
        attempt.questions.forEach((q) => {
          const qAttempt = attempt.attempts[q.id];
          const isAttempted = qAttempt?.selectedValue !== undefined && qAttempt?.selectedValue !== "" && (Array.isArray(qAttempt?.selectedValue) ? qAttempt?.selectedValue.length > 0 : true);
          const secs = qAttempt?.timeSpentSeconds || 0;

          if (!isAttempted) {
            pacingStats.skipped++;
          } else if (secs > 150) {
            pacingStats.stalled++;
          } else if (secs < 45) {
            pacingStats.rushed++;
          } else {
            pacingStats.ideal++;
          }
        });

        const activeQ = attempt.questions[selectedPacingQuestIdx] || attempt.questions[0];
        const activeAttempt = attempt.attempts[activeQ?.id];
        const activeSecs = activeAttempt?.timeSpentSeconds || 0;
        const activeIsAttempted = activeAttempt?.selectedValue !== undefined && activeAttempt?.selectedValue !== "" && (Array.isArray(activeAttempt?.selectedValue) ? activeAttempt?.selectedValue.length > 0 : true);
        
        let activePacingLabel = "Skipped";
        let activePacingColor = "text-slate-400 bg-slate-50";
        if (activeIsAttempted) {
          if (activeSecs > 150) {
            activePacingLabel = "Stalled / Over-analyzed (>2.5 min)";
            activePacingColor = "text-red-600 bg-red-50 border-red-100";
          } else if (activeSecs < 45) {
            activePacingLabel = "Rushed (<45s)";
            activePacingColor = "text-amber-600 bg-amber-50 border-amber-100";
          } else {
            activePacingLabel = "Ideal Practice Pace";
            activePacingColor = "text-green-600 bg-green-50 border-green-100";
          }
        }

        return (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                    Time Management & Pacing Diagnostics
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Evaluate subject speed ratios, time leaks, and over-analysis metrics</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 text-brand-blue border border-blue-100/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Exam Telemetry Dashboard
              </span>
            </div>

            {/* Stats row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              
              <div className="rounded-xl border border-red-100 bg-red-50/10 p-4 space-y-1 text-center">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">STALLED</span>
                <p className="font-sans text-2xl font-extrabold text-slate-800 leading-none">{pacingStats.stalled}</p>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Spent &gt;2.5 mins (Caution)</p>
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50/10 p-4 space-y-1 text-center font-sans">
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest leading-none text-center">OPTIMAL PACE</span>
                <p className="font-sans text-2xl font-extrabold text-slate-800 leading-none">{pacingStats.ideal}</p>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Spent 45s - 150s (Perfect)</p>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/10 p-4 space-y-1 text-center">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest leading-none font-sans">RUSHED</span>
                <p className="font-sans text-2xl font-extrabold text-slate-800 leading-none">{pacingStats.rushed}</p>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Spent &lt;45s (Risk of error)</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none font-sans">SKIPPED</span>
                <p className="font-sans text-2xl font-extrabold text-slate-800 leading-none">{pacingStats.skipped}</p>
                <p className="text-[10px] text-slate-400 font-medium font-sans font-sans font-sans">No response logged</p>
              </div>

            </div>

            {/* Split row: Grid selection vs detail indicator card */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Question blocks grid selection */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Click a question block to analyze detailed telemetry
                </label>

                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-56 overflow-y-auto pr-1">
                  {attempt.questions.map((q, idx) => {
                    const qAttempt = attempt.attempts[q.id];
                    const qSecs = qAttempt?.timeSpentSeconds || 0;
                    const isAttempted = qAttempt?.selectedValue !== undefined && qAttempt?.selectedValue !== "" && (Array.isArray(qAttempt?.selectedValue) ? qAttempt?.selectedValue.length > 0 : true);
                    const isCorrect = qAttempt?.isCorrect;

                    let bgBase = "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-350";
                    if (isAttempted) {
                      if (isCorrect === true) {
                        bgBase = "bg-green-500/10 border-green-500 text-green-700 hover:bg-green-500/20";
                      } else if (isCorrect === false) {
                        bgBase = "bg-red-500/10 border-red-500 text-red-700 hover:bg-red-500/20";
                      } else {
                        bgBase = "bg-blue-500/10 border-blue-500 text-blue-700 hover:bg-blue-500/20";
                      }
                    }

                    const isSelected = idx === selectedPacingQuestIdx;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelectedPacingQuestIdx(idx)}
                        className={`h-11 rounded-lg border-2 text-center text-xs font-bold leading-none flex flex-col justify-center items-center gap-0.5 transition cursor-pointer ${bgBase} ${
                          isSelected ? "ring-2 ring-brand-blue ring-offset-2 scale-105" : ""
                        }`}
                      >
                        <span className="font-mono text-[10px]">Q{idx + 1}</span>
                        <span className="text-[8px] font-medium font-normal font-sans tracking-tight text-slate-500">
                          {qSecs}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail indicator card bubble */}
              {activeQ && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-brand-blue uppercase bg-blue-50 rounded px-2 py-0.5 tracking-wide border border-blue-105">
                        Question #{selectedPacingQuestIdx + 1} Metrics
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 capitalize">
                        {activeQ.subject}
                      </span>
                    </div>

                    <h5 className="font-display font-extrabold text-xs text-slate-800 leading-snug">
                      {activeQ.chapter}
                    </h5>

                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-2 italic">
                      "{activeQ.questionText}"
                    </p>

                    <div className="border-t border-slate-100 pt-2.5 space-y-2 text-[11px] font-medium">
                      
                      {/* Pacing Category badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Speed Index:</span>
                        <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold ${activePacingColor}`}>
                          {activePacingLabel}
                        </span>
                      </div>

                      {/* Time Spent */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Time Logged:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {activeSecs} seconds ({Math.round(activeSecs / 6) / 10}m)
                        </span>
                      </div>

                      {/* Score Result Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Result Evaluated:</span>
                        <span>
                          {activeIsAttempted ? (
                            activeAttempt?.isCorrect ? (
                              <strong className="text-green-600">Correct (+4 Marks)</strong>
                            ) : (
                              <strong className="text-rose-600">Incorrect (-1 Marks/0)</strong>
                            )
                          ) : (
                            <strong className="text-slate-400">Skipped (0 Marks)</strong>
                          )}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Adaptive Coach Tip */}
                  <div className="bg-white border rounded-xl p-3 text-[10px] leading-relaxed text-slate-500 font-medium">
                    <span className="font-extrabold text-slate-800 uppercase block text-[8px] tracking-wider mb-0.5">Coach Diagnostic Tip:</span>
                    {activeIsAttempted ? (
                      activeAttempt?.isCorrect ? (
                        activeSecs > 150 ? (
                          "Accurate but too slow. Minimize scratchpad detailing to shave off 60 seconds per similar question."
                        ) : (
                          "Perfect execution! High speed and accurate. Perfect rhythm for saving time for tougher questions."
                        )
                      ) : activeSecs > 150 ? (
                        "Double-risk! Spent excessive time and ultimately guessed incorrectly. Skip earlier if stuck in calculation loops."
                      ) : (
                        "Silly mistake hazard. Solved too fast. Take an extra 15 seconds to double-check calculation and option variables."
                      )
                    ) : (
                      "Smart skip decision if you felt uncertain. JEE permits leaving unfamiliar patterns to prevent negative mark deductions."
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>
        );
      })()}

      {/* Advanced Heuristic and Chapter Breakdown Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Subject-Wise Table */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-display text-sm font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-brand-blue" />
            <span>Subject-wise Matrix</span>
          </h3>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Subject</th>
                  <th className="pb-2 text-center">Score</th>
                  <th className="pb-2 text-center">Correct/Tried</th>
                  <th className="pb-2 text-center">Accuracy</th>
                  <th className="pb-2 text-right">Time Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {Object.keys(attempt.subjectStats || {}).map((key) => {
                  const sStats = (attempt.subjectStats as any)[key];
                  const tried = sStats.correctCount + sStats.incorrectCount;
                  const accuracy = tried > 0 ? Math.round((sStats.correctCount / tried) * 100) : 0;
                  return (
                    <tr key={key} className="hover:bg-slate-50/50">
                      <td className="py-2.5 font-bold uppercase tracking-wider text-slate-800">{key}</td>
                      <td className="py-2.5 text-center font-mono">{sStats.score}</td>
                      <td className="py-2.5 text-center font-mono text-slate-500">{sStats.correctCount}/{sStats.totalCount}</td>
                      <td className="py-2.5 text-center">
                        <span className={`rounded-xl px-2 py-0.5 font-mono text-[10px] ${
                          accuracy >= 70 ? "bg-emerald-50 text-emerald-700" : accuracy >= 45 ? "bg-slate-100 text-slate-600" : "bg-rose-50 text-rose-700"
                        }`}>
                          {accuracy}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-normal text-slate-400">{Math.round(sStats.timeSpentSeconds / 60)} min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Level Performance Difficulty metrics */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-display text-sm font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-brand-blue" />
            <span>Difficulty-wise Accuracy breakdown</span>
          </h3>
          <div className="space-y-4">
            {Object.keys(attempt.difficultyStats || {}).map((level) => {
              const item = (attempt.difficultyStats as any)[level];
              const totalTried = item.correct + item.incorrect;
              const accuracy = totalTried > 0 ? Math.round((item.correct / totalTried) * 100) : 0;

              let barColor = "bg-emerald-500";
              if (level === Difficulty.MEDIUM) barColor = "bg-blue-500";
              else if (level === Difficulty.HARD) barColor = "bg-violet-500";

              return (
                <div key={level} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600 font-semibold uppercase tracking-wider">
                    <span className="font-bold text-slate-700">{level} Questions</span>
                    <span className="font-mono font-medium">{item.correct} correct of {item.total} total ({accuracy}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-150 rounded-full w-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${accuracy}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* AI COACH advice block section */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4 border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
              <Sparkles className="h-5.5 w-5.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900">AI Coach Advisor Personalized Feedback</h3>
              <p className="text-xs text-slate-400 font-medium font-mono leading-none mt-1">POWERED BY GEMINI 3.5 FLASH</p>
            </div>
          </div>
          <span className="rounded-full bg-violet-50 text-violet-600 border border-violet-100 px-3 py-1 text-[11px] font-bold">
            Real-time Concept Diagnostic
          </span>
        </div>

        {feedbackLoading ? (
          /* Pulsing loading skeletons as ruled */
          <div className="space-y-4 animate-pulse">
            <div className="h-5 bg-slate-150 rounded-lg w-1/3" />
            <div className="h-4 bg-slate-150 rounded-lg w-full" />
            <div className="h-4 bg-slate-150 rounded-lg w-5/6" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl" />
              <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl" />
            </div>
          </div>
        ) : advice ? (
          /* Present dynamic returned advise roadmaps */
          <div className="space-y-5 animate-fadeIn">
            
            {/* Title & Exec summary */}
            <div>
              <h4 className="font-display text-base font-bold text-slate-800 flex items-center gap-1.5 leading-tight">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <span>{advice.title}</span>
              </h4>
              <p className="mt-2 text-xs text-slate-600 leading-normal bg-violet-50/20 border border-violet-100/50 rounded-xl p-4">
                {advice.summary}
              </p>
            </div>

            {/* Strengths vs Weaknesses list cards */}
            <div className="grid gap-4 sm:grid-cols-2 text-xs leading-relaxed">
              
              {/* Strengths card */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/10 p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-1 leading-none">
                  <CheckCircle className="h-4 w-4" />
                  <span>Strong Concept Pillars</span>
                </span>
                <ul className="space-y-2 pt-1 text-slate-600 font-medium">
                  {advice.strongTopics.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses card */}
              <div className="rounded-xl border border-rose-100 bg-rose-50/10 p-5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 flex items-center gap-1 leading-none">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Focus Focus Core Areas</span>
                </span>
                <ul className="space-y-2 pt-1 text-slate-600 font-medium">
                  {advice.weakTopics.map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-rose-500 font-bold shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Targeted action plan bullets */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Targeted Study Actions Plan</span>
              <div className="grid gap-3 sm:grid-cols-3">
                {advice.studyActionPlan.map((action, idx) => (
                  <div key={idx} className="bg-white border rounded-xl p-4 shadow-2xs space-y-2 text-xs">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-blue text-white font-bold font-mono">
                      {idx + 1}
                    </span>
                    <p className="text-slate-600 font-medium leading-relaxed font-sans">{action}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-violet-700">
                <span>ESTIMATED RETAKE GAP PREP WORK</span>
                <span className="font-mono bg-violet-100/50 border border-violet-100 px-3 py-1 rounded">
                  {advice.estimatedPrepTimeWeeks} WEEKS ACTION
                </span>
              </div>
            </div>

          </div>
        ) : (
          /* Connection problem / retry suggestions card */
          <div className="flex flex-col items-center justify-center text-center py-6 text-xs text-slate-400 space-y-2">
            <p>Could not fetch real-time coach feedback from Gemini. Verify network connection or check developer secrets.</p>
            <button
              onClick={() => fetchCoachFeedback(attempt.id)}
              className="rounded-lg bg-slate-150 px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-250 cursor-pointer"
            >
              Retry AI Analysis
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
