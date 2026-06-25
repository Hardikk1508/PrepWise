const fs = require("fs");
const pdfParse = require("pdf-parse");

const ResumeAnalysis = require("../models/ResumeAnalysis");
const { analyzeResumeText } = require("../helpers/resumeAnalyzer");

exports.analyzeResume = async (req, res) => {
  try {
    console.log("🔥 ANALYZE API HIT");
    console.log("📄 FILE:", req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No resume uploaded",
      });
    }

    const pdfBuffer = fs.readFileSync(req.file.path);

    // Parse PDF
    const pdfData = await pdfParse(pdfBuffer);

    const resumeText = pdfData.text;

    console.log("RESUME TEXT LENGTH =", resumeText.length);

    console.log("RESUME TEXT PREVIEW:");
    console.log(resumeText.substring(0, 1000));

    const analysis = analyzeResumeText(resumeText);

    const savedAnalysis = await ResumeAnalysis.create({
      fileName: req.file.originalname,
      resumeText,
      atsScore: analysis.atsScore,
      skillsFound: analysis.skillsFound,
      missingKeywords: analysis.missingKeywords,
      sections: analysis.sections,
      suggestions: analysis.suggestions,
      wordCount: analysis.wordCount,
    });

    // Delete uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log("ANALYSIS RESULT =", analysis);
    console.log("SAVED ANALYSIS =", savedAnalysis);

    return res.status(200).json({
      success: true,
      analysis: savedAnalysis,
    });

  } catch (error) {
    console.error("❌ Resume Analysis Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};