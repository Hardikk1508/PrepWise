require("dotenv").config();

const path = require("path");
const { GoogleGenAI } = require("@google/genai");

// On Render: GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/prepwise.json (set in Image 8)
// On local:  GOOGLE_APPLICATION_CREDENTIALS=./prepwise.json
// We only override if the env var is a relative path (local dev)
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    __dirname,
    "..",
    process.env.GOOGLE_APPLICATION_CREDENTIALS.replace("./", "")
  );
}

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

if (!project) {
  console.warn("GOOGLE_CLOUD_PROJECT is not set.");
}

const ai = new GoogleGenAI({
  vertexai: true,
  project,
  location,
});

module.exports = ai;