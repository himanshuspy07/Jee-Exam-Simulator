import { create } from "zustand";
import { Question, Subject, Difficulty, ExamType, QuestionType, TestSettings, TestAttempt, QuestionAttempt, AICoachFeedback } from "../types";
import { sampleQuestions } from "../data/questions";

interface TestStore {
  pastAttempts: TestAttempt[];
  activeTest: TestAttempt | null;
  activeQuestionIndex: number;
  isGenerating: boolean;
  isSubmitting: boolean;
  coachFeedback: Record<string, AICoachFeedback>; // attemptId -> feedback mapping
  feedbackLoading: boolean;

  // Actions
  loadFromStorage: () => void;
  startTest: (settings: Omit<TestSettings, "id">) => void;
  updateActiveQuestionAttempt: (answer: string | string[], status: QuestionAttempt["status"]) => void;
  clearResponse: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setQuestionIndex: (index: number) => void;
  submitTest: () => Promise<void>;
  deleteAttempt: (id: string) => void;
  fetchCoachFeedback: (attemptId: string) => Promise<void>;
  retakeTest: (settings: Omit<TestSettings, "id">) => void;
}

// Formula for calculating duration
export function calculateTestDuration(questions: Question[], baseDifficulty: Difficulty): number {
  let totalMinutes = 0;
  questions.forEach((q) => {
    const diff = q.difficulty;
    if (diff === Difficulty.EASY) {
      totalMinutes += 1.5;
    } else if (diff === Difficulty.MEDIUM) {
      totalMinutes += 2.5;
    } else {
      totalMinutes += 4.0;
    }
  });

  // If empty, default to standard timing
  return Math.max(1, Math.round(totalMinutes)) * 60; // in seconds
}

