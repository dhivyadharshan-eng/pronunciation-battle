import {
  database,
  ref,
  update,
  ensureAnonymousAuth
} from "../firebase.js";

import { buildSentenceSet } from "./sentences.js";

import {
  similarity,
  loadState,
  saveState
} from "./utils.js";


// ============================================================
// CONFIGURATION
// ============================================================

// 5 rounds in total
const TOTAL_ROUNDS = 5;

// Your displayed flow ends at Retry 2/3
// Initial speech = not a retry
// Retry 1 = second speech
// Retry 2 = third speech
const MAX_RETRIES = 2;


// ============================================================
// LOAD BATTLE STATE
// ============================================================

let state = loadState();

if (!state || state.completed) {
  location.replace(
    state?.completed ? "result.html" : "index.html"
  );

  throw new Error("No active battle");
}


// ============================================================
// SPEECH VARIABLES
// ============================================================

let recognition = null;
let listening = false;
let busy = false;


// ============================================================
// HELPER
// ============================================================

const $ = (id) => document.getElementById(id);

const supportsSpeech =
  !!(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  );


// ============================================================
// INITIALIZE STATE
// ============================================================

if (!state.sentenceSet) {
  state.sentenceSet = buildSentenceSet();
}

if (!Array.isArray(state.rounds)) {
  state.rounds = [];
}

if (typeof state.currentRound !== "number") {
  state.currentRound = 0;
}

state.pendingAdvance = false;

saveState(state);


// ============================================================
// CURRENT ROUND
// ============================================================

function currentRoundData() {
  return state.rounds[state.currentRound] || null;
}


// ============================================================
// CURRENT SPEAKER
// ============================================================

function currentSpeaker() {
  if (!state.members || state.members.length === 0) {
    return "Speaker";
  }

  return state.members[
    state.currentRound % state.members.length
  ];
}


// ============================================================
// ENSURE ROUND DATA EXISTS
// ============================================================

function ensureRound() {

  if (!state.rounds[state.currentRound]) {

    state.rounds[state.currentRound] = {
      attempts: 0,
      retries: 0,
      recognizedText: "",
      score: null
    };
  }

  return state.rounds[state.currentRound];
}


// ============================================================
// RENDER BATTLE UI
// ============================================================

function render() {

  if (state.currentRound >= TOTAL_ROUNDS) {
    finishBattle();
    return;
  }

  const r = currentRoundData();

  const attempts = r?.attempts || 0;
  const retries = r?.retries || 0;

  const hasResult =
    r?.score !== null &&
    r?.score !== undefined;


  // Team
  $("teamTitle").textContent =
    state.teamName || "Team";


  // Round
  $("roundNumber").textContent =
    state.currentRound + 1;


  $("progressBar").style.width =
    `${(state.currentRound / TOTAL_ROUNDS) * 100}%`;


  // Sentence
  const sentence =
    state.sentenceSet[state.currentRound];

  $("difficulty").textContent =
    sentence.difficulty;

  $("sentence").textContent =
    sentence.text;


  // Speaker
  $("speakerName").textContent =
    currentSpeaker();


  // Attempts
  $("attemptText").textContent =
    attempts;


  // Retry count
  $("retryCount").textContent =
    retries;


  // Recognized speech
  $("recognizedText").textContent =
    r?.recognizedText || "—";


  // Accuracy
  $("score").textContent =
    hasResult
      ? `${r.score}%`
      : "—";


  // =========================================================
  // MICROPHONE
  // =========================================================

  // Microphone is available when there is NO result,
  // because that means the participant needs to speak.
  $("micBtn").disabled =
    busy ||
    listening ||
    !supportsSpeech ||
    hasResult ||
    retries > MAX_RETRIES;


  // =========================================================
  // RETRY BUTTON
  // =========================================================

  // Retry is available after a result,
  // but only until 2 retries have been used.
  $("retryBtn").disabled =
    busy ||
    listening ||
    !hasResult ||
    retries >= MAX_RETRIES ||
    !supportsSpeech;


  // =========================================================
  // CONTINUE BUTTON
  // =========================================================

  // Continue is available whenever a result exists.
  // Therefore after Retry 2/2 it remains enabled.
  $("nextBtn").disabled =
    busy ||
    listening ||
    !hasResult;
}


// ============================================================
// FIREBASE SYNC
// ============================================================

