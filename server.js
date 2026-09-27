const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

async function callGemini(prompt, jsonMode = false) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Add it to your .env file.");
  }

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1400
    }
  };

  if (jsonMode) {
    body.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || "Gemini API request failed.";
    throw new Error(message);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("The AI returned an empty response.");
  }

  return text;
}

app.post("/api/ask", async (req, res) => {
  try {
    const { topic, level, mode } = req.body;

    if (!topic || topic.trim().length < 2) {
      return res.status(400).json({ error: "Please enter a topic." });
    }

    const cleanTopic = topic.trim().slice(0, 300);
    const cleanLevel = (level || "Beginner").slice(0, 50);
    const cleanMode = mode || "explain";

    let instruction = "";

    if (cleanMode === "notes") {
      instruction = `
Create concise, exam-friendly notes on the topic.
Use this structure:
1. Definition
2. Key points
3. Simple example
4. Important terms/formulas (only if relevant)
5. 3 quick revision points
Keep the language simple and avoid unnecessary jargon.
`;
    } else if (cleanMode === "study-plan") {
      instruction = `
Create a practical 7-day study plan for this topic.
For each day include: learning goal, 2-3 tasks, and a 5-minute self-test.
Keep the workload realistic for a student.
`;
    } else {
      instruction = `
Explain the topic like a patient tutor.
Start with a one-line definition, then explain step-by-step,
give a simple real-world/example, mention one common mistake,
and finish with 3 quick-check questions.
`;
    }

    const prompt = `
You are StudyMate, an AI tutor for students.
Topic: ${cleanTopic}
Student level: ${cleanLevel}

${instruction}

Do not claim that the answer is a substitute for a teacher or textbook.
Be accurate, clear, encouraging, and student-friendly.
`;

    const answer = await callGemini(prompt);
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/quiz", async (req, res) => {
  try {
    const { topic, level, count } = req.body;

    if (!topic || topic.trim().length < 2) {
      return res.status(400).json({ error: "Please enter a topic." });
    }

    const n = Math.min(Math.max(Number(count) || 5, 3), 10);
    const cleanTopic = topic.trim().slice(0, 300);
    const cleanLevel = (level || "Beginner").slice(0, 50);

    const prompt = `
Create ${n} multiple-choice questions for a student studying "${cleanTopic}" at ${cleanLevel} level.

Return ONLY valid JSON in this exact shape:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Short explanation"
    }
  ]
}

Rules:
- answer is the zero-based index of the correct option.
- Exactly 4 options per question.
- Questions should test understanding, not just memorization.
- Keep explanations short and clear.
- No markdown, no code fences, no extra text.
`;

    const raw = await callGemini(prompt, true);
    let quiz;

    try {
      quiz = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      quiz = JSON.parse(cleaned);
    }

    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      throw new Error("Invalid quiz format returned by AI.");
    }

    res.json({ questions: quiz.questions.slice(0, n) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.listen(PORT, () => {
  console.log(`StudyMate running at http://localhost:${PORT}`);
});