export const useTestStore = create<TestStore>((set, get) => ({
  pastAttempts: [],
  activeTest: null,
  activeQuestionIndex: 0,
  isGenerating: false,
  isSubmitting: false,
  coachFeedback: {},
  feedbackLoading: false,

  loadFromStorage: () => {
    try {
      const attempts = localStorage.getItem("jee_past_attempts");
      const active = localStorage.getItem("jee_active_test");
      const activeIdx = localStorage.getItem("jee_active_question_idx");
      const feedback = localStorage.getItem("jee_coach_feedbacks");

      set({
        pastAttempts: attempts ? JSON.parse(attempts) : [],
        activeTest: active ? JSON.parse(active) : null,
        activeQuestionIndex: activeIdx ? parseInt(activeIdx, 10) : 0,
        coachFeedback: feedback ? JSON.parse(feedback) : {},
      });
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
  },

  startTest: (settingsInput) => {
    set({ isGenerating: true });
    
    const id = "test_" + Date.now();
    const settings: TestSettings = {
      ...settingsInput,
      id,
    };

    // Smart generation algorithm:
    // 1. Filter sample questions matching exam specifications
    let filtered = sampleQuestions.filter((q) => {
      // If PYQ selected, only include questions matching PYQs or specific tagged PYQ years
      if (settings.examType === ExamType.PYQS) {
        return q.examType === ExamType.PYQS || q.pyqYear !== undefined;
      }
      
      // If JEE Main or Advanced, filter appropriate pool
      if (settings.examType === ExamType.JEE_MAIN) {
        return q.examType === ExamType.JEE_MAIN;
      }
      if (settings.examType === ExamType.JEE_ADVANCED) {
        return q.examType === ExamType.JEE_ADVANCED;
      }
      return true;
    });

    // 2. Filter subjects
    filtered = filtered.filter((q) => settings.selectedSubjects.includes(q.subject));

    // 3. Filter difficulty if not "mixed"
    if (settings.difficulty !== Difficulty.MIXED) {
      filtered = filtered.filter((q) => q.difficulty === settings.difficulty);
    }

    // 4. Shuffle filtered list to create distinct exams
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());

    // 5. Slice to questionLimit
    const limit = settings.questionLimit;
    const finalQuestions = shuffled.slice(0, limit);

    // If finalQuestions is empty (failsafe), add a few generic matching ones
    if (finalQuestions.length === 0) {
      // Find any from matching subjects to make sure test doesn't fail
      const backup = sampleQuestions.filter((q) => settings.selectedSubjects.includes(q.subject));
      finalQuestions.push(...backup.slice(0, limit));
    }

    // 6. Calculate test details
    const totalMarks = finalQuestions.reduce((acc, q) => {
      if (settings.examType === ExamType.JEE_ADVANCED) {
        if (q.type === QuestionType.MULTI_CORRECT) return acc + 4;
        if (q.type === QuestionType.NUMERICAL) return acc + 4;
        return acc + 3; // single-correct
      }
      // Main and PYQ have standard 4 points
      return acc + 4;
    }, 0);

    const durationSeconds = calculateTestDuration(finalQuestions, settings.difficulty);

    // Make initial empty attempts list
    const attempts: Record<string, QuestionAttempt> = {};
    finalQuestions.forEach((q) => {
      attempts[q.id] = {
        questionId: q.id,
        status: "not-visited",
        timeSpentSeconds: 0,
      };
    });

    // First question is automatically "visited" but "not-answered"
    if (finalQuestions.length > 0) {
      attempts[finalQuestions[0].id].status = "not-answered";
    }

    const newTest: TestAttempt = {
      id,
      settings,
      questions: finalQuestions,
      attempts,
      startTime: Date.now(),
      timeSpentSeconds: 0,
      durationSeconds,
      status: "running",
    };

    localStorage.setItem("jee_active_test", JSON.stringify(newTest));
    localStorage.setItem("jee_active_question_idx", "0");

    set({
      activeTest: newTest,
      activeQuestionIndex: 0,
      isGenerating: false,
    });
  },

  updateActiveQuestionAttempt: (answer, status) => {
    const { activeTest, activeQuestionIndex } = get();
    if (!activeTest) return;

    const activeQuestion = activeTest.questions[activeQuestionIndex];
    if (!activeQuestion) return;

    const updatedAttempts = { ...activeTest.attempts };
    updatedAttempts[activeQuestion.id] = {
      ...updatedAttempts[activeQuestion.id],
      selectedValue: answer,
      status,
    };

    const updatedTest: TestAttempt = {
      ...activeTest,
      attempts: updatedAttempts,
    };

    localStorage.setItem("jee_active_test", JSON.stringify(updatedTest));
    set({ activeTest: updatedTest });
  },

  clearResponse: () => {
    const { activeTest, activeQuestionIndex } = get();
    if (!activeTest) return;

    const activeQuestion = activeTest.questions[activeQuestionIndex];
    if (!activeQuestion) return;

    const updatedAttempts = { ...activeTest.attempts };
    updatedAttempts[activeQuestion.id] = {
      ...updatedAttempts[activeQuestion.id],
      selectedValue: undefined,
      status: "not-answered",
    };

    const updatedTest: TestAttempt = {
      ...activeTest,
      attempts: updatedAttempts,
    };

    localStorage.setItem("jee_active_test", JSON.stringify(updatedTest));
    set({ activeTest: updatedTest });
  },

  nextQuestion: () => {
    const { activeTest, activeQuestionIndex } = get();
    if (!activeTest) return;

    if (activeQuestionIndex < activeTest.questions.length - 1) {
      const nextIdx = activeQuestionIndex + 1;
      const nextQuestionId = activeTest.questions[nextIdx].id;

      // Update visited status on the next question
      const updatedAttempts = { ...activeTest.attempts };
      if (updatedAttempts[nextQuestionId].status === "not-visited") {
        updatedAttempts[nextQuestionId].status = "not-answered";
      }

      const updatedTest = { ...activeTest, attempts: updatedAttempts };
      localStorage.setItem("jee_active_test", JSON.stringify(updatedTest));
      localStorage.setItem("jee_active_question_idx", nextIdx.toString());
      set({ activeQuestionIndex: nextIdx, activeTest: updatedTest });
    }
  },

  prevQuestion: () => {
    const { activeQuestionIndex } = get();
    if (activeQuestionIndex > 0) {
      const nextIdx = activeQuestionIndex - 1;
      localStorage.setItem("jee_active_question_idx", nextIdx.toString());
      set({ activeQuestionIndex: nextIdx });
    }
  },

  setQuestionIndex: (idx) => {
    const { activeTest } = get();
    if (!activeTest) return;

    if (idx >= 0 && idx < activeTest.questions.length) {
      const nextQuestionId = activeTest.questions[idx].id;
      const updatedAttempts = { ...activeTest.attempts };
      
      if (updatedAttempts[nextQuestionId].status === "not-visited") {
        updatedAttempts[nextQuestionId].status = "not-answered";
      }

      const updatedTest = { ...activeTest, attempts: updatedAttempts };
      localStorage.setItem("jee_active_test", JSON.stringify(updatedTest));
      localStorage.setItem("jee_active_question_idx", idx.toString());
      
      set({ activeQuestionIndex: idx, activeTest: updatedTest });
    }
  },

  submitTest: async () => {
    const { activeTest, pastAttempts } = get();
    if (!activeTest) return;

    set({ isSubmitting: true });

    const submittedTime = Date.now();
    const timeSpentSeconds = Math.min(
      Math.round((submittedTime - activeTest.startTime) / 1000),
      activeTest.durationSeconds
    );

    // Calculate score, correct/incorrect, subject-wise statistics
    let totalScore = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const subjectsInfo: Record<Subject, {
      subjectName: string;
      totalCount: number;
      correctCount: number;
      incorrectCount: number;
      score: number;
      timeSpentSeconds: number;
    }> = {
      [Subject.PHYSICS]: { subjectName: "Physics", totalCount: 0, correctCount: 0, incorrectCount: 0, score: 0, timeSpentSeconds: 0 },
      [Subject.CHEMISTRY]: { subjectName: "Chemistry", totalCount: 0, correctCount: 0, incorrectCount: 0, score: 0, timeSpentSeconds: 0 },
      [Subject.MATHEMATICS]: { subjectName: "Mathematics", totalCount: 0, correctCount: 0, incorrectCount: 0, score: 0, timeSpentSeconds: 0 },
    };

    const difficultyStats: Record<string, { total: number; correct: number; incorrect: number }> = {
      [Difficulty.EASY]: { total: 0, correct: 0, incorrect: 0 },
      [Difficulty.MEDIUM]: { total: 0, correct: 0, incorrect: 0 },
      [Difficulty.HARD]: { total: 0, correct: 0, incorrect: 0 },
    };

    const processedAttempts: Record<string, QuestionAttempt> = {};

    activeTest.questions.forEach((q) => {
      const userAttempt = activeTest.attempts[q.id];
      const ansSelected = userAttempt?.selectedValue;

      let isCorrect = false;
      let marksAwarded = 0;
      let currentMaxMarks = 4;

      // Calculate base maximum marks for this question
      if (activeTest.settings.examType === ExamType.JEE_ADVANCED) {
        if (q.type === QuestionType.MULTI_CORRECT) currentMaxMarks = 4;
        else if (q.type === QuestionType.NUMERICAL) currentMaxMarks = 4;
        else currentMaxMarks = 3;
      }
      totalMarks += currentMaxMarks;

      const isAttempted = ansSelected !== undefined && ansSelected !== "" && (Array.isArray(ansSelected) ? ansSelected.length > 0 : true);

      if (isAttempted) {
        if (q.type === QuestionType.SINGLE_CORRECT) {
          isCorrect = ansSelected === q.correctAnswer;
          if (isCorrect) {
            marksAwarded = currentMaxMarks === 3 ? 3 : 4;
            correctCount++;
          } else {
            marksAwarded = -1;
            incorrectCount++;
          }
        } 
        else if (q.type === QuestionType.NUMERICAL) {
          // Compare trimmed numeric strings or soft values
          const cleanAnswer = String(ansSelected).trim().toLowerCase();
          const cleanCorrect = String(q.correctAnswer).trim().toLowerCase();
          
          isCorrect = cleanAnswer === cleanCorrect || parseFloat(cleanAnswer) === parseFloat(cleanCorrect);
          if (isCorrect) {
            marksAwarded = 4;
            correctCount++;
          } else {
            marksAwarded = 0; // standard JEE integers have no negative marks
            incorrectCount++;
          }
        } 
        else if (q.type === QuestionType.MULTI_CORRECT) {
          // Multiple correct parsing (JEE Advanced)
          const chosenSet = new Set(Array.isArray(ansSelected) ? ansSelected : [ansSelected]);
          const correctSet = new Set(Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]);

          // Check if any option is incorrect
          let chosenAnyIncorrect = false;
          chosenSet.forEach((choice) => {
            if (!correctSet.has(choice)) {
              chosenAnyIncorrect = true;
            }
          });

          if (chosenAnyIncorrect) {
            marksAwarded = -2; // Standard JEE Advanced negative marking is -2 for multi-correct
            incorrectCount++;
          } else {
            // No incorrect choices selected. Check if fully correct
            const isFullyCorrect = chosenSet.size === correctSet.size;
            if (isFullyCorrect) {
              marksAwarded = 4;
              isCorrect = true;
              correctCount++;
            } else {
              // Partial marking: +1 for each correct choice made, provided no incorrect options
              marksAwarded = chosenSet.size;
              isCorrect = true; // Partially correct counts as "correct attempt accuracy wise"
              correctCount++;
            }
          }
        }
      } else {
        unattemptedCount++;
        marksAwarded = 0;
      }

      totalScore += marksAwarded;

      processedAttempts[q.id] = {
        ...userAttempt,
        isCorrect: isAttempted ? isCorrect : undefined,
        marksAwarded,
        timeSpentSeconds: userAttempt?.timeSpentSeconds || 0,
      };

      // Add to subject-wise
      const info = subjectsInfo[q.subject];
      info.totalCount++;
      info.timeSpentSeconds += userAttempt?.timeSpentSeconds || 0;
      if (isAttempted) {
        info.score += marksAwarded;
        if (isCorrect) {
          info.correctCount++;
        } else {
          info.incorrectCount++;
        }
      }

      // Add to difficulty-wise
      const diffKey = q.difficulty === Difficulty.MIXED ? Difficulty.MEDIUM : q.difficulty;
      const diffStat = difficultyStats[diffKey];
      diffStat.total++;
      if (isAttempted) {
        if (isCorrect) diffStat.correct++;
        else diffStat.incorrect++;
      }
    });

    const accuracyVal = correctCount + incorrectCount > 0 
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
      : 0;

    // Build finalized test details
    const finalizedTest: TestAttempt = {
      ...activeTest,
      attempts: processedAttempts,
      submittedTime,
      timeSpentSeconds,
      status: "submitted",
      score: totalScore,
      totalMarks,
      accuracy: accuracyVal,
      subjectStats: subjectsInfo as any,
      difficultyStats: difficultyStats as any,
    };

    const newPastAttempts = [finalizedTest, ...pastAttempts];

    // Persist to storage
    localStorage.setItem("jee_past_attempts", JSON.stringify(newPastAttempts));
    localStorage.removeItem("jee_active_test");
    localStorage.removeItem("jee_active_question_idx");

    set({
      pastAttempts: newPastAttempts,
      activeTest: null,
      isSubmitting: false,
    });

    // Proactively fetch coach suggestions in background
    setTimeout(() => {
      get().fetchCoachFeedback(finalizedTest.id);
    }, 500);
  },

  deleteAttempt: (id) => {
    const { pastAttempts, coachFeedback } = get();
    const updated = pastAttempts.filter((a) => a.id !== id);
    
    const updatedFeedback = { ...coachFeedback };
    delete updatedFeedback[id];

    localStorage.setItem("jee_past_attempts", JSON.stringify(updated));
    localStorage.setItem("jee_coach_feedbacks", JSON.stringify(updatedFeedback));
    
    set({ pastAttempts: updated, coachFeedback: updatedFeedback });
  },

  fetchCoachFeedback: async (attemptId) => {
    const { pastAttempts, coachFeedback } = get();
    if (coachFeedback[attemptId]) return; // Already exists

    const attempt = pastAttempts.find((a) => a.id === attemptId);
    if (!attempt) return;

    set({ feedbackLoading: true });

    // Format stats for proxy server payload
    const subjectsArray = Object.keys(attempt.subjectStats || {}).map((key) => {
      const stats = (attempt.subjectStats as any)[key];
      return {
        subjectName: stats.subjectName,
        totalCount: stats.totalCount,
        correctCount: stats.correctCount,
        incorrectCount: stats.incorrectCount,
        score: stats.score,
        timeSpentMinutes: Math.round(stats.timeSpentSeconds / 60)
      };
    });

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examType: attempt.settings.examType,
          totalQuestions: attempt.questions.length,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          durationSeconds: attempt.durationSeconds,
          timeSpentSeconds: attempt.timeSpentSeconds,
          subjectsInfo: subjectsArray
        }),
      });

      if (!response.ok) {
        throw new Error("Local feedback API response error");
      }

      const data = await response.json();
      const updatedFeedback = {
        ...coachFeedback,
        [attemptId]: data,
      };

      localStorage.setItem("jee_coach_feedbacks", JSON.stringify(updatedFeedback));
      set({ coachFeedback: updatedFeedback, feedbackLoading: false });
    } catch (err) {
      console.error("Failed to retrieve coach feedback:", err);
      set({ feedbackLoading: false });
    }
  },

  retakeTest: (settingsInput) => {
    get().startTest(settingsInput);
  },
}));
