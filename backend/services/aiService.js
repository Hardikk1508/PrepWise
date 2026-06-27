const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
  timeout: 60_000, // 60 second timeout for all requests
});

// ── Config for retry strategy ──
const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const BASE_BACKOFF_MS = 1000; // 1s, then 2s, then 4s

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Decides whether an error is worth retrying (rate limits, transient server errors)
function isRetryableError(err) {
  const status = err?.status || err?.response?.status;
  if (status && RETRYABLE_STATUS_CODES.has(status)) return true;
  // Network-level issues (timeouts, connection resets) are also safe to retry
  if (err?.code === "ECONNRESET" || err?.code === "ETIMEDOUT" || err?.type === "system") return true;
  return false;
}

/**
 * Core call to Grok with retry + exponential backoff.
 * Validates the response shape before returning, so callers never have to
 * defensively check response.choices[0] themselves.
 */
async function generateWithFallback(prompt) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: "grok-3-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      // ── Validate response shape before touching choices[0] ──
      const choice = response?.choices?.[0];
      const content = choice?.message?.content;

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        throw new Error("Grok returned an empty or invalid response body");
      }

      return content;
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.response?.status;
      console.error(
        `Grok API Error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
        err.response?.data || err.message || err
      );

      const isLastAttempt = attempt === MAX_RETRIES;
      if (isLastAttempt || !isRetryableError(err)) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
      console.warn(`Retrying Grok request in ${backoff}ms (status: ${status || "n/a"})...`);
      await sleep(backoff);
    }
  }

  // All retries exhausted — surface a clear, actionable error to the caller
  throw new Error(
    `Grok API request failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message || "Unknown error"}`
  );
}

/**
 * Strips markdown code fences and trims stray text around JSON output.
 * Models sometimes wrap JSON in ```json ... ``` or add leading/trailing
 * commentary — this normalizes that before parsing.
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json|```/g, "").trim();

  // Fallback: if there's still leading/trailing junk, try to isolate the
  // first valid-looking JSON array or object in the string.
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);

  if (cleaned.startsWith("[") || cleaned.startsWith("{")) {
    return cleaned;
  }
  if (arrayMatch) return arrayMatch[0];
  if (objectMatch) return objectMatch[0];

  return cleaned;
}

/**
 * Safe JSON.parse wrapper. Logs the raw offending text (truncated) and
 * throws a descriptive error tagged with the calling context so failures
 * are traceable without crashing the process.
 */
function safeParseJSON(text, context) {
  const cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const preview = cleaned.length > 500 ? `${cleaned.slice(0, 500)}...[truncated]` : cleaned;
    console.error(`Invalid JSON from Grok (${context}):`, preview);
    throw new Error(`Failed to parse Grok response (${context}): ${err.message}`);
  }
}

// ── Generate interview questions ──
// NOTE ON RETURN SHAPE CHANGE:
// This function used to return string[]. It now returns an array of
// objects: { question, type, options, correctAnswer }.
// - type is "subjective" for Behavioral/HR and for Technical interviews
//   that aren't using the new MCQ flow.
// - For Technical interviews, MCQ items have type "mcq", options (4
//   strings), and correctAnswer (must exactly match one of options).
// - Subjective items always have options: [] and correctAnswer: "".
// This keeps a single consistent shape so the controller and frontend
// don't need to special-case based on presence/absence of fields.
async function generateQuestions(role, level, type, duration) {
  let questionCount = 5;

  if (parseInt(duration) === 10) questionCount = 10;
  else if (parseInt(duration) === 15) questionCount = 15;
  else if (parseInt(duration) === 20) questionCount = 20;

  const durationMins = parseInt(duration);

  // ── MCQ mode only applies to Technical interviews ──
  const isTechnical = type === "Technical";
  const useMcqFlow = isTechnical && !Number.isNaN(durationMins);

  if (useMcqFlow) {
    return generateTechnicalQuestions(role, level, durationMins, questionCount);
  }

  // ── Existing Behavioral / HR / non-technical flow (unchanged) ──
  let extraRules = "";

  if (durationMins <= 10) {
    extraRules = `
    - Generate ONLY objective/short-answer questions.
    - Questions should be answerable in 1-2 lines.
    `;
  } else {
    extraRules = `
    - Generate exactly 2 subjective/descriptive questions.
    - Remaining questions should be objective.
    - Subjective questions should be scenario-based or problem-solving based.
    `;
  }

  const prompt = `
You are a senior interviewer at a top tech company.

Generate exactly ${questionCount} UNIQUE interview questions.

Role: ${role}
Experience Level: ${level}
Interview Type: ${type}
Interview Duration: ${duration} minutes

Rules:

- Questions must be specific to ${role}.
- Difficulty must match ${level}.
- Every question must test a different concept.
- Questions should progressively become harder.
- Avoid generic interview questions.
- Do NOT repeat common questions like:
  "Tell me about yourself",
  "What are your strengths and weaknesses",
  "What is React?",
  "What is JavaScript?"
- Generate fresh and unique questions every time.
- Cover different topics.
- No duplicate questions.
${extraRules}

Difficulty Rules:

- Fresher → Easy to Medium
- 1-3 Years → Medium
- 3-5 Years → Medium to Hard
- 5+ Years → Hard

For Technical interviews:
- Ask coding, debugging, implementation, optimization and scenario-based questions.
- Include at least one real-world problem-solving question.
- Avoid purely theoretical questions.


For Behavioral interviews:
- Use STAR-based scenarios.

For HR interviews:
- Ask culture-fit, goals and workplace scenarios.

Return ONLY a JSON array.

Example:

[
 "Question 1",
 "Question 2"
]
`;

  const text = await generateWithFallback(prompt);
  const rawQuestions = safeParseJSON(text, "generateQuestions");

  // Normalize plain strings into the consistent { question, type, options, correctAnswer } shape
  return rawQuestions.map((q) => ({
    question: q,
    type: "subjective",
    options: [],
    correctAnswer: "",
  }));
}

