import { useState, useEffect } from "react";
import { useTestStore } from "./store/testStore";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import TestSetup from "./components/TestSetup";
import TestSandbox from "./components/TestSandbox";
import AnalyticsView from "./components/AnalyticsView";
import SolutionsReview from "./components/SolutionsReview";

export default function App() {
  const { loadFromStorage, pastAttempts, activeTest } = useTestStore();
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // Sync state on startup
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // If a test is active in storage on page load and user didn't intentionally submit on last reload, restore sandbox view
  useEffect(() => {
    if (activeTest && activeTest.status === "running") {
      setCurrentView("sandbox");
    }
  }, [activeTest]);

  // Navigate to newly submitted results automatically
  const handleTestSandboxSubmitted = () => {
    // Read the most recent pastAttempt added
    if (pastAttempts.length > 0) {
      setSelectedAttemptId(pastAttempts[0].id);
    }
    setCurrentView("analytics");
  };

  // Safe fallback if previous action doesn't sync instantly
  useEffect(() => {
    if (currentView === "analytics" && pastAttempts.length > 0 && !selectedAttemptId) {
      setSelectedAttemptId(pastAttempts[0].id);
    }
  }, [currentView, pastAttempts, selectedAttemptId]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Global PWA-Supportive Navbar */}
      <Navbar 
        currentView={currentView} 
        onViewChange={(view) => {
          // Reset select attempts if clicking navbar new dashboard links
          if (view === "dashboard") {
            setSelectedAttemptId(null);
          }
          setCurrentView(view);
        }} 
        isTestRunning={currentView === "sandbox"} 
      />

      {/* Main Container Views Switcher */}
      <main className="flex-1">
        {currentView === "dashboard" && (
          <Dashboard 
            onStartNewTest={() => setCurrentView("setup")}
            onReviewTest={(id) => {
              setSelectedAttemptId(id);
              setCurrentView("analytics");
            }}
          />
        )}

        {currentView === "setup" && (
          <TestSetup 
            onCancel={() => setCurrentView("dashboard")}
            onStartTest={() => setCurrentView("sandbox")}
          />
        )}

        {currentView === "sandbox" && (
          <TestSandbox 
            onSubmitted={handleTestSandboxSubmitted}
          />
        )}

        {currentView === "analytics" && selectedAttemptId && (
          <AnalyticsView 
            attemptId={selectedAttemptId}
            onGoHome={() => {
              setSelectedAttemptId(null);
              setCurrentView("dashboard");
            }}
            onLaunchReview={() => setCurrentView("review")}
          />
        )}

        {currentView === "review" && selectedAttemptId && (
          <SolutionsReview 
            attemptId={selectedAttemptId}
            onBackToScorecard={() => setCurrentView("analytics")}
          />
        )}
      </main>

    </div>
  );
}
