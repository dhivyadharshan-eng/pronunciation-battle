// ============================================================
// POLYGLOT PRONUNCIATION BATTLE
// battle.js
// ============================================================

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

const TOTAL_ROUNDS = 5;
const MAX_RETRIES = 2;


// ============================================================
// LOAD STATE
// ============================================================

let state = loadState();

if (!state || state.completed) {

  location.replace(
    state?.completed
      ? "result.html"
      : "index.html"
  );

  throw new Error("No active battle");
}


// ============================================================
// SPEECH STATE
// ============================================================

let recognition = null;

let listening = false;

let busy = false;

let processingResult = false;


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


const supportsSpeech =
  !!(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  );


// ============================================================
// INITIALIZE STATE
// ============================================================

if (!Array.isArray(state.sentenceSet)) {

  state.sentenceSet =
    buildSentenceSet();
}


if (!Array.isArray(state.rounds)) {

  state.rounds = [];
}


if (typeof state.currentRound !== "number") {

  state.currentRound = 0;
}


saveState(state);


// ============================================================
// CURRENT ROUND
// ============================================================

function currentRoundData() {

  return (
    state.rounds[state.currentRound] ||
    null
  );
}


// ============================================================
// CURRENT SPEAKER
// ============================================================

function currentSpeaker() {

  if (
    !Array.isArray(state.members) ||
    state.members.length === 0
  ) {

    return "Speaker";
  }


  return state.members[
    state.currentRound %
    state.members.length
  ];
}


// ============================================================
// CREATE ROUND DATA
// ============================================================

function ensureRound() {

  if (
    !state.rounds[state.currentRound]
  ) {

    state.rounds[state.currentRound] = {

      attempts: 0,

      retries: 0,

      recognizedText: "",

      score: null

    };
  }


  return state.rounds[
    state.currentRound
  ];
}


// ============================================================
// CHECK RESULT
// ============================================================

function hasResult(round) {

  return (
    round &&
    round.score !== null &&
    round.score !== undefined
  );
}


// ============================================================
// RENDER UI
// ============================================================

function render() {

  if (
    state.currentRound >=
    TOTAL_ROUNDS
  ) {

    if (!state.completed) {

      finishBattle();
    }

    return;
  }


  const r =
    currentRoundData();


  const attempts =
    r?.attempts || 0;


  const retries =
    r?.retries || 0;


  const resultExists =
    hasResult(r);


  // ==========================================================
  // TEAM
  // ==========================================================

  if ($("teamTitle")) {

    $("teamTitle").textContent =
      state.teamName || "Team";
  }


  // ==========================================================
  // ROUND
  // ==========================================================

  if ($("roundNumber")) {

    $("roundNumber").textContent =
      state.currentRound + 1;
  }


  // ==========================================================
  // PROGRESS
  // ==========================================================

  if ($("progressBar")) {

    $("progressBar").style.width =
      `${(
        state.currentRound /
        TOTAL_ROUNDS
      ) * 100}%`;
  }


  // ==========================================================
  // SENTENCE
  // ==========================================================

  const sentence =
    state.sentenceSet[
      state.currentRound
    ];


  if (sentence) {

    if ($("difficulty")) {

      $("difficulty").textContent =
        sentence.difficulty;
    }


    if ($("sentence")) {

      $("sentence").textContent =
        sentence.text;
    }
  }


  // ==========================================================
  // SPEAKER
  // ==========================================================

  if ($("speakerName")) {

    $("speakerName").textContent =
      currentSpeaker();
  }


  // ==========================================================
  // ATTEMPTS
  // ==========================================================

  if ($("attemptText")) {

    $("attemptText").textContent =
      attempts;
  }


  // ==========================================================
  // RETRIES
  // ==========================================================

  if ($("retryCount")) {

    $("retryCount").textContent =
      retries;
  }


  // ==========================================================
  // RECOGNIZED SPEECH
  // ==========================================================

  if ($("recognizedText")) {

    $("recognizedText").textContent =
      r?.recognizedText || "—";
  }


  // ==========================================================
  // ACCURACY
  // ==========================================================

  if ($("score")) {

    $("score").textContent =
      resultExists
        ? `${r.score}%`
        : "—";
  }


  // ==========================================================
  // RETRY BUTTON TEXT
  // ==========================================================

  if ($("retryBtn")) {

    if (retries < MAX_RETRIES) {

      $("retryBtn").textContent =
        `Retry ${retries + 1}/${MAX_RETRIES}`;

    } else {

      $("retryBtn").textContent =
        `Retry ${MAX_RETRIES}/${MAX_RETRIES}`;
    }
  }


  // ==========================================================
  // MICROPHONE BUTTON
  // ==========================================================

  /*
    Speech is allowed when:

    - No result currently exists
    - Not listening
    - Not busy
    - Speech recognition supported
    - Retry count has not exceeded 2

    This allows:

      retries = 0 → initial speech
      retries = 1 → Retry 1 speech
      retries = 2 → Retry 2 speech
  */

  if ($("micBtn")) {

    $("micBtn").disabled =
      busy ||
      listening ||
      processingResult ||
      !supportsSpeech ||
      resultExists ||
      retries > MAX_RETRIES;
  }


  // ==========================================================
  // RETRY BUTTON
  // ==========================================================

  /*
    Retry is allowed:

      result exists
      AND retries < 2
  */

  if ($("retryBtn")) {

    $("retryBtn").disabled =
      busy ||
      listening ||
      processingResult ||
      !resultExists ||
      retries >= MAX_RETRIES ||
      !supportsSpeech;
  }


  // ==========================================================
  // CONTINUE BUTTON
  // ==========================================================

  /*
    Continue becomes available
    after every completed speech result.

    Including:

      Retry 2/2 → result → Continue
  */

  if ($("nextBtn")) {

    $("nextBtn").disabled =
      busy ||
      listening ||
      processingResult ||
      !resultExists;
  }
}


