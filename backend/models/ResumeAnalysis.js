const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fileName: String,
    atsScore: Number,
    skillsFound: [String],
    missingKeywords: [String],
    sections: Object,
    suggestions: [String],
    resumeText: String,
    wordCount: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ResumeAnalysis",
  resumeAnalysisSchema
);