async function sync(patch = {}) {

  try {

    const totalRetries =
      state.rounds.reduce(
        (total, round) =>
          total +
          Number(round?.retries || 0),
        0
      );


    await update(
      ref(
        database,
        `competitions/${state.competitionCode}/teams/${state.teamId}`
      ),
      {
        ...patch,

        currentRound:
          state.currentRound,

        retriesUsed:
          totalRetries,

        status:
          state.completed
            ? "completed"
            : "in-battle"
      }
    );

  } catch (error) {

    console.warn(
      "Firebase sync failed:",
      error
    );


    $("battleMsg").textContent =
      "Connection interrupted. Your progress is saved on this device.";

    $("battleMsg").className =
      "status warn";
  }
}


// ============================================================
// SPEECH RECOGNITION SETUP
// ============================================================

function setupSpeech() {

  if (!supportsSpeech) {

    $("battleMsg").textContent =
      "Speech recognition is not supported in this browser. Please use Chrome.";

    $("battleMsg").className =
      "status error";

    $("micBtn").disabled = true;

    return;
  }


  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  recognition =
    new SpeechRecognition();


  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  recognition.lang =
    "en-US";

  recognition.interimResults =
    false;

  recognition.continuous =
    false;

  recognition.maxAlternatives =
    1;


  // ==========================================================
  // START LISTENING
  // ==========================================================

  recognition.onstart = () => {

    listening = true;
    busy = true;


    $("micBtn").classList.add(
      "listening"
    );


    $("micBtn").innerHTML =
      "🔴<small>Listening…</small>";


    $("battleMsg").textContent =
      "Listening... Speak the complete sentence.";

    $("battleMsg").className =
      "status";


    render();
  };


  // ==========================================================
  // SPEECH RESULT
  // ==========================================================

  recognition.onresult = (event) => {

    let finalText = "";


    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      if (event.results[i].isFinal) {

        finalText +=
          event.results[i][0].transcript + " ";
      }
    }


    finalText =
      finalText.trim();


    if (finalText) {

      handleSpeech(finalText);
    }
  };


  // ==========================================================
  // SPEECH ERROR
  // ==========================================================

  recognition.onerror = (event) => {

    listening = false;
    busy = false;


    $("micBtn").classList.remove(
      "listening"
    );


    $("micBtn").innerHTML =
      "🎙️<small>Tap to speak</small>";


    const messages = {

      "not-allowed":
        "Microphone permission was denied. Please allow microphone access.",

      "audio-capture":
        "No microphone was found. Check your microphone.",

      "network":
        "Speech recognition needs an internet connection.",

      "no-speech":
        "No speech was detected. Please speak the complete sentence.",

      "aborted":
        "Speech recognition was stopped. Please try again."
    };


    $("battleMsg").textContent =
      messages[event.error] ||
      "Speech recognition failed. Please try again.";


    $("battleMsg").className =
      "status error";


    render();
  };


  // ==========================================================
  // SPEECH ENDED
  // ==========================================================

  recognition.onend = () => {

    listening = false;
    busy = false;


    $("micBtn").classList.remove(
      "listening"
    );


    $("micBtn").innerHTML =
      "🎙️<small>Tap to speak</small>";


    render();
  };
}


// ============================================================
// HANDLE SPEECH
// ============================================================

