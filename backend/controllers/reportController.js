const PDFDocument = require("pdfkit");
const Interview = require("../models/Interview");

exports.downloadReport = async (req, res) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, user: req.user.id }).populate("user", "name email");
    if (!interview) return res.status(404).json({ message: "Interview not found" });

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=PrepWise_Report_${interview._id}.pdf`);
    doc.pipe(res);

    const colors = { dark: "#18181b", mid: "#52525b", light: "#a1a1aa", line: "#e4e4e7", green: "#16a34a", amber: "#ca8a04", red: "#dc2626" };

    const sc = (s) => s >= 8 ? colors.green : s >= 6 ? colors.amber : colors.red;
    const bar = (x, y, w, val, max = 10) => {
      doc.rect(x, y, w, 6).fillColor("#f4f4f5").fill();
      doc.rect(x, y, Math.round((val / max) * w), 6).fillColor(sc(val)).fill();
    };

    // ── HEADER ──
    doc.rect(0, 0, 595, 80).fillColor("#18181b").fill();
    doc.fontSize(22).font("Helvetica-Bold").fillColor("#fff").text("PrepWise", 50, 22);
    doc.fontSize(11).font("Helvetica").fillColor("#a1a1aa").text("Interview Performance Report", 50, 48);
    doc.fontSize(10).fillColor("#71717a").text(`Generated ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`, 350, 48, { align: "right", width: 195 });

    // ── CANDIDATE INFO ──
    doc.moveDown(2);
    doc.fontSize(10).fillColor(colors.light).font("Helvetica").text("CANDIDATE", 50, 100, { characterSpacing: 0.8 });
    doc.moveTo(50, 112).lineTo(545, 112).strokeColor(colors.line).lineWidth(0.5).stroke();
    doc.fontSize(14).font("Helvetica-Bold").fillColor(colors.dark).text(interview.user?.name || "Candidate", 50, 118);
    doc.fontSize(10).font("Helvetica").fillColor(colors.mid).text(interview.user?.email || "", 50, 135);

    const meta = [
      ["Role", interview.role],
      ["Experience", interview.level],
      ["Interview Type", interview.type],
      ["Duration", interview.duration],
      ["Date", new Date(interview.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
    ];
    let mx = 50;
    meta.forEach(([l, v]) => {
      doc.fontSize(9).fillColor(colors.light).font("Helvetica").text(l.toUpperCase(), mx, 160, { characterSpacing: 0.5 });
      doc.fontSize(11).fillColor(colors.dark).font("Helvetica-Bold").text(v, mx, 173);
      mx += 100;
    });

    // ── OVERALL SCORE ──
    doc.rect(50, 205, 495, 60).fillColor("#fafafa").strokeColor(colors.line).lineWidth(0.5).fillAndStroke();
    doc.fontSize(9).fillColor(colors.light).font("Helvetica").text("OVERALL SCORE", 70, 218, { characterSpacing: 0.8 });
    doc.fontSize(32).font("Helvetica-Bold").fillColor(sc(interview.overallScore)).text(`${interview.overallScore}/10`, 70, 228);
    const label = interview.overallScore >= 8 ? "Strong Performance" : interview.overallScore >= 6 ? "Good — Room to Improve" : "Needs Significant Work";
    doc.fontSize(10).font("Helvetica").fillColor(colors.mid).text(label, 180, 240);

    // ── SKILL SCORES ──
    doc.fontSize(9).fillColor(colors.light).font("Helvetica").text("SKILL BREAKDOWN", 50, 285, { characterSpacing: 0.8 });
    doc.moveTo(50, 297).lineTo(545, 297).strokeColor(colors.line).lineWidth(0.5).stroke();

    const skillFields = [
      ["Communication", interview.communication],
      ["Technical Depth", interview.technicalDepth],
      ["Problem Solving", interview.problemSolving],
      ["Confidence", interview.confidence],
    ];
    let sy = 305;
    skillFields.forEach(([label, val]) => {
      doc.fontSize(10).font("Helvetica").fillColor(colors.mid).text(label, 50, sy);
      bar(220, sy + 3, 260, val);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(sc(val)).text(`${val}/10`, 495, sy, { align: "right", width: 50 });
      sy += 22;
    });

    // ── STRENGTHS & WEAKNESSES ──
    sy += 10;
    doc.fontSize(9).fillColor(colors.light).font("Helvetica").text("STRENGTHS", 50, sy, { characterSpacing: 0.8 });
    doc.moveTo(50, sy + 12).lineTo(260, sy + 12).strokeColor(colors.line).lineWidth(0.5).stroke();
    sy += 18;
  
    (interview.strengths || []).forEach((s) => {
  const text = `• ${s}`;

  doc.text(text, 50, sy, {
    width: 200,
    lineGap: 2,
  });

  const h = doc.heightOfString(text, {
    width: 200,
    lineGap: 2,
  });

  sy += h + 8;
});

    let wy = sy - (interview.strengths?.length || 0) * 20 - 18;
    doc.fontSize(9).fillColor(colors.light).font("Helvetica").text("AREAS TO IMPROVE", 300, wy, { characterSpacing: 0.8 });
    doc.moveTo(300, wy + 12).lineTo(545, wy + 12).strokeColor(colors.line).lineWidth(0.5).stroke();
    wy += 18;

    (interview.weaknesses || []).forEach((w) => {
  const text = `• ${w}`;

  doc.text(text, 300, wy, {
    width: 200,
    lineGap: 2,
  });

  const h = doc.heightOfString(text, {
    width: 200,
    lineGap: 2,
  });

  wy += h + 8;
});

    sy = Math.max(sy, wy) + 10;

    // ── QUESTION BREAKDOWN ──
    doc.fontSize(9).fillColor(colors.light).font("Helvetica").text("QUESTION-BY-QUESTION FEEDBACK", 50, sy, { characterSpacing: 0.8 });
    doc.moveTo(50, sy + 12).lineTo(545, sy + 12).strokeColor(colors.line).lineWidth(0.5).stroke();
    sy += 20;

    interview.questions.forEach((q, i) => {
      if (sy > doc.page.height - 120) { doc.addPage(); sy = 50; }
      doc.rect(50, sy, 495, 1).fillColor(colors.line).fill();
      doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.dark).text(`Q${i + 1}: ${q.question}`, 50, sy + 6, { width: 400 });
      const qh = doc.heightOfString(q.question, { width: 400 });
      sy += qh + 12;
      doc.fontSize(9).font("Helvetica").fillColor(colors.mid).text("Answer: ", 50, sy, { continued: true }).fillColor(colors.dark).text(q.answer || "No answer provided", { width: 480 });
      const ah = doc.heightOfString(q.answer || "No answer provided", { width: 430 });
      sy += ah + 6;
      doc.fontSize(9).font("Helvetica").fillColor(colors.light).text(`Score: `, 50, sy, { continued: true }).fillColor(sc(q.score)).font("Helvetica-Bold").text(`${q.score}/10`);
      sy += 14;
      doc.fontSize(9).font("Helvetica").fillColor(colors.mid).text(`Feedback: ${q.feedback}`, 50, sy, { width: 480 });
      const fh = doc.heightOfString(q.feedback, { width: 430 });
      sy += fh + 18;
    });

    // ── IMPROVEMENT PLAN ──
    if (sy > 640) { doc.addPage(); sy = 50; }
    doc.fontSize(9).fillColor(colors.light).font("Helvetica").text("IMPROVEMENT PLAN", 50, sy, { characterSpacing: 0.8 });
    doc.moveTo(50, sy + 12).lineTo(545, sy + 12).strokeColor(colors.line).lineWidth(0.5).stroke();
    sy += 20;
   (interview.improvementPlan || []).forEach((step, i) => {

  if (sy > 700) {
    doc.addPage();
    sy = 50;
  }

  const text = `${i + 1}. ${step}`;

  doc.text(text, 50, sy, {
    width: 480,
    lineGap: 3,
  });

  const h = doc.heightOfString(text, {
    width: 480,
    lineGap: 3,
  });

  sy += h + 10;
});

    // ── NEXT STEPS ──
    sy += 8;
    doc.fontSize(9).fillColor(colors.light).font("Helvetica").text("NEXT STEPS", 50, sy, { characterSpacing: 0.8 });
    doc.moveTo(50, sy + 12).lineTo(545, sy + 12).strokeColor(colors.line).lineWidth(0.5).stroke();
    sy += 20;
    (interview.nextSteps || []).forEach((step) => {

  if (sy > 700) {
    doc.addPage();
    sy = 50;
  }

  const text = `• ${step}`;

  doc.text(text, 50, sy, {
    width: 480,
    lineGap: 3,
  });

  const h = doc.heightOfString(text, {
    width: 480,
    lineGap: 3,
  });

  sy += h + 10;
});

    // ── FOOTER ──
doc.text(
  "Generated by PrepWise — AI Interview Preparation Platform",
  50,
  800,
  { align: "center", width: 495 }
);
    doc.end();
  } catch (err) {
    console.error("Report error:", err.message);
    res.status(500).json({ message: err.message });
  }
};