// ============================================================
// FIREBASE SYNC
// ============================================================

async function sync(patch = {}) {

  try {

    const totalRetries =
      state.rounds.reduce(
        (total, round) => {

          return (
            total +
            Number(
              round?.retries || 0
            )
          );

        },
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


    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Connection interrupted. Your progress is saved on this device.";

      $("battleMsg").className =
        "status warn";
    }
  }
}


// ============================================================
// RESET MICROPHONE UI
// ============================================================

function resetMicUI() {

  if (!$("micBtn")) {
    return;
  }


  $("micBtn").classList.remove(
    "listening"
  );


  $("micBtn").innerHTML =
    "🎙️<small>Tap to speak</small>";
}


// ============================================================
// CREATE NEW SPEECH RECOGNITION
// ============================================================

function createRecognition() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    return null;
  }


  const instance =
    new SpeechRecognition();


  // ==========================================================
  // SETTINGS
  // ==========================================================

  instance.lang =
    "en-US";


  instance.interimResults =
    false;


  instance.continuous =
    false;


  instance.maxAlternatives =
    1;


  // ==========================================================
  // START
  // ==========================================================

  instance.onstart = () => {

    listening = true;

    busy = true;

    processingResult = false;


    if ($("micBtn")) {

      $("micBtn").classList.add(
        "listening"
      );


      $("micBtn").innerHTML =
        "🔴<small>Listening…</small>";
    }


    if ($("battleMsg")) {

      const r =
        ensureRound();


      if (r.retries === 0) {

        $("battleMsg").textContent =
          "Listening... Speak the complete sentence.";

      } else {

        $("battleMsg").textContent =
          `Retry ${r.retries}/2. Speak the sentence again.`;
      }


      $("battleMsg").className =
        "status";
    }


    render();
  };


  // ==========================================================
  // RESULT
  // ==========================================================

  instance.onresult = (event) => {

    let finalText = "";


    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      if (
        event.results[i].isFinal
      ) {

        finalText +=
          event.results[i][0].transcript +
          " ";
      }
    }


    finalText =
      finalText.trim();


    if (!finalText) {

      return;
    }


    /*
      Prevent onend from resetting
      the state while the result
      is being processed.
    */

    processingResult = true;


    handleSpeech(
      finalText
    );
  };


  // ==========================================================
  // ERROR
  // ==========================================================

  instance.onerror = (event) => {

    console.warn(
      "Speech recognition error:",
      event.error
    );


    listening = false;

    busy = false;

    processingResult = false;


    resetMicUI();


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
        "Speech recognition was stopped. Please try again.",

      "service-not-allowed":
        "Speech recognition service is not available."
    };


    if ($("battleMsg")) {

      $("battleMsg").textContent =
        messages[event.error] ||
        "Speech recognition failed. Please try again.";

      $("battleMsg").className =
        "status error";
    }


    render();
  };


  // ==========================================================
  // END
  // ==========================================================

  instance.onend = () => {

    listening = false;


    /*
      If a result is currently being processed,
      handleSpeech() will reset busy itself.
    */

    if (!processingResult) {

      busy = false;
    }


    resetMicUI();


    /*
      Do not change the round here.
      Do not automatically retry.
      Do not automatically continue.
    */

    render();
  };


  return instance;
}


