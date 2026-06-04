import { useTestStore } from "../store/testStore";
import { ExamType, Subject, TestAttempt } from "../types";
import { 
  Sparkles, 
  Trophy, 
  Target, 
  Award, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Trash2, 
  RotateCcw,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface DashboardProps {
  onStartNewTest: () => void;
  onReviewTest: (id: string) => void;
}

export default function Dashboard({ onStartNewTest, onReviewTest }: DashboardProps) {
  const { pastAttempts, startTest, deleteAttempt } = useTestStore();

  // Load state and compute values
  const totalAttempted = pastAttempts.length;

  const totalPossibleSum = pastAttempts.reduce((acc, curr) => acc + (curr.totalMarks || 0), 0);
  const totalScoreSum = pastAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);
  const averagePercentage = totalPossibleSum > 0 
    ? Math.round((totalScoreSum / totalPossibleSum) * 100) 
    : 0;

  const bestPercentage = pastAttempts.reduce((max, curr) => {
    const pct = curr.totalMarks && curr.totalMarks > 0 ? (curr.score || 0) / curr.totalMarks : 0;
    return pct > max ? pct : max;
  }, 0);
  const bestPercentageRounded = Math.round(bestPercentage * 100);

  const totalCorrect = pastAttempts.reduce((acc, curr) => {
    return acc + Object.values(curr.attempts).filter((a) => a.isCorrect === true).length;
  }, 0);

  const totalIncorrect = pastAttempts.reduce((acc, curr) => {
    return acc + Object.values(curr.attempts).filter((a) => a.isCorrect === false).length;
  }, 0);

  const aggregateAccuracy = totalCorrect + totalIncorrect > 0
    ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
    : 0;

  // Prepare chart data (chronological list of tests)
  const chartData = [...pastAttempts]
    .reverse()
    .map((attempt, index) => {
      const percentage = attempt.totalMarks && attempt.totalMarks > 0 
        ? Math.round((attempt.score || 0) / attempt.totalMarks * 100)
        : 0;
      return {
        name: `Test ${index + 1}`,
        score: percentage,
        date: new Date(attempt.submittedTime || 0).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        exam: attempt.settings.examType,
      };
    });

  const handleRetake = (attempt: TestAttempt) => {
    startTest({
      examType: attempt.settings.examType,
      selectedSubjects: attempt.settings.selectedSubjects,
      questionLimit: attempt.settings.questionLimit,
      difficulty: attempt.settings.difficulty,
      testMode: attempt.settings.testMode,
      selectedChapters: attempt.settings.selectedChapters,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      
      {/* Welcome & Launch Section */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, Aspirant
          </h2>
          <p className="mt-1 text-slate-500">
            Let's evaluate, identify subject weaknesses, and maximize your JEE scoring potentials today.
          </p>
        </div>
        <button
          onClick={onStartNewTest}
          className="group flex items-center gap-2 rounded-xl bg-brand-blue hover:bg-brand-blue-dark px-6 py-3.5 font-semibold text-white shadow-lg shadow-brand-blue/10 hover:shadow-brand-blue/20 transition-all cursor-pointer"
        >
          <Sparkles className="h-5 w-5" />
          <span>Launch Mock Test</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {totalAttempted === 0 ? (
        /* Empty State Onboarding */
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="mt-6 font-display text-lg font-bold text-slate-900">No mock tests attempted yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
            Generate and solve your custom JEE mock test. Get comprehensive NTA navigation setups, detailed analytics, step-by-step math answers, and smart AI performance analysis.
          </p>
          <button
            onClick={onStartNewTest}
            className="mt-6 rounded-xl bg-brand-blue hover:bg-brand-blue-dark px-6 py-3 font-semibold text-white shadow-md shadow-brand-blue/15 transition-all cursor-pointer"
          >
            Start Your First Test
          </button>
        </div>
      ) : (
        /* Full Statistics Grid & Dashboard */
        <div className="space-y-8">
          
          {/* Key Metric Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Total Attempted */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tests Completed</p>
                  <h3 className="mt-2 font-display text-3xl font-bold text-slate-800">{totalAttempted}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <span className="font-semibold text-brand-blue-dark">100% locally preserved</span>
              </div>
            </div>

            {/* Average Score */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Score rate</p>
                  <h3 className="mt-2 font-display text-3xl font-bold text-slate-800">{averagePercentage}%</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Award className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <div className="h-1.5 w-full rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${averagePercentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* Best Score */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Peak</p>
                  <h3 className="mt-2 font-display text-3xl font-bold text-slate-800">{bestPercentageRounded}%</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <Trophy className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <span className="font-semibold text-orange-600">Top-tier scorecard performance</span>
              </div>
            </div>

            {/* Accuracy Goal */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Accuracy</p>
                  <h3 className="mt-2 font-display text-3xl font-bold text-slate-800">{aggregateAccuracy}%</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Target className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <span className="font-semibold text-violet-600">{totalCorrect} correct answers vs {totalIncorrect} wrong</span>
              </div>
            </div>

          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Trend Performance Chart */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-800">Improvement Trend</h3>
                <span className="text-xs font-medium text-slate-400">Score percentage over attempts</span>
              </div>
              <div className="h-80 w-full pl-0">
                <ResponsiveContainer width="99%" height="100%">
                  <LineChart data={chartData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}
                      labelStyle={{ fontWeight: "bold", color: "#1E293B" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#5B8DEF" 
                      strokeWidth={3} 
                      activeDot={{ r: 8 }} 
                      name="Score Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Tips Cards */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div>
                <h3 className="font-display font-bold text-slate-800">JEE Prep Strategy Tracker</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-brand-blue" />
                    <p className="text-xs text-slate-600领先">
                      <strong>JEE Advanced Marking Rules</strong> demand selecting only correct options. A single incorrect choice results in a -2 drop in score.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <p className="text-xs text-slate-600 leading-normal">
                      <strong>Time Management</strong>: Keep easy questions under 90 seconds. Reserve high margins of time for JEE Advanced calculation steps.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                    <p className="text-xs text-slate-600 leading-normal">
                      <strong>Accuracy over Speed</strong>: If accuracy drops below 60%, prioritize concepts over numerical speed-runs.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Offline PWA Status</span>
                <p className="mt-1 text-xs text-slate-500">
                  This applet loads fully offline! Past attempts, question palettes, and analysis dashboard are securely maintained in your browser sandboxed sandbox.
                </p>
              </div>
            </div>
          </div>

          {/* Historical Session List table */}
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-display font-bold text-slate-800">Session Test History</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {totalAttempted} total
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Session Date</th>
                    <th className="px-6 py-4">Exam Particulars</th>
                    <th className="px-6 py-4">Score & Marks</th>
                    <th className="px-6 py-4 text-center">Accuracy Ratio</th>
                    <th className="px-6 py-4 text-right">Activity Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastAttempts.map((attempt) => {
                    const pct = attempt.totalMarks && attempt.totalMarks > 0 
                      ? Math.round(((attempt.score || 0) / attempt.totalMarks) * 100) 
                      : 0;

                    return (
                      <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Date */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 font-mono">
                          {new Date(attempt.submittedTime || 0).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Exam Particulars */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                                attempt.settings.examType === ExamType.JEE_MAIN
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : attempt.settings.examType === ExamType.JEE_ADVANCED
                                  ? "bg-violet-50 text-violet-700 border border-violet-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {attempt.settings.examType}
                              </span>
                              <span className="text-xs text-slate-400 capitalize font-medium">
                                {attempt.settings.difficulty} difficulty
                              </span>
                            </div>
                            <span className="mt-1 text-xs text-slate-500 font-medium font-mono">
                              {attempt.settings.selectedSubjects.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")} | {attempt.questions.length} questions
                            </span>
                          </div>
                        </td>

                        {/* Marks */}
                        <td className="px-6 py-4 font-mono">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-slate-800">{attempt.score}</span>
                            <span className="text-xs text-slate-400">/ {attempt.totalMarks}</span>
                            <span className={`text-xs ml-1 font-semibold ${pct >= 70 ? "text-emerald-500" : pct >= 45 ? "text-slate-600" : "text-rose-500"}`}>
                              ({pct}%)
                            </span>
                          </div>
                        </td>

                        {/* Accuracy Ratio */}
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 font-mono">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            <span>{attempt.accuracy}%</span>
                          </div>
                        </td>

                        {/* Activity Actions */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onReviewTest(attempt.id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-teal-50 hover:bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-700 transition"
                            >
                              <span>Review</span>
                            </button>
                            <button
                              onClick={() => handleRetake(attempt)}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1.5 text-xs font-bold text-slate-600 transition"
                              title="Retake Test with Same Setup"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteAttempt(attempt.id)}
                              className="inline-flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 p-1.5 text-rose-600 transition"
                              title="Delete Session"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
