const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { downloadReport } = require("../controllers/reportController");

router.get("/:id", authMiddleware, downloadReport);
module.exports = router;    