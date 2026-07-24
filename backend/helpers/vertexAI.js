require("dotenv").config();

const GoogleGenAI = require("@google/genai").GoogleGenAI;

process.env.GOOGLE_APPLICATION_CREDENTIALS =
  "/Users/hardikbhardwaj123/Documents/GoogleKeys/prepwise.json";

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION,
});

module.exports = ai;