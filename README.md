# StudyMate — AI Learning Companion

A beginner-friendly AI + Education MVP for a hackathon Round 1.

## What it does

- AI topic explanation
- AI-generated exam notes
- AI-generated 5-question quiz
- AI-generated 7-day study plan
- Student level selection
- Local progress tracking (topics, quizzes, best score)
- Responsive UI

## Tech stack

- HTML
- CSS
- Vanilla JavaScript
- Node.js + Express
- Google Gemini API

## Run locally

### 1. Install Node.js

Use Node.js 20 or newer.

### 2. Open this folder in VS Code

Open the integrated terminal in the project folder.

### 3. Install packages

```bash
npm install
```

### 4. Create your environment file

Copy `.env.example` to `.env` and put your Gemini API key in:

```env
GEMINI_API_KEY=your_key_here
PORT=3000
```

Do NOT upload `.env` to GitHub.

### 5. Start the project

```bash
npm start
```

Open:

http://localhost:3000

## Demo flow

1. Select "Explain Topic"
2. Enter "Binary Search Tree"
3. Select Beginner
4. Click "Explain with AI"
5. Show the generated explanation
6. Select "Take Quiz"
7. Generate the quiz and answer questions
8. Show the progress card

## Hackathon pitch

### Problem
Students often get information, but not explanations that match their level. They also use different tools for notes, practice and planning.

### Solution
StudyMate brings AI-powered explanation, revision notes, quizzes and study planning into one student-friendly interface.

### Impact
It helps students move from "I don't understand this" to "I can explain and practice this" in one workflow.

### Future scope
- PDF/lecture-note upload
- Personalized learning history
- Voice tutor
- Multilingual explanations
- Teacher dashboard
- Adaptive quizzes
- Weak-topic recommendations

## Security note

The Gemini API key is used only on the Node.js server. Never put the API key directly inside `public/app.js` or any frontend file.
