const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(err) {
  const status = err?.status || err?.response?.status;
  return [429, 500, 502, 503, 504].includes(status);
}

async function generateWithFallback(prompt) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: MODEL,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const content = completion?.choices?.[0]?.message?.content;

      if (!content || content.trim().length === 0) {
        throw new Error("Groq returned empty response");
      }

      return content;
    } catch (err) {
      lastError = err;
      console.error(
        `Groq API Error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`,
        err.message || err
      );

      const isLast = attempt === MAX_RETRIES;
      if (isLast || !isRetryable(err)) break;

      const backoff = BASE_BACKOFF_MS * Math.pow(2, attempt);
      console.warn(`Retrying in ${backoff}ms...`);
      await sleep(backoff);
    }
  }

  throw new Error(
    `Groq API failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message || "Unknown error"}`
  );
}

function cleanJsonResponse(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json|```/g, "").trim();
  if (cleaned.startsWith("[") || cleaned.startsWith("{")) return cleaned;
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (arrayMatch) return arrayMatch[0];
  if (objectMatch) return objectMatch[0];
  return cleaned;
}

function safeParseJSON(text, context) {
  const cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const preview = cleaned.length > 500 ? `${cleaned.slice(0, 500)}...[truncated]` : cleaned;
    console.error(`Invalid JSON from Groq (${context}):`, preview);
    throw new Error(`Failed to parse AI response (${context}): ${err.message}`);
  }
}

async function generateQuestions(role, level, type, duration) {
  let questionCount = 5;
  if (parseInt(duration) === 10) questionCount = 10;
  else if (parseInt(duration) === 15) questionCount = 15;
  else if (parseInt(duration) === 20) questionCount = 20;

  const durationMins = parseInt(duration);
  const isTechnical = type === "Technical";
  const useMcqFlow = isTechnical && !Number.isNaN(durationMins);

  if (useMcqFlow) {
    return generateTechnicalQuestions(role, level, durationMins, questionCount);
  }

  let extraRules = "";
  if (durationMins <= 10) {
    extraRules = `- Generate ONLY objective/short-answer questions answerable in 1-2 lines.`;
  } else {
    extraRules = `- Generate exactly 2 subjective/descriptive scenario-based questions. Remaining should be objective.`;
  }

  const prompt = `You are a senior interviewer at a top tech company.

Generate exactly ${questionCount} UNIQUE interview questions.
Role: ${role}
Experience Level: ${level}
Interview Type: ${type}
Duration: ${duration} minutes

Rules:
- Questions must be specific to ${role} and match difficulty for ${level}
- Every question tests a different concept
- Questions progressively get harder
- No generic questions like "Tell me about yourself"
- Fresh and unique every time
${extraRules}

For Technical: Ask coding, debugging, implementation, optimization questions.
For Behavioral: Use STAR-based scenarios.
For HR: Ask culture-fit, goals, workplace scenarios.

Return ONLY a valid JSON array of strings, no markdown, no extra text:
["Question 1", "Question 2"]`;

  const text = await generateWithFallback(prompt);
  const rawQuestions = safeParseJSON(text, "generateQuestions");

  return rawQuestions.map((q) => ({
    question: q,
    type: "subjective",
    options: [],
    correctAnswer: "",
  }));
}

async function generateTechnicalQuestions(role, level, durationMins, questionCount) {
  const subjectiveCount = durationMins >= 15 ? 2 : 0;
  const mcqCount = questionCount - subjectiveCount;

  const mcqPrompt = `You are a senior interviewer creating a technical MCQ assessment.

Generate exactly ${mcqCount} UNIQUE multiple-choice questions.
Role: ${role}
Experience Level: ${level}

Rules:
- Each question has EXACTLY 4 options
- Exactly ONE option is correct
- correctAnswer must match one of the 4 options EXACTLY
- Test real technical knowledge: concepts, syntax, debugging, output-prediction
- Progressive difficulty matching ${level}
- No duplicate questions

Return ONLY a valid JSON array, no markdown:
[{"question":"text","options":["A","B","C","D"],"correctAnswer":"A"}]`;

  const mcqText = await generateWithFallback(mcqPrompt);
  const mcqRaw = safeParseJSON(mcqText, "generateTechnicalQuestions:mcq");

  const mcqQuestions = mcqRaw.map((q) => ({
    question: q.question,
    type: "mcq",
    options: q.options,
    correctAnswer: q.correctAnswer,
  }));

  if (subjectiveCount === 0) return mcqQuestions;

  const subjectivePrompt = `You are a senior interviewer.

Generate exactly ${subjectiveCount} UNIQUE subjective interview questions.
Role: ${role}
Experience Level: ${level}
Type: Technical

Rules:
- Scenario-based, requiring written explanation
- Specific to ${role}
- Difficulty matches ${level}

Return ONLY a valid JSON array of strings, no markdown:
["Question 1", "Question 2"]`;

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

Score each criterion 0-10:
1. score: Overall quality
2. communication: Clarity, structure, articulation
3. technicalDepth: Technical accuracy (0 if behavioral/HR)
4. problemSolving: Approach to the problem
5. confidence: Tone, certainty, ownership

feedback: 2-3 sentences of specific constructive feedback.
Be strict. Mediocre = 5-6. Excellent = 9-10.

Return ONLY valid JSON, no markdown:
{"score":7,"communication":8,"technicalDepth":6,"problemSolving":7,"confidence":7,"feedback":"..."}`;

  const text = await generateWithFallback(prompt);
  const parsed = safeParseJSON(text, "evaluateAnswer");
  return { ...parsed, isEmpty: false };
}

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