// ============================================================
// START SPEECH
// ============================================================

function startSpeech() {

  // Already busy
  if (
    listening ||
    busy ||
    processingResult
  ) {

    return;
  }


  const r =
    ensureRound();


  // ==========================================================
  // ALLOW INITIAL + RETRY 1 + RETRY 2
  // ==========================================================

  if (
    r.retries > MAX_RETRIES
  ) {

    return;
  }


  // ==========================================================
  // RESULT ALREADY EXISTS
  // ==========================================================

  if (
    r.score !== null &&
    r.score !== undefined
  ) {

    return;
  }


  // ==========================================================
  // CREATE A COMPLETELY NEW RECOGNITION INSTANCE
  // ==========================================================

  recognition =
    createRecognition();


  if (!recognition) {

    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Speech recognition is not supported. Please use Chrome.";

      $("battleMsg").className =
        "status error";
    }


    return;
  }


  // ==========================================================
  // START
  // ==========================================================

  try {

    recognition.start();

  } catch (error) {

    console.warn(
      "Could not start speech recognition:",
      error
    );


    listening = false;

    busy = false;

    processingResult = false;


    resetMicUI();


    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Could not start the microphone. Please tap again.";

      $("battleMsg").className =
        "status error";
    }


    render();
  }
}


// ============================================================
// HANDLE SPEECH RESULT
// ============================================================

async function handleSpeech(text) {

  const r =
    ensureRound();


  // ==========================================================
  // EMPTY RESULT
  // ==========================================================

  if (
    !text ||
    !text.trim()
  ) {

    busy = false;

    processingResult = false;

    listening = false;


    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "No speech was detected. Please try again.";

      $("battleMsg").className =
        "status error";
    }


    render();

    return;
  }


  // ==========================================================
  // SAFETY
  // ==========================================================

  if (
    r.retries > MAX_RETRIES
  ) {

    busy = false;

    processingResult = false;

    listening = false;


    render();

    return;
  }


  // ==========================================================
  // COUNT ATTEMPT
  // ==========================================================

  r.attempts += 1;


  // ==========================================================
  // SAVE RECOGNIZED TEXT
  // ==========================================================

  r.recognizedText =
    text.trim();


  // ==========================================================
  // GET SENTENCE
  // ==========================================================

  const sentence =
    state.sentenceSet[
      state.currentRound
    ];


  if (!sentence) {

    console.error(
      "Sentence not found."
    );


    busy = false;

    processingResult = false;

    listening = false;


    return;
  }


  // ==========================================================
  // CALCULATE SCORE
  // ==========================================================

  r.score =
    similarity(
      sentence.text,
      r.recognizedText
    );


  // ==========================================================
  // SAVE LOCAL STATE
  // ==========================================================

  saveState(state);


  // ==========================================================
  // FINISHED SPEECH
  // ==========================================================

  listening = false;

  busy = true;


  // ==========================================================
  // FINAL ATTEMPT
  // ==========================================================

  if (
    r.retries >= MAX_RETRIES
  ) {

    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Final attempt completed. Click Continue for the next sentence.";

      $("battleMsg").className =
        "status success";
    }

  } else {

    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Result recorded. You can retry or continue.";

      $("battleMsg").className =
        "status";
    }
  }


  // ==========================================================
  // FIREBASE
  // ==========================================================

  await sync({

    lastScore:
      r.score,

    lastRecognizedText:
      r.recognizedText
  });


  // ==========================================================
  // FINISH PROCESSING
  // ==========================================================

  busy = false;

  processingResult = false;


  resetMicUI();


  // ==========================================================
  // UPDATE UI
  // ==========================================================

  render();
}


// ============================================================
// RETRY
// ============================================================

