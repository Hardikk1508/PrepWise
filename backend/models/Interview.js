const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  // NEW: question type — defaults to "subjective" so existing saved
  // interviews (which never had this field) behave exactly as before.
  type: { type: String, enum: ["mcq", "subjective"], default: "subjective" },
  // NEW: only populated for MCQ questions. Empty array for subjective —
  // matches old documents that never had this field.
  options: { type: [String], default: [] },
  // NEW: server-side only. Used to auto-grade MCQ answers. Never sent
  // to the frontend in the /start response (stripped before responding).
  correctAnswer: { type: String, default: "" },
  answer: { type: String, default: "" },
  score: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  technicalDepth: { type: Number, default: 0 },
  problemSolving: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  feedback: { type: String, default: "" },
  isEmpty: { type: Boolean, default: false },
});

const InterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, required: true },
  level: { type: String, required: true },
  type: { type: String, required: true },
  duration: { type: String, default: "10 min" },
  questions: [questionSchema],
  overallScore: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  technicalDepth: { type: Number, default: 0 },
  problemSolving: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  improvementPlan: [{ type: String }],
  nextSteps: [{ type: String }],
  status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Interview", InterviewSchema);