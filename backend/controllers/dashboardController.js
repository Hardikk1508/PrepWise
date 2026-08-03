const Interview = require("../models/Interview");
const ResumeAnalysis = require("../models/ResumeAnalysis");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const interviews = await Interview.find({
      user: userId,
      status: "completed",
    }).sort({ completedAt: -1 });

    const resume = await ResumeAnalysis.findOne({ userId }).sort({
      createdAt: -1,
    });

    const total = interviews.length;

    const avgScore =
      total > 0
        ? parseFloat(
            (
              interviews.reduce((s, i) => s + i.overallScore, 0) / total
            ).toFixed(1)
          )
        : 0;

    const bestScore =
      total > 0 ? Math.max(...interviews.map((i) => i.overallScore)) : 0;

    const latestScore = total > 0 ? interviews[0].overallScore : 0;

    const resumeScore = resume?.atsScore || 0;

    const readiness =
      total > 0
        ? Math.round((avgScore * 10 + resumeScore) / 2)
        : resumeScore;

    const skillAvg = (field) =>
      total > 0
        ? parseFloat(
            (
              interviews.reduce((s, i) => s + (i[field] || 0), 0) / total
            ).toFixed(1)
          )
        : 0;

    const skills = {
      communication: skillAvg("communication"),
      technicalDepth: skillAvg("technicalDepth"),
      problemSolving: skillAvg("problemSolving"),
      confidence: skillAvg("confidence"),
    };

    const trend = interviews
      .slice(0, 7)
      .reverse()
      .map((i) => ({
        date: i.completedAt,
        score: i.overallScore,
      }));

    const missingSkills = resume?.missingKeywords?.slice(0, 3) || [];

    const weakSkills = Object.entries(skills)
      .filter(([, v]) => v < 6)
      .map(([k]) => k);

    const { generateDashboardSuggestions } = require("../services/aiService");
    const suggestions = await generateDashboardSuggestions(
      weakSkills,
      missingSkills,
      skills
    );

    const recentSessions = interviews.slice(0, 3).map((i) => ({
      _id: i._id,
      role: i.role,
      type: i.type,
      overallScore: i.overallScore,
      completedAt: i.completedAt,
    }));

    res.status(200).json({
      success: true,
      stats: {
        total,
        avgScore,
        bestScore,
        latestScore,
        resumeScore,
        readiness,
      },
      skills,
      trend,
      suggestions,
      recentSessions,
    });
  } catch (error) {
    console.error("getDashboard error:", error.message);
    res.status(500).json({ message: error.message });
  }
};