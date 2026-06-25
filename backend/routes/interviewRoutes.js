const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  startInterview, evaluateAnswer, saveInterview,
  getHistory, getDashboard, getInterviewById,
} = require("../controllers/interviewController");

router.post("/start", authMiddleware, startInterview);
router.post("/evaluate", authMiddleware, evaluateAnswer);
router.post("/save", authMiddleware, saveInterview);
router.get("/dashboard", authMiddleware, getDashboard);
router.get("/history", authMiddleware, getHistory);
router.get("/:id", authMiddleware, getInterviewById);

module.exports = router;