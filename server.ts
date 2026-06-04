import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI client carefully
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI client successfully initialized server-side.");
  } catch (error) {
    console.error("Failed to initialize Gemini AI client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY detected. AI recommendations will fall back to static/heuristic analysis.");
}

// AI recommendations route
app.post("/api/recommendations", async (req, res) => {
  const { examType, totalQuestions, score, totalMarks, durationSeconds, timeSpentSeconds, subjectsInfo } = req.body;

  const summaryDataStr = `
Exam Type: ${examType}
Total Questions: ${totalQuestions}
Score Obtained: ${score} / ${totalMarks}
Total Time Allowed: ${Math.round(durationSeconds / 60)} minutes
Time Spent: ${Math.round(timeSpentSeconds / 60)} minutes
Subject-wise Performance:
${JSON.stringify(subjectsInfo, null, 2)}
`;

  // Fallback heuristic recommendations if Gemini client is not available or if API call fails
  const getHeuristicRecommendations = () => {
    const feedback: any = {
      title: "JEE Performance Coach Advice",
      summary: `You scored ${score} out of ${totalMarks} (${totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0}%) in this simulated ${examType} exam. While this is a good attempt, let's look at targeted focus areas to optimize your scores!`,
      strongTopics: [],
      weakTopics: [],
      studyActionPlan: [
        "Create a concept index card for immediate recall of standard formulas.",
        "Solve at least 5 PYQs daily under a strict timed scenario.",
        "Take a short mock test specifically on weaker subjects each alternate day.",
        "Revise incorrect questions from this test within the next 24 hours."
      ],
      estimatedPrepTimeWeeks: 4
    };

    // Parse subjectsInfo to find strengths and weaknesses
    if (subjectsInfo && Array.isArray(subjectsInfo)) {
      subjectsInfo.forEach((subj: any) => {
        const accuracy = subj.totalCount > 0 ? (subj.correctCount / subj.totalCount) * 100 : 0;
        if (accuracy >= 70) {
          feedback.strongTopics.push(`${subj.subjectName} (${Math.round(accuracy)}% accuracy) - Outstanding concept clarity and speed! Keep practicing PYQs to maintain edge.`);
        } else if (accuracy < 45) {
          feedback.weakTopics.push(`${subj.subjectName} (${Math.round(accuracy)}% accuracy) - Attention needed in core concepts, derivations, and practice worksheets.`);
        } else {
          feedback.weakTopics.push(`${subj.subjectName} (${Math.round(accuracy)}% accuracy) - Needs revision and transition from numerical drill-down to tricky Advanced-level problems.`);
        }
      });
    }

    if (feedback.strongTopics.length === 0) {
      feedback.strongTopics.push("General Fundamentals - You exhibited strong basics. Consistency will bring perfection.");
    }
    if (feedback.weakTopics.length === 0) {
      feedback.weakTopics.push("Speed and Tricky Edge-case options - Refine your ability to eliminate choices in Advanced Multi-correct questions.");
    }

    return feedback;
  };

  if (!ai) {
    return res.json(getHeuristicRecommendations());
  }

  try {
    const promptPr = `
You are a highly experienced JEE preparation coach and strategist who understands the strict demands of JEE Main & Advanced (Physics, Chemistry, Mathematics).
Analyze the following mock test results of a student and provide a customized prep roadmap. Output a valid, clean JSON object following this exact schema.

JSON Schema:
{
  "title": "A short encouraging coaching title",
  "summary": "High-level summary of the overall trial, addressing specific aspects of the scoring and time usage.",
  "strongTopics": [
    "Array of 2-3 detailed feedback strings on their clear strong areas and why they performed well there."
  ],
  "weakTopics": [
    "Array of 2-3 detailed feedback strings pointing out weak subjects/topics, sub-topics to focus on, and specific common mistakes encountered."
  ],
  "studyActionPlan": [
    "Array of 3-4 highly actionable study actions targeting improvement in these weak topics, including recommended study sources or revision strategies."
  ],
  "estimatedPrepTimeWeeks": 6
}

Student Performance Stats:
${summaryDataStr}

Respond with nothing but the raw JSON. Do not wrap in markdown filters like \`\`\`json.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptPr,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "summary", "strongTopics", "weakTopics", "studyActionPlan", "estimatedPrepTimeWeeks"],
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            strongTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            weakTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            studyActionPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            estimatedPrepTimeWeeks: { type: Type.INTEGER }
          }
        }
      }
    });

    const textOutput = response.text?.trim() || "";
    try {
      const parsedJson = JSON.parse(textOutput);
      return res.json(parsedJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini output as JSON:", textOutput, parseError);
      return res.json(getHeuristicRecommendations());
    }
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return res.json(getHeuristicRecommendations());
  }
});

// Vite middleware and serving setups
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving compiled static assets in production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`JEE Exam Simulator Server loaded on http://0.0.0.0:${PORT}`);
  });
}

startServer();
