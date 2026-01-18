const textArea = document.getElementById("textArea");
const counter = document.getElementById("counter");
const remaining = document.getElementById("remaining");
const warning = document.getElementById("warning");
const pet = document.getElementById("pet");

const toneValue = document.getElementById("toneValue");
const helperText = document.getElementById("helperText");

const themeToggle = document.getElementById("themeToggle");
const toggleText = document.getElementById("toggleText");

const sendBtn = document.getElementById("sendBtn");
const soundToggle = document.getElementById("soundToggle");

// Modal
const modalOverlay = document.getElementById("modalOverlay");
const modalOk = document.getElementById("modalOk");

const maxChars = 200;

/* Theme Toggle */
function setTheme(isDark){
  document.body.classList.toggle("dark", isDark);
  themeToggle.checked = isDark;
  toggleText.textContent = isDark ? "🌙 Dark" : "🌞 Light";
  localStorage.setItem("hp_theme", isDark ? "dark" : "light");
}
const savedTheme = localStorage.getItem("hp_theme");
setTheme(savedTheme === "dark");

themeToggle.addEventListener("change", () => setTheme(themeToggle.checked));

/* Web Audio API */
let audioCtx = null;
let audioReady = false;

function initAudio(){
  if (audioReady) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioReady = true;
}

function playTone({ freq = 440, duration = 0.08, type = "sine", gain = 0.05 }){
  if (!soundToggle.checked) return;
  if (!audioReady) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(g);
  g.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

// Unlock audio 
["click", "keydown", "touchstart"].forEach(evt => {
  document.addEventListener(evt, () => {
    initAudio();
    if (audioCtx?.state === "suspended") audioCtx.resume();
  }, { once: true });
});

function soundSend(){
  // cute 3-note chime
  playTone({ freq: 523.25, duration: 0.09, type: "sine", gain: 0.06 });
  setTimeout(() => playTone({ freq: 659.25, duration: 0.09, type: "sine", gain: 0.06 }), 110);
  setTimeout(() => playTone({ freq: 783.99, duration: 0.10, type: "sine", gain: 0.06 }), 220);
}

function soundLimit(){
  // small warning beep
  playTone({ freq: 220, duration: 0.12, type: "square", gain: 0.035 });
}

/* Tone Detector (keyword based)  */
const positiveWords = [
  "love","happy","great","amazing","wonderful","cute","kind","help","awesome","support",
  "thank","thanks","beautiful","good","nice","joy","excited","adopt"
];
const negativeWords = [
  "hate","sad","angry","bad","terrible","awful","worst","annoy","upset","cry",
  "problem","stupid","ugly"
];

function detectTone(text){
  const t = text.toLowerCase();
  let pos = 0;
  let neg = 0;

  positiveWords.forEach(w => { if (t.includes(w)) pos++; });
  negativeWords.forEach(w => { if (t.includes(w)) neg++; });

  if (pos > neg && pos > 0) return "Positive 💖";
  if (neg > pos && neg > 0) return "Negative 😔";
  return "Neutral 😐";
}

/*  Smart Helper Suggestions */
function helperSuggestion(text, length, remainingChars){
  const trimmed = text.trim().toLowerCase();

  if (length === 0) return "Tip: Say why you love animals 💖";
  if (length < 25) return "Try adding: why you want to help pets 🐾";
  if (length < 60) return "Nice! Mention your favorite pet 🐶🐱";
  if (length < 120) return "Great message! Add something encouraging ✨";
  if (remainingChars <= 25 && remainingChars > 0) return "Almost full! Keep it short ✅";
  if (remainingChars === 0) return "Limit reached! You can edit your message ✏️";
  if (trimmed.includes("adopt")) return "Lovely! Adoption saves lives 🏡💖";
  return "Looks good! You're doing great 🌟";
}

/* Modal helpers */
function openModal(){
  modalOverlay.classList.add("show");
  modalOk.focus();
}
function closeModal(){
  modalOverlay.classList.remove("show");
}

modalOk.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("show")) closeModal();
});

/*  Counter + limit handling  */
let alreadyBeepedAtLimit = false;

function updateUI(){
  let value = textArea.value;
  let length = value.length;

  if (length > maxChars) {
    textArea.value = value.substring(0, maxChars);
    length = maxChars;
  }

  const left = maxChars - length;

  counter.textContent = `${length} / ${maxChars} characters`;
  remaining.textContent = `${left} remaining`;

  // Tone + helper
  toneValue.textContent = detectTone(textArea.value);
  helperText.textContent = helperSuggestion(textArea.value, length, left);

  // Pet reaction
  pet.classList.toggle("happy", length > 0 && length < maxChars);

  // Warning + limit sound
  if (left === 0) {
    warning.textContent = "Character limit reached! (200 max)";
    pet.classList.add("warn");

    if (!alreadyBeepedAtLimit) {
      initAudio();
      soundLimit();
      alreadyBeepedAtLimit = true;
    }
  } else {
    warning.textContent = "";
    pet.classList.remove("warn");
    alreadyBeepedAtLimit = false;
  }

  // Enable send only if message not empty
  sendBtn.disabled = !(length > 0 && length <= maxChars);
}

/* Real-time updates */
textArea.addEventListener("input", () => {
  initAudio();
  updateUI();
});

/* Send action */
sendBtn.addEventListener("click", () => {
  initAudio();
  soundSend();
  openModal();

  // reset message
  textArea.value = "";
  updateUI();
});

/* Init */
updateUI();