async function generateSessionSummary(role, type, level, questionsWithAnswers, scores) {
  const qa = questionsWithAnswers
    .map((q, i) => `Q${i + 1}: ${q.question}\nAnswer: ${q.answer || "No answer"}\nScore: ${q.score}/10`)
    .join("\n\n");

  const prompt = `You are a career coach writing an interview performance summary.

Role: ${role} (${level}) — ${type} interview
Overall score: ${scores.overall}/10

Questions and Answers:
${qa}

Generate:
1. strengths: array of 3-4 specific strengths observed
2. weaknesses: array of 3-4 specific areas to improve
3. improvementPlan: array of 4-5 actionable steps
4. nextSteps: array of 3-4 recommended next actions

Return ONLY valid JSON, no markdown:
{"strengths":["..."],"weaknesses":["..."],"improvementPlan":["..."],"nextSteps":["..."]}`;

  const text = await generateWithFallback(prompt);
  return safeParseJSON(text, "generateSessionSummary");
}

async function generateDashboardSuggestions(weakSkills, missingResumeSkills, avgScores) {
  const suggestions = [];

  if (avgScores.communication < 6)
    suggestions.push({
      label: "Behavioral",
      text: "Practice behavioral questions using the STAR method to improve communication scores.",
    });
  if (avgScores.technicalDepth < 6)
    suggestions.push({
      label: "Technical",
      text: `Focus on core ${weakSkills[0] || "technical"} concepts and practice coding problems daily.`,
    });
  if (avgScores.confidence < 6)
    suggestions.push({
      label: "Confidence",
      text: "Record yourself answering questions to build confidence and reduce filler words.",
    });
  if (missingResumeSkills.length > 0)
    suggestions.push({
      label: "Resume",
      text: `Add ${missingResumeSkills.slice(0, 3).join(", ")} to your resume to improve ATS scores.`,
    });
  if (suggestions.length < 4)
    suggestions.push({
      label: "Goal",
      text: "Complete 3 mock sessions this week to maintain your preparation streak.",
    });

  return suggestions.slice(0, 4);
}

module.exports = {
  generateQuestions,
  evaluateAnswer,
  evaluateMcqAnswer,
  generateSessionSummary,
  generateDashboardSuggestions,
};