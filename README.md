<div align="center">

# 🚀 PrepWise

### AI-Powered Interview Preparation Platform

<img src="./assets/banner.png" alt="PrepWise Banner"/>

<br>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

![GitHub Repo stars](https://img.shields.io/github/stars/Hardikk1508/PrepWise?style=social)
![GitHub forks](https://img.shields.io/github/forks/Hardikk1508/PrepWise?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Hardikk1508/PrepWise?style=social)

![Last Commit](https://img.shields.io/github/last-commit/Hardikk1508/PrepWise)
![Repo Size](https://img.shields.io/github/repo-size/Hardikk1508/PrepWise)
![Top Language](https://img.shields.io/github/languages/top/Hardikk1508/PrepWise)
![License](https://img.shields.io/github/license/Hardikk1508/PrepWise)

### 🎯 AI-powered platform for interview preparation, resume analysis, and intelligent feedback.

<a href="https://prep-wise-blond-three.vercel.app/">
  <img src="https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20PrepWise-blueviolet?style=for-the-badge">
</a>

</div>

---

# 📌 Table of Contents

- [Why PrepWise?](#-why-prepwise)
- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Demo](#-demo)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Challenges Faced](#-challenges-faced)
- [Future Enhancements](#-future-enhancements)
- [Author](#-author)

---

# 🎯 Why PrepWise?

Preparing for interviews often requires using multiple platforms:

- Mock Interview Platforms
- Resume ATS Checkers
- Performance Tracking Tools
- Feedback Platforms

PrepWise solves this problem by bringing everything together into one AI-powered ecosystem.

Students and job seekers can now:

✅ Practice realistic interviews

✅ Receive AI-generated feedback

✅ Analyze ATS compatibility

✅ Track interview progress

✅ Download detailed reports

---

# 🧠 Project Overview

| Category | Details |
|----------|---------|
| Domain | EdTech |
| Type | Full Stack Web App |
| AI Engine | Google Gemini |
| Authentication | Firebase |
| Deployment | Vercel + Render |

PrepWise is an AI-powered interview preparation platform designed to help students and professionals improve their interview performance through intelligent mock interviews and resume analysis.

---

# ❗ Problem Statement

Most existing platforms suffer from:

- 📚 Generic question banks.
- ❌ Lack of personalized feedback.
- 📄 No ATS resume analysis.
- 📈 No progress tracking.

As a result, candidates fail to identify weaknesses before actual interviews.

---

# 💡 Solution

PrepWise provides:

| Challenge | Solution |
|-----------|----------|
| Generic questions | AI-generated questions |
| No feedback | AI evaluation & scoring |
| Resume blind spots | ATS Analyzer |
| No progress tracking | Analytics dashboard |

---

# 🎥 Demo

## Mock Interview Flow

![Interview Demo](./assets/interview-demo.gif)

## ATS Resume Analyzer

![ATS Demo](./assets/ats-demo.gif)

---

# ✨ Features

## 🤖 AI Interview Engine

- Role-based interview generation.
- Technical, Behavioral and HR interviews.
- Experience-level customization.
- AI-generated unique questions.
- Real-time answer evaluation.

## 📊 Performance Analytics

- Per-question scoring.
- Strengths & weaknesses.
- Improvement suggestions.
- Interview history.
- Downloadable PDF reports.

## 📄 Resume ATS Analyzer

- ATS Score.
- Skill extraction.
- Keyword gap analysis.
- Resume section validation.

## 🔐 Authentication

- Google OAuth.
- Email/Password Authentication.
- Secure Firebase Authentication.

---

# 🏗 Architecture

## System Architecture

![Architecture](./assets/system-architecture.png)

---

## Interview Session Flow

![Session Flow](./assets/interview-flow.png)

---

## Authentication Flow

![Auth Flow](./assets/auth-flow.png)

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Framer Motion
- Axios
- React Router DOM

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

## AI

- Google Gemini API

## Authentication

- Firebase Authentication

## Deployment

- Vercel
- Render

---

# 📂 Folder Structure

```bash
PrepWise/
│
├── backend/
│
├── frontend/
│
├── README.md
│
└── LICENSE
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/Hardikk1508/PrepWise.git

cd PrepWise
```

## Backend Setup

```bash
cd backend

npm install

npm run dev
```

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

# 🔐 Environment Variables

## Backend (.env)

```env
PORT=
MONGODB_URI=
GEMINI_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
JWT_SECRET=
```

## Frontend (.env)

```env
VITE_API_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

---

# 🚀 API Workflow

```text
User → React Frontend
       ↓
Express Backend
       ↓
Google Gemini API
       ↓
MongoDB
       ↓
AI Response + Analytics
```

---

# 🚧 Challenges Faced

- Handling Gemini API rate limits.
- Designing scalable interview sessions.
- Structuring AI responses consistently.
- Implementing secure Firebase authentication.
- Managing Render backend cold starts.

---

# 🏆 Key Highlights

✅ Built complete MERN architecture.

✅ Integrated Google Gemini API.

✅ Implemented Firebase Authentication.

✅ Created ATS Resume Analyzer.

✅ Developed PDF Report generation.

✅ Deployed full-stack application.

---

# 🔮 Future Enhancements

- 🎤 Voice-based interviews.
- 📹 Webcam analysis.
- 🧠 Follow-up AI questions.
- 🌍 Multi-language support.
- 🏢 Company-specific interview preparation.

---

# 🤝 Contributing

Contributions are welcome.

```bash
Fork → Create Branch → Commit → Push → Pull Request
```

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Hardik Bhardwaj**

- LinkedIn: https://linkedin.com/in/your-profile
- GitHub: https://github.com/Hardikk1508

---

<div align="center">

### ⭐ If you like this project, don't forget to star the repository!

</div>
