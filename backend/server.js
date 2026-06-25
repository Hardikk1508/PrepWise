const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

connectDB();

// ✅ Middleware FIRST — before any routes
app.use(cors());
app.use(express.json());

// ✅ Routes AFTER middleware
app.use("/api/interview", require("./routes/interviewRoutes"));
app.use("/api/report", require("./routes/reportRoutes"));
app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);
app.use(
  "/api/interview",
  interviewRoutes
);

app.get("/", (req, res) => {
  res.json({ message: "PrepWise Backend Running 🚀" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});