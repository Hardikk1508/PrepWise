const { TECH_SKILLS } = require("./skillsDatabase");

function analyzeResumeText(text) {
  const lowerText = text.toLowerCase();

  const skillsFound = TECH_SKILLS.filter((skill) =>
    lowerText.includes(skill.toLowerCase())
  );

  const missingKeywords = TECH_SKILLS.filter(
    (skill) => !skillsFound.includes(skill)
  ).slice(0, 5);

  const sections = {
    contact:
      lowerText.includes("email") ||
      lowerText.includes("@"),

    summary:
      lowerText.includes("summary") ||
      lowerText.includes("objective"),

    experience:
      lowerText.includes("experience") ||
      lowerText.includes("work experience"),

    education:
      lowerText.includes("education"),

    skills:
      lowerText.includes("skills"),

    projects:
      lowerText.includes("project"),
  };

  let atsScore = 50;

  atsScore += Math.min(skillsFound.length * 3, 30);

  const completedSections =
    Object.values(sections).filter(Boolean).length;

  atsScore += completedSections * 3;

  atsScore = Math.min(atsScore, 100);

  const suggestions = [];

  if (!sections.summary)
    suggestions.push(
      "Add a professional summary section."
    );

  if (!sections.projects)
    suggestions.push(
      "Add project details with measurable impact."
    );

  if (missingKeywords.length > 0)
    suggestions.push(
      `Include keywords like ${missingKeywords.join(", ")}`
    );

  if (skillsFound.length < 5)
    suggestions.push(
      "Add more technical skills relevant to your target role."
    );

  return {
    atsScore,
    skillsFound,
    missingKeywords,
    sections,
    suggestions,
    wordCount: text.split(/\s+/).length,
  };
}

module.exports = {
  analyzeResumeText,
};