async function handleSpeech(text) {

  const r = ensureRound();


  // Empty speech
  if (!text || !text.trim()) {

    busy = false;

    $("battleMsg").textContent =
      "No speech was detected. Please speak the complete sentence.";

    $("battleMsg").className =
      "status error";

    render();

    return;
  }


  // Safety check
  if (r.retries > MAX_RETRIES) {

    busy = false;

    render();

    return;
  }


  // Count speech attempt
  r.attempts += 1;


  // Save recognized speech
  r.recognizedText =
    text.trim();


  // Calculate accuracy
  const sentence =
    state.sentenceSet[state.currentRound];

  r.score =
    similarity(
      sentence.text,
      r.recognizedText
    );


  busy = false;

  saveState(state);


  // =========================================================
  // MESSAGE
  // =========================================================

  if (r.retries >= MAX_RETRIES) {

    $("battleMsg").textContent =
      "Final attempt completed. Click Continue for the next sentence.";

    $("battleMsg").className =
      "status success";

  } else {

    $("battleMsg").textContent =
      "Result recorded. You can retry or continue.";

    $("battleMsg").className =
      "status";
  }


  // =========================================================
  // FIREBASE
  // =========================================================

  await sync({
    lastScore: r.score,
    lastRecognizedText: r.recognizedText
  });


  // =========================================================
  // UPDATE SCREEN
  // =========================================================

  render();

  // IMPORTANT:
  // There is NO advanceRound() here.
}
// ============================================================
// START SPEECH
// ============================================================
function startSpeech() {
  if (
    listening ||
    busy
  ) {
    return;
  }
  const r =
    ensureRound();
  if (
    r.retries >= MAX_RETRIES
  ) {
    return;
  }
  $("battleMsg").textContent =
    "Speak the complete sentence.";
  $("battleMsg").className =
    "status";
  try {
    recognition.start();
  } catch (error) {
    busy = false;
    console.warn(
      "Speech recognition could not start:",
      error
    );
  }
}
// ============================================================
// RETRY
// ============================================================
function retry() {

  const r = ensureRound();


  // There must be a previous result
  if (
    r.score === null ||
    r.score === undefined
  ) {
    return;
  }


  // Only 2 retries allowed
  if (
    r.retries >= MAX_RETRIES
  ) {
    return;
  }


  // Increase retry count
  r.retries += 1;


  // Remove previous result
  r.score = null;
  r.recognizedText = "";


  saveState(state);


  $("battleMsg").textContent =
    `Retry ${r.retries}/2. Speak the sentence again.`;

  $("battleMsg").className =
    "status";


  // Render BEFORE starting microphone
  render();


  // Start microphone
  setTimeout(() => {
    startSpeech();
  }, 200);
}
// ============================================================
// CONTINUE TO NEXT ROUND
// ============================================================
async function advanceRound() {

  const r = currentRoundData();


  // Cannot continue without a result
  if (
    !r ||
    r.score === null ||
    r.score === undefined
  ) {
    return;
  }


  // Move to next round
  state.currentRound += 1;

  saveState(state);


  await sync({});


  // Five rounds completed
  if (
    state.currentRound >= TOTAL_ROUNDS
  ) {

    await finishBattle();

    return;
  }


  // Show next sentence
  $("battleMsg").textContent =
    "Next sentence. Get ready!";

  $("battleMsg").className =
    "status";


  render();
}
// ============================================================
// FINISH BATTLE
// ============================================================
async function finishBattle() {
  // Prevent duplicate completion
  if (state.completed) {
    location.replace(
      "result.html"
    );
    return;
  }
  state.completed =
    true;
  state.currentRound =
    TOTAL_ROUNDS;
  state.completedAt =
    Date.now();
  // ==========================================================
  // FINAL SCORE
  // ==========================================================
  const scores =
    state.rounds
      .slice(0, TOTAL_ROUNDS)
      .map(round =>
        Number(round?.score || 0)
      );
  const totalScore =
    scores.reduce(
      (sum, score) =>
        sum + score,
      0
    );
  state.finalScore =
    Math.round(
      totalScore / TOTAL_ROUNDS
    );
  // ==========================================================
  // TOTAL RETRIES
  // ==========================================================
  state.totalRetries =
    state.rounds.reduce(
      (total, round) =>
        total +
        Number(round?.retries || 0),
      0
    );
  // ==========================================================
  // SAVE LOCALLY
  // ==========================================================
  saveState(state);
  // ==========================================================
  // SAVE TO FIREBASE
  // ==========================================================
  await sync({
    status:
      "completed",
    finalScore:
      state.finalScore,
    totalRetries:
      state.totalRetries,
    completedAt:
      state.completedAt
  });
  // ==========================================================
  // RESULT PAGE
  // ==========================================================
 location.replace(
    "result.html"
  );
}
// ============================================================
// BUTTON EVENTS
// ============================================================
$("micBtn").addEventListener(
  "click",
  startSpeech
);
$("retryBtn").addEventListener(
  "click",
  retry
);
$("nextBtn").addEventListener(
  "click",
  advanceRound
);
// ============================================================
// ONLINE / OFFLINE
// ============================================================
window.addEventListener(
  "online",
  () => {
    $("onlineDot").classList.add(
      "on"
    );
    $("connectionText").textContent =
      "Online";
    sync({});
  }
);
window.addEventListener(
  "offline",
  () => {
    $("onlineDot").classList.remove(
      "on"
    );
    $("connectionText").textContent =
      "Offline • Saved locally";
  }
);
// ============================================================
// INITIAL START
// ============================================================
(async () => {
  try {
    await ensureAnonymousAuth();
  } catch (error) {
    console.warn(
      "Anonymous authentication failed:",
      error
    );
  }
  setupSpeech();
  render();
  if (!navigator.onLine) {

    $("onlineDot").classList.remove(
      "on"
    );

    $("connectionText").textContent =
      "Offline • Saved locally";
  }

})();