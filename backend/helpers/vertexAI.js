require("dotenv").config();

const path = require("path");
const GoogleGenAI = require("@google/genai").GoogleGenAI;

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  path.join(__dirname, "..", "config", "prepwise.json");

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
});

module.exports = ai;