// ── Generate Technical-round questions, mixing MCQ + subjective per the new rules ──
// 5/10 min  → ALL MCQ
// 15/20 min → MCQ for all but the last 2 questions, which are always subjective
async function generateTechnicalQuestions(role, level, durationMins, questionCount) {
  const subjectiveCount = durationMins >= 15 ? 2 : 0;
  const mcqCount = questionCount - subjectiveCount;

  const difficultyRules = `
Difficulty Rules:
- Fresher → Easy to Medium
- 1-3 Years → Medium
- 3-5 Years → Medium to Hard
- 5+ Years → Hard
`;

  const mcqPrompt = `
You are a senior interviewer at a top tech company creating a multiple-choice
technical assessment.

Generate exactly ${mcqCount} UNIQUE multiple-choice questions.

Role: ${role}
Experience Level: ${level}
Interview Type: Technical

Rules:
- Each question must have EXACTLY 4 options.
- Exactly ONE option must be correct.
- The correctAnswer field must match one of the 4 options EXACTLY (same text).
- Questions must be specific to ${role} and test real technical knowledge
  (concepts, syntax, debugging, output-prediction, best practices).
- Difficulty must match ${level}.
- Every question must test a different concept — no duplicates.
- Avoid generic questions like "What is React?" or "What is JavaScript?".
- Questions should progressively become harder.
${difficultyRules}

Return ONLY a JSON array in this exact shape, no markdown, no extra text:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]
`;

  const mcqText = await generateWithFallback(mcqPrompt);
  const mcqRaw = safeParseJSON(mcqText, "generateTechnicalQuestions:mcq");

  const mcqQuestions = mcqRaw.map((q) => ({
    question: q.question,
    type: "mcq",
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));

  if (subjectiveCount === 0) {
    return mcqQuestions;
  }

  // ── Last 2 questions: subjective/descriptive, scenario-based ──
  const subjectivePrompt = `
You are a senior interviewer at a top tech company.

Generate exactly ${subjectiveCount} UNIQUE subjective/descriptive interview questions.

Role: ${role}
Experience Level: ${level}
Interview Type: Technical

Rules:
- Questions must be specific to ${role}.
- Difficulty must match ${level}.
- Questions should be scenario-based or problem-solving based, requiring a
  written explanation (not answerable in one line).
- Avoid generic questions.
- No duplicate questions.
${difficultyRules}

Return ONLY a JSON array of question strings, no markdown:
["Question 1", "Question 2"]
`;

  const subjText = await generateWithFallback(subjectivePrompt);
  const subjRaw = safeParseJSON(subjText, "generateTechnicalQuestions:subjective");

  const subjectiveQuestions = subjRaw.map((q) => ({
    question: q,
    type: "subjective",
    options: [],
    correctAnswer: "",
  }));

  return [...mcqQuestions, ...subjectiveQuestions];
}

// ── Evaluate a single answer ──
// UNCHANGED behavior for subjective questions. MCQ grading is handled
// separately in the controller (evaluateMcqAnswer below) since it doesn't
// need an AI call at all — this function is only ever invoked now for
// subjective questions.
async function evaluateAnswer(question, answer, role, type) {
  if (!answer || answer.trim().length < 5) {
    return {
      score: 0,
      communication: 0,
      technicalDepth: 0,
      problemSolving: 0,
      confidence: 0,
      feedback: "No answer was provided. This question was marked as skipped.",
      isEmpty: true,
    };
  }

  const prompt = `You are an expert interviewer evaluating a candidate's response.

Role: ${role}
Interview Type: ${type}
Question: ${question}
Candidate Answer: ${answer}

Evaluate the answer on these 5 criteria (score each from 0 to 10):
1. score: Overall quality of the answer
2. communication: Clarity, structure, articulation
3. technicalDepth: Technical accuracy and depth (0 if behavioral/HR)
4. problemSolving: Approach to the problem
5. confidence: Tone, certainty, ownership of answer

Also provide:
- feedback: 2-3 sentences of specific, constructive feedback
- Be strict. A mediocre answer should score 5-6. Only excellent answers get 9-10.

Return ONLY valid JSON, no markdown, no extra text:
{
  "score": 7,
  "communication": 8,
  "technicalDepth": 6,
  "problemSolving": 7,
  "confidence": 7,
  "feedback": "Your explanation was clear but you missed..."
}`;

  const text = await generateWithFallback(prompt);
  const parsed = safeParseJSON(text, "evaluateAnswer");
  return { ...parsed, isEmpty: false };
}

// ── NEW: Auto-grade an MCQ answer (no AI call — instant, deterministic) ──
function evaluateMcqAnswer(selectedOption, correctAnswer) {
  const isEmpty = !selectedOption || selectedOption.trim().length === 0;
  if (isEmpty) {
    return {
      score: 0,
      communication: 0,
      technicalDepth: 0,
      problemSolving: 0,
      confidence: 0,
      feedback: "No option was selected. This question was marked as skipped.",
      isEmpty: true,
    };
  }

  const isCorrect = selectedOption.trim() === (correctAnswer || "").trim();

  return {
    score: isCorrect ? 10 : 0,
    communication: 0,
    technicalDepth: isCorrect ? 10 : 0,
    problemSolving: 0,
    confidence: 0,
    feedback: isCorrect
      ? "Correct answer."
      : `Incorrect. The correct answer was: "${correctAnswer}".`,
    isEmpty: false,
  };
}

// ── Generate overall session summary ──
async function generateSessionSummary(role, type, level, questionsWithAnswers, scores) {
  const qa = questionsWithAnswers.map((q, i) =>
    `Q${i + 1}: ${q.question}\nAnswer: ${q.answer || "No answer"}\nScore: ${q.score}/10`
  ).join("\n\n");

  const prompt = `You are a career coach writing an interview performance summary.

Candidate applied for: ${role} (${level}) — ${type} interview
Overall score: ${scores.overall}/10

Questions and Answers:
${qa}

Generate a professional summary with:
1. strengths: array of 3-4 specific strengths observed
2. weaknesses: array of 3-4 specific areas to improve  
3. improvementPlan: array of 4-5 actionable steps
4. nextSteps: array of 3-4 recommended next actions

Return ONLY valid JSON, no markdown:
{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "improvementPlan": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

  const text = await generateWithFallback(prompt);
  return safeParseJSON(text, "generateSessionSummary");
}

// ── Generate dynamic dashboard suggestions ──
async function generateDashboardSuggestions(weakSkills, missingResumeSkills, avgScores) {
  const suggestions = [];

  if (avgScores.communication < 6)
    suggestions.push({ label: "Behavioral", text: "Practice behavioral questions using the STAR method to improve communication scores." });
  if (avgScores.technicalDepth < 6)
    suggestions.push({ label: "Technical", text: `Focus on core ${weakSkills[0] || "technical"} concepts and practice coding problems daily.` });
  if (avgScores.confidence < 6)
    suggestions.push({ label: "Confidence", text: "Record yourself answering questions to build confidence and reduce filler words." });
  if (missingResumeSkills.length > 0)
    suggestions.push({ label: "Resume", text: `Add ${missingResumeSkills.slice(0, 3).join(", ")} to your resume to improve ATS scores.` });
  if (suggestions.length < 4)
    suggestions.push({ label: "Goal", text: "Complete 3 mock sessions this week to maintain your preparation streak." });

  return suggestions.slice(0, 4);
}

module.exports = {
  generateQuestions,
  evaluateAnswer,
  evaluateMcqAnswer,
  generateSessionSummary,
  generateDashboardSuggestions,
};