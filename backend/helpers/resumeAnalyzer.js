const { TECH_SKILLS } = require("./skillsDatabase");

function analyzeResumeText(text) {
  const lowerText = text.toLowerCase();

  const skillsFound = TECH_SKILLS.filter((skill) =>
    lowerText.includes(skill.toLowerCase())
  );

  const missingKeywords = TECH_SKILLS.filter(
    (skill) => !skillsFound.includes(skill)
  ).slice(0, 10);

  const sections = {
    contact: lowerText.includes("email") || lowerText.includes("@"),
    summary: lowerText.includes("summary") || lowerText.includes("objective"),
    experience: lowerText.includes("experience") || lowerText.includes("work experience"),
    education: lowerText.includes("education"),
    skills: lowerText.includes("skills"),
    projects: lowerText.includes("project"),
  };

  let atsScore = 50;
  atsScore += Math.min(skillsFound.length * 3, 30);
  const completedSections = Object.values(sections).filter(Boolean).length;
  atsScore += completedSections * 3;
  atsScore = Math.min(atsScore, 100);

  const suggestions = [];
  if (!sections.summary) suggestions.push("Add a professional summary section.");
  if (!sections.projects) suggestions.push("Add a Projects section to showcase your work.");
  if (skillsFound.length < 8) suggestions.push("Add more technical skills relevant to your target role.");
  if (missingKeywords.length > 0)
    suggestions.push(`Include keywords like: ${missingKeywords.slice(0, 5).join(", ")}`);
  suggestions.push("Add measurable achievements (e.g. improved performance by 40%).");
  suggestions.push("Quantify your work experience with numbers and results.");
  if (!sections.experience) suggestions.push("Add a Work Experience or Internship section.");

  return {
    atsScore,
    skillsFound,
    missingKeywords,
    sections,
    suggestions: suggestions.slice(0, 6),
    wordCount: text.split(/\s+/).length,
  };
}

module.exports = { analyzeResumeText };