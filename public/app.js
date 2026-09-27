const state = {
  mode: "explain",
  questions: [],
  currentQuestion: 0,
  score: 0
};

const modeConfig = {
  explain: {
    label: "AI TUTOR",
    title: "What are you learning today?",
    button: "Explain with AI"
  },
  notes: {
    label: "SMART NOTES",
    title: "Turn any topic into revision notes.",
    button: "Make Notes"
  },
  quiz: {
    label: "KNOWLEDGE CHECK",
    title: "Test yourself with an AI quiz.",
    button: "Generate Quiz"
  },
  "study-plan": {
    label: "STUDY PLANNER",
    title: "Build a focused 7-day study plan.",
    button: "Create Study Plan"
  }
};

const $ = (id) => document.getElementById(id);

document.querySelectorAll(".mode").forEach(btn => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

document.querySelectorAll(".suggestion").forEach(btn => {
  btn.addEventListener("click", () => {
    $("topic").value = btn.textContent;
    $("topic").focus();
  });
});

$("studyForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const topic = $("topic").value.trim();
  const level = $("level").value;

  if (!topic) return;

  hideError();
  $("result").classList.add("hidden");
  $("quizArea").classList.add("hidden");
  $("loading").classList.remove("hidden");
  $("buttonText").textContent = "Working…";

  try {
    if (state.mode === "quiz") {
      const data = await api("/api/quiz", { topic, level, count: 5 });
      state.questions = data.questions;
      state.currentQuestion = 0;
      state.score = 0;
      $("quizArea").classList.remove("hidden");
      $("quizTitle").textContent = `${topic} Quiz`;
      renderQuestion();
      incrementTopics();
    } else {
      const data = await api("/api/ask", {
        topic,
        level,
        mode: state.mode
      });
      $("result").innerHTML = formatAIText(data.answer);
      $("result").classList.remove("hidden");
      incrementTopics();
    }
  } catch (err) {
    showError(err.message);
  } finally {
    $("loading").classList.add("hidden");
    $("buttonText").textContent = modeConfig[state.mode].button;
  }
});

$("nextBtn").addEventListener("click", () => {
  state.currentQuestion++;
  if (state.currentQuestion >= state.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
});

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll(".mode").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));

  $("modeLabel").textContent = modeConfig[mode].label;
  $("panelTitle").textContent = modeConfig[mode].title;
  $("buttonText").textContent = modeConfig[mode].button;

  $("result").classList.add("hidden");
  $("quizArea").classList.add("hidden");
  hideError();
}

async function api(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function formatAIText(text) {
  let html = escapeHtml(text);

  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^\*\*(.*?)\*\*$/gm, "<h4>$1</h4>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  html = html.replace(/^\s*[-•]\s+(.*)$/gm, "<li>$1</li>");
  html = html.replace(/^\s*\d+\.\s+(.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  html = html.replace(/\n{2,}/g, "</p><p>");
  html = "<p>" + html.replace(/\n/g, "<br>") + "</p>";
  html = html.replace(/<p><h/g, "<h").replace(/<\/h3><\/p>/g, "</h3>").replace(/<\/h4><\/p>/g, "</h4>");
  return html;
}

function renderQuestion() {
  const q = state.questions[state.currentQuestion];
  const total = state.questions.length;

  $("quizLiveScore").textContent = `${state.score} / ${state.currentQuestion}`;
  $("nextBtn").classList.add("hidden");

  const card = document.createElement("div");
  card.className = "question-card";

  card.innerHTML = `
    <div class="question-number">QUESTION ${state.currentQuestion + 1} OF ${total}</div>
    <div class="question-text">${escapeHtml(q.question)}</div>
    <div class="options">
      ${q.options.map((option, i) =>
        `<button class="option" data-index="${i}"><b>${String.fromCharCode(65+i)}.</b> ${escapeHtml(option)}</button>`
      ).join("")}
    </div>
    <div id="explanationBox"></div>
  `;

  $("questionArea").innerHTML = "";
  $("questionArea").appendChild(card);

  card.querySelectorAll(".option").forEach(btn => {
    btn.addEventListener("click", () => selectAnswer(Number(btn.dataset.index), q));
  });
}

function selectAnswer(selected, q) {
  const buttons = document.querySelectorAll(".option");
  buttons.forEach(b => b.disabled = true);

  buttons[q.answer].classList.add("correct");
  if (selected === q.answer) {
    state.score++;
  } else {
    buttons[selected].classList.add("wrong");
  }

  $("quizLiveScore").textContent = `${state.score} / ${state.currentQuestion + 1}`;
  $("explanationBox").innerHTML = `<div class="explanation"><b>Why?</b> ${escapeHtml(q.explanation || "Review the concept and try again.")}</div>`;
  $("nextBtn").textContent = state.currentQuestion === state.questions.length - 1 ? "See Result →" : "Next Question →";
  $("nextBtn").classList.remove("hidden");
}

function finishQuiz() {
  const total = state.questions.length;
  const percentage = Math.round((state.score / total) * 100);
  const oldBest = Number(localStorage.getItem("bestScore") || 0);
  if (percentage > oldBest) localStorage.setItem("bestScore", percentage);
  localStorage.setItem("quizCount", Number(localStorage.getItem("quizCount") || 0) + 1);
  updateProgress();

  $("questionArea").innerHTML = `
    <div class="result" style="margin-top:16px">
      <h3>Quiz complete 🎉</h3>
      <p>You scored <b>${state.score} / ${total}</b> (${percentage}%).</p>
      <p>${quizMessage(percentage)}</p>
    </div>
  `;
  $("nextBtn").classList.add("hidden");
  $("quizLiveScore").textContent = `${state.score} / ${total}`;
}

function quizMessage(p) {
  if (p >= 80) return "Great understanding. Try a harder level next.";
  if (p >= 60) return "Good start. Review the questions you missed.";
  return "Keep practicing. Revisit the topic and try the quiz again.";
}

function incrementTopics() {
  localStorage.setItem("topicsCount", Number(localStorage.getItem("topicsCount") || 0) + 1);
  updateProgress();
}

function updateProgress() {
  $("topicsCount").textContent = localStorage.getItem("topicsCount") || 0;
  $("quizCount").textContent = localStorage.getItem("quizCount") || 0;
  const best = localStorage.getItem("bestScore");
  $("bestScore").textContent = best ? `${best}%` : "—";
}

function showError(message) {
  $("error").textContent = message;
  $("error").classList.remove("hidden");
}

function hideError() {
  $("error").classList.add("hidden");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

updateProgress();
