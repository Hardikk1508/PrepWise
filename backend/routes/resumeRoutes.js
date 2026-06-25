const express = require("express");
const multer = require("multer");
const { analyzeResume } = require("../controllers/resumeController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/analyze", upload.single("resume"), analyzeResume);

module.exports = router;