function retry() {

  const r =
    ensureRound();


  // ==========================================================
  // RESULT REQUIRED
  // ==========================================================

  if (
    !hasResult(r)
  ) {

    return;
  }


  // ==========================================================
  // ONLY TWO RETRIES
  // ==========================================================

  if (
    r.retries >= MAX_RETRIES
  ) {

    return;
  }


  // ==========================================================
  // INCREASE RETRY
  // ==========================================================

  r.retries += 1;


  // ==========================================================
  // CLEAR PREVIOUS RESULT
  // ==========================================================

  r.score = null;

  r.recognizedText = "";


  // ==========================================================
  // SAVE
  // ==========================================================

  saveState(state);


  // ==========================================================
  // MESSAGE
  // ==========================================================

  if ($("battleMsg")) {

    $("battleMsg").textContent =
      `Retry ${r.retries}/2. Speak the sentence again.`;

    $("battleMsg").className =
      "status";
  }


  // ==========================================================
  // UPDATE UI
  // ==========================================================

  render();


  // ==========================================================
  // START NEW SPEECH INSTANCE
  // ==========================================================

  setTimeout(() => {

    startSpeech();

  }, 300);
}


// ============================================================
// CONTINUE
// ============================================================

async function advanceRound() {

  const r =
    currentRoundData();


  // ==========================================================
  // RESULT REQUIRED
  // ==========================================================

  if (
    !r ||
    !hasResult(r)
  ) {

    return;
  }


  // ==========================================================
  // MOVE TO NEXT ROUND
  // ==========================================================

  state.currentRound += 1;


  saveState(state);


  // ==========================================================
  // FIVE ROUNDS COMPLETE
  // ==========================================================

  if (
    state.currentRound >=
    TOTAL_ROUNDS
  ) {

    await finishBattle();

    return;
  }


  // ==========================================================
  // FIREBASE
  // ==========================================================

  await sync({});


  // ==========================================================
  // MESSAGE
  // ==========================================================

  if ($("battleMsg")) {

    $("battleMsg").textContent =
      "Next sentence. Get ready!";

    $("battleMsg").className =
      "status";
  }


  render();
}


// ============================================================
// FINISH BATTLE
// ============================================================

async function finishBattle() {

  // ==========================================================
  // ALREADY COMPLETED
  // ==========================================================

  if (state.completed) {

    location.replace(
      "result.html"
    );

    return;
  }


  // ==========================================================
  // MARK COMPLETE
  // ==========================================================

  state.completed =
    true;


  state.currentRound =
    TOTAL_ROUNDS;


  state.completedAt =
    Date.now();


  // ==========================================================
  // CALCULATE FINAL SCORE
  // ==========================================================

  const scores =
    state.rounds
      .slice(
        0,
        TOTAL_ROUNDS
      )
      .map(
        round =>
          Number(
            round?.score || 0
          )
      );


  const totalScore =
    scores.reduce(
      (sum, score) =>
        sum + score,
      0
    );


  state.finalScore =
    Math.round(
      totalScore /
      TOTAL_ROUNDS
    );


  // ==========================================================
  // TOTAL RETRIES
  // ==========================================================

  state.totalRetries =
    state.rounds.reduce(
      (total, round) =>
        total +
        Number(
          round?.retries || 0
        ),
      0
    );


  // ==========================================================
  // SAVE LOCALLY
  // ==========================================================

  saveState(state);


  // ==========================================================
  // FIREBASE
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

if ($("micBtn")) {

  $("micBtn").addEventListener(
    "click",
    startSpeech
  );
}


if ($("retryBtn")) {

  $("retryBtn").addEventListener(
    "click",
    retry
  );
}


if ($("nextBtn")) {

  $("nextBtn").addEventListener(
    "click",
    advanceRound
  );
}


// ============================================================
// ONLINE
// ============================================================

window.addEventListener(
  "online",
  () => {

    if ($("onlineDot")) {

      $("onlineDot").classList.add(
        "on"
      );
    }


    if ($("connectionText")) {

      $("connectionText").textContent =
        "Online";
    }


    sync({});
  }
);


// ============================================================
// OFFLINE
// ============================================================

window.addEventListener(
  "offline",
  () => {

    if ($("onlineDot")) {

      $("onlineDot").classList.remove(
        "on"
      );
    }


    if ($("connectionText")) {

      $("connectionText").textContent =
        "Offline • Saved locally";
    }
  }
);


// ============================================================
// INITIALIZE
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


  // Setup initial UI
  render();


  // Setup online state
  if (!navigator.onLine) {

    if ($("onlineDot")) {

      $("onlineDot").classList.remove(
        "on"
      );
    }


    if ($("connectionText")) {

      $("connectionText").textContent =
        "Offline • Saved locally";
    }
  }

})();
