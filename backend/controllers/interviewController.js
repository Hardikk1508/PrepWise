const Interview = require("../models/Interview");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const { generateQuestions, evaluateAnswer, evaluateMcqAnswer, generateSessionSummary } = require("../services/aiService");

// POST /api/interview/start
exports.startInterview = async (req, res) => {
  try {
    const { role, level, type, duration } = req.body;
    if (!role || !level || !type) {
      return res.status(400).json({ message: "role, level, and type are required" });
    }

    // generateQuestions now returns [{ question, type, options, correctAnswer }]
    // instead of plain strings (see aiService.js). This works for both the
    // new MCQ-capable Technical flow and the existing Behavioral/HR flow,
    // which now just comes back with type: "subjective" on every item.
    const rawQuestions = await generateQuestions(
  role,
  level,
  type,
  duration
);

    const questions = rawQuestions.map((q) => ({
      question: q.question,
      type: q.type || "subjective",
      options: q.options || [],
      correctAnswer: q.correctAnswer || "",
      answer: "",
      score: 0,
    }));

    const interview = await Interview.create({
      user: req.user.id,
      role, level, type, duration,
      questions,
      status: "in_progress",
    });

    // IMPORTANT: strip correctAnswer before sending to the client so the
    // answer key is never exposed in the network response. Everything
    // else the frontend needs (question text, type, options) is included.
    res.status(201).json({
      success: true,
      interviewId: interview._id,
      questions: questions.map((q) => ({
        question: q.question,
        type: q.type,
        options: q.options,
      })),
    });
  } catch (err) {
    console.error("startInterview error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/interview/evaluate
exports.evaluateAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, user: req.user.id });
    if (!interview) return res.status(404).json({ message: "Interview not found" });
    if (questionIndex < 0 || questionIndex >= interview.questions.length) {
      return res.status(400).json({ message: "Invalid question index" });
    }

    const q = interview.questions[questionIndex];

    // ── Branch on question type ──
    // MCQ: instant, deterministic grading against the stored correctAnswer.
    // Subjective: unchanged — goes through the existing Gemini evaluation.
    const evaluation = q.type === "mcq"
      ? evaluateMcqAnswer(answer, q.correctAnswer)
      : await evaluateAnswer(q.question, answer, interview.role, interview.type);

    interview.questions[questionIndex].answer = answer || "";
    interview.questions[questionIndex].score = evaluation.score;
    interview.questions[questionIndex].communication = evaluation.communication;
    interview.questions[questionIndex].technicalDepth = evaluation.technicalDepth;
    interview.questions[questionIndex].problemSolving = evaluation.problemSolving;
    interview.questions[questionIndex].confidence = evaluation.confidence;
    interview.questions[questionIndex].feedback = evaluation.feedback;
    interview.questions[questionIndex].isEmpty = evaluation.isEmpty;
    interview.markModified("questions");
    await interview.save();

    res.status(200).json({ success: true, evaluation });
  } catch (err) {
    console.error("evaluateAnswer error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/interview/save
// UNCHANGED — averages and summary generation work identically regardless
// of whether individual questions were MCQ or subjective, since both
// produce the same score/communication/technicalDepth/problemSolving/confidence
// fields on each question.
exports.saveInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, user: req.user.id });
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const qs = interview.questions;
    const count = qs.length || 1;

    const avg = (field) =>
      parseFloat((qs.reduce((sum, q) => sum + (q[field] || 0), 0) / count).toFixed(1));

    interview.overallScore = avg("score");
    interview.communication = avg("communication");
    interview.technicalDepth = avg("technicalDepth");
    interview.problemSolving = avg("problemSolving");
    interview.confidence = avg("confidence");

    const summary = await generateSessionSummary(
      interview.role, interview.type, interview.level,
      qs.map((q) => ({ question: q.question, answer: q.answer, score: q.score })),
      { overall: interview.overallScore }
    );

    console.log(JSON.stringify(summary, null, 2));

    interview.strengths = summary.strengths;
    interview.weaknesses = summary.weaknesses;
    interview.improvementPlan = summary.improvementPlan;
    interview.nextSteps = summary.nextSteps;
    interview.status = "completed";
    interview.completedAt = new Date();
    await interview.save();

    res.status(200).json({ success: true, interviewId: interview._id, overallScore: interview.overallScore });
  } catch (err) {
    console.error("saveInterview error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview/history — UNCHANGED
exports.getHistory = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id, status: "completed" })
      .sort({ completedAt: -1 })
      .select("role level type overallScore communication technicalDepth problemSolving confidence completedAt createdAt duration");
    res.status(200).json({ success: true, interviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview/dashboard — UNCHANGED
exports.getDashboard = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user.id, status: "completed" }).sort({ completedAt: -1 });
    const resume = await ResumeAnalysis.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    const total = interviews.length;
    const avgScore = total > 0
      ? parseFloat((interviews.reduce((s, i) => s + i.overallScore, 0) / total).toFixed(1))
      : 0;
    const bestScore = total > 0 ? Math.max(...interviews.map((i) => i.overallScore)) : 0;
    const latestScore = total > 0 ? interviews[0].overallScore : 0;
    const resumeScore = resume?.atsScore || 0;
    const readiness = total > 0
      ? Math.round((avgScore * 10 + resumeScore) / 2)
      : resumeScore;

    const skillAvg = (field) =>
      total > 0
        ? parseFloat((interviews.reduce((s, i) => s + (i[field] || 0), 0) / total).toFixed(1))
        : 0;

    const skills = {
      communication: skillAvg("communication"),
      technicalDepth: skillAvg("technicalDepth"),
      problemSolving: skillAvg("problemSolving"),
      confidence: skillAvg("confidence"),
    };

    const trend = interviews.slice(0, 7).reverse().map((i) => ({
      date: i.completedAt,
      score: i.overallScore,
    }));

    const missingSkills = resume?.missingKeywords?.slice(0, 3) || [];
    const weakSkills = Object.entries(skills)
      .filter(([, v]) => v < 6)
      .map(([k]) => k);

    const { generateDashboardSuggestions } = require("../services/aiService");
    const suggestions = await generateDashboardSuggestions(weakSkills, missingSkills, skills);

    res.status(200).json({
      success: true,
      stats: { total, avgScore, bestScore, latestScore, resumeScore, readiness },
      skills,
      trend,
      suggestions,
      recentSessions: interviews.slice(0, 3).map((i) => ({
        _id: i._id,
        role: i.role,
        type: i.type,
        overallScore: i.overallScore,
        completedAt: i.completedAt,
      })),
    });
  } catch (err) {
    console.error("getDashboard error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/interview/:id — UNCHANGED
exports.getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user.id });
    if (!interview) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ success: true, interview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};