import React, { useState, useEffect } from "react";
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
  FileSpreadsheet,
  Download,
  X,
  Monitor,
  Smartphone,
  Share2,
  HelpCircle,
  Info
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface DashboardProps {
  onStartNewTest: () => void;
  onReviewTest: (id: string) => void;
}

export default function Dashboard({ onStartNewTest, onReviewTest }: DashboardProps) {
  const { pastAttempts, startTest, deleteAttempt } = useTestStore();

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    return localStorage.getItem("jee-pwa-banner-dismissed") !== "true";
  });
  const [showHowToInstall, setShowHowToInstall] = useState(false);

  useEffect(() => {
    // Detect if already installed and running standalone
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      setShowHowToInstall(true);
    }
  };

  const dismissBanner = () => {
    localStorage.setItem("jee-pwa-banner-dismissed", "true");
    setShowInstallBanner(false);
  };

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

      {/* PWA Promotion & Installation Banner */}
      {!isStandalone && showInstallBanner && (
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-blue-105 bg-linear-to-r from-blue-50 to-indigo-50/40 p-6 shadow-xs animate-fadeIn flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src="/assets/logo-512.png"
                alt="JEE Exam Simulator Custom Logo"
                className="h-16 w-16 rounded-2xl shadow-md border border-white"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://picsum.photos/seed/educated/150/150";
                }}
              />
              <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-white shadow-xs border-2 border-white">
                <Sparkles className="h-3 w-3" />
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-blue/15 text-brand-blue border border-brand-blue/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide">
                  Install Available
                </span>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest font-mono">
                  Offline Ready
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-800 leading-snug">
                Install "JEE Exam Simulator" on Your Device
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-sans font-medium">
                Add this application to your home screen or desktop taskbar with its official custom logo. Run in a clean, dedicated standalone window, enjoy faster load times, and practice mock questions entirely offline.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={handleInstallClick}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 rounded-xl bg-brand-blue hover:bg-brand-blue-dark px-5 py-3 text-xs font-bold text-white shadow-sm shadow-brand-blue/10 transition-all cursor-pointer select-none"
            >
              <Download className="h-4 w-4" />
              <span>Install App Now</span>
            </button>
            <button
              onClick={() => setShowHowToInstall(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 transition-all cursor-pointer select-none"
            >
              <HelpCircle className="h-4 w-4 text-slate-400" />
              <span>How To Install</span>
            </button>
            <button
              onClick={dismissBanner}
              className="p-2.5 rounded-xl hover:bg-slate-250 border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Standalone Success Toast-style notice */}
      {isStandalone && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 shadow-3xs animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium animate-pulse">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Running in standalone desktop/mobile client mode with the official Custom Logo.</span>
          </div>
          <span className="text-[9px] font-bold text-emerald-600 font-mono tracking-widest uppercase">
            ✓ STANDALONE INSTALLED CLIENT
          </span>
        </div>
      )}

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

      {/* Elegant How-To-Install Modal Overlay */}
      {showHowToInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs animate-fadeIn p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/15 text-brand-blue">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-slate-900 leading-tight">
                    Installation Guidelines
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Pin Custom Logo App on any platform
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHowToInstall(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 max-h-[420px] bg-white">
              
              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100/50 rounded-xl p-3">
                <img
                  src="/assets/logo-512.png"
                  alt="App Icon View"
                  className="h-12 w-12 rounded-xl shadow-xs border border-white"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://picsum.photos/seed/educated/150/150";
                  }}
                />
                <div className="leading-tight">
                  <h4 className="text-xs font-bold text-slate-800">JEE Exam Simulator</h4>
                  <p className="text-[10px] text-slate-505 font-sans mt-0.5">High-Precision NTA Sandbox for Physics, Chemistry, and Math</p>
                </div>
              </div>

              {/* iOS Safari Steps */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-1">
                  <Smartphone className="h-4 w-4 text-emerald-500" />
                  <span>iOS Device (Safari Browser)</span>
                </div>
                <ol className="list-decimal pl-5 text-[11px] text-slate-600 space-y-1 font-medium font-sans leading-normal">
                  <li>Open this page in the default <strong className="text-slate-800">Safari</strong> browser.</li>
                  <li>Tap the <strong className="text-slate-800">Share</strong> button (the box with an upward-pointing arrow) in the bottom navigation bar.</li>
                  <li>Scroll down and select <strong className="text-slate-800">Add to Home Screen</strong>.</li>
                  <li>Tap <strong className="text-brand-blue">Add</strong> in the top-right corner. The app icon will appear on your device layout.</li>
                </ol>
              </div>

              {/* Android Chrome Steps */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-1">
                  <Smartphone className="h-4 w-4 text-brand-blue" />
                  <span>Android Device (Chrome / Edge)</span>
                </div>
                <ol className="list-decimal pl-5 text-[11px] text-slate-600 space-y-1 font-medium font-sans leading-normal">
                  <li>Tap the <strong className="text-slate-800">three-dots menu</strong> in the top-right corner of the browser.</li>
                  <li>Tap <strong className="text-slate-800">Add to Home screen</strong> or <strong className="text-slate-805">Install app</strong>.</li>
                  <li>Confirm by pressing <strong className="text-brand-blue">Install</strong> in the pop-up prompt.</li>
                </ol>
              </div>

              {/* Desktop Browsers (Mac, Windows, Linux) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-1">
                  <Monitor className="h-4 w-4 text-violet-500" />
                  <span>Desktop Computers (Chrome, Edge, Brave)</span>
                </div>
                <ol className="list-decimal pl-5 text-[11px] text-slate-600 space-y-1 font-medium font-sans leading-normal">
                  <li>Look at the right side of your browser's <strong className="text-slate-805">address bar</strong> (URL bar).</li>
                  <li>Click on the <strong className="text-slate-805">App Install Icon</strong> (looks like a monitor screen with an arrow, or a plus ⊕ button).</li>
                  <li>Or, click the browser's menu (three dots) and choose <strong className="text-slate-805">Save and share</strong> → <strong className="text-slate-805">Install page as app</strong>.</li>
                </ol>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold text-slate-400">PWA CAPABILITIES ACTIVE</span>
              <button
                onClick={() => setShowHowToInstall(false)}
                className="rounded-lg bg-slate-200 hover:bg-slate-300 px-4 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Got It
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
