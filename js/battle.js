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

// Initial speech + Retry 1 + Retry 2
const MAX_RETRIES = 2;


// ============================================================
// LOAD BATTLE STATE
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
// SPEECH VARIABLES
// ============================================================

let recognition = null;

let listening = false;

let busy = false;


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

// Create sentence set only once
if (!Array.isArray(state.sentenceSet)) {

  state.sentenceSet =
    buildSentenceSet();
}


// Make sure rounds exists
if (!Array.isArray(state.rounds)) {

  state.rounds = [];
}


// Make sure currentRound exists
if (
  typeof state.currentRound !== "number"
) {

  state.currentRound = 0;
}


// IMPORTANT
// Do not automatically advance after refresh
state.pendingAdvance = false;


// Save restored state
saveState(state);


// ============================================================
// CURRENT ROUND DATA
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
// ENSURE CURRENT ROUND EXISTS
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
// RENDER BATTLE UI
// ============================================================

function render() {

  // Safety
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


  const hasResult =
    r?.score !== null &&
    r?.score !== undefined;


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
  // PROGRESS BAR
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
      hasResult
        ? `${r.score}%`
        : "—";
  }


  // ==========================================================
  // MICROPHONE BUTTON
  // ==========================================================

  /*
    Microphone is enabled when:

    1. No result exists
    2. Speech recognition is supported
    3. We are not already listening
    4. We are not busy
    5. Retry count has not exceeded 2
  */

  if ($("micBtn")) {

    $("micBtn").disabled =
      busy ||
      listening ||
      !supportsSpeech ||
      hasResult ||
      retries > MAX_RETRIES;
  }


  // ==========================================================
  // RETRY BUTTON
  // ==========================================================

  /*
    Retry is enabled only when:

    - A result exists
    - We are not listening
    - We are not busy
    - Retry count is below 2

    Therefore:

    Result after initial speech
       → Retry enabled

    Result after Retry 1
       → Retry enabled

    Result after Retry 2
       → Retry disabled
  */

  if ($("retryBtn")) {

    $("retryBtn").disabled =
      busy ||
      listening ||
      !hasResult ||
      retries >= MAX_RETRIES ||
      !supportsSpeech;
  }


  // ==========================================================
  // CONTINUE BUTTON
  // ==========================================================

  /*
    Continue is enabled whenever
    the current sentence has a result.

    This includes the final Retry 2 result.
  */

  if ($("nextBtn")) {

    $("nextBtn").disabled =
      busy ||
      listening ||
      !hasResult;
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
// SPEECH RECOGNITION SETUP
// ============================================================

function setupSpeech() {

  if (!supportsSpeech) {

    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Speech recognition is not supported in this browser. Please use Chrome.";

      $("battleMsg").className =
        "status error";
    }


    if ($("micBtn")) {

      $("micBtn").disabled = true;
    }


    return;
  }


  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  recognition =
    new SpeechRecognition();


  // ==========================================================
  // SPEECH SETTINGS
  // ==========================================================

  recognition.lang =
    "en-US";


  recognition.interimResults =
    false;


  recognition.continuous =
    false;


  recognition.maxAlternatives =
    1;


  // ==========================================================
  // SPEECH START
  // ==========================================================

  recognition.onstart = () => {

    listening = true;

    busy = true;


    if ($("micBtn")) {

      $("micBtn").classList.add(
        "listening"
      );


      $("micBtn").innerHTML =
        "🔴<small>Listening…</small>";
    }


    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Listening... Speak the complete sentence.";

      $("battleMsg").className =
        "status";
    }


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


    if (finalText) {

      handleSpeech(
        finalText
      );
    }
  };


  // ==========================================================
  // SPEECH ERROR
  // ==========================================================

  recognition.onerror = (event) => {

    listening = false;

    busy = false;


    if ($("micBtn")) {

      $("micBtn").classList.remove(
        "listening"
      );


      $("micBtn").innerHTML =
        "🎙️<small>Tap to speak</small>";
    }


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
  // SPEECH END
  // ==========================================================

  recognition.onend = () => {

    listening = false;

    busy = false;


    if ($("micBtn")) {

      $("micBtn").classList.remove(
        "listening"
      );


      $("micBtn").innerHTML =
        "🎙️<small>Tap to speak</small>";
    }


    render();
  };
}


// ============================================================
// HANDLE SPEECH
// ============================================================

async function handleSpeech(text) {

  const r =
    ensureRound();


  // ==========================================================
  // EMPTY SPEECH
  // ==========================================================

  if (
    !text ||
    !text.trim()
  ) {

    busy = false;


    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "No speech was detected. Please speak the complete sentence.";

      $("battleMsg").className =
        "status error";
    }


    render();

    return;
  }


  // ==========================================================
  // SAFETY CHECK
  // ==========================================================

  /*
    IMPORTANT:

    retries can be:

    0 = initial speech
    1 = Retry 1
    2 = Retry 2

    All three attempts are allowed.

    Only values ABOVE 2 are rejected.
  */

  if (
    r.retries > MAX_RETRIES
  ) {

    busy = false;

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
  // CALCULATE ACCURACY
  // ==========================================================

  const sentence =
    state.sentenceSet[
      state.currentRound
    ];


  if (!sentence) {

    busy = false;

    console.error(
      "Sentence not found for round:",
      state.currentRound
    );

    return;
  }


  r.score =
    similarity(
      sentence.text,
      r.recognizedText
    );


  // ==========================================================
  // SPEECH FINISHED
  // ==========================================================

  busy = false;


  // Save immediately
  saveState(state);


  // ==========================================================
  // MESSAGE
  // ==========================================================

  if (
    r.retries >= MAX_RETRIES
  ) {

    /*
      Retry 2 completed.

      Do NOT automatically move
      to the next sentence.
    */

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
  // UPDATE UI
  // ==========================================================

  render();


  /*
    VERY IMPORTANT:

    There is NO:

      advanceRound();

    here.

    Continue button controls
    the next sentence.
  */
}


// ============================================================
// START SPEECH
// ============================================================

function startSpeech() {

  // Already listening
  if (
    listening ||
    busy
  ) {

    return;
  }


  const r =
    ensureRound();


  /*
    IMPORTANT FIX:

    We use:

        retries > MAX_RETRIES

    NOT:

        retries >= MAX_RETRIES

    Because Retry 2 must still be allowed
    to start the third speech attempt.
  */

  if (
    r.retries > MAX_RETRIES
  ) {

    return;
  }


  // Do not start speech if a result
  // already exists.
  if (
    r.score !== null &&
    r.score !== undefined
  ) {

    return;
  }


  // ==========================================================
  // MESSAGE
  // ==========================================================

  if ($("battleMsg")) {

    if (r.retries === 0) {

      $("battleMsg").textContent =
        "Speak the complete sentence.";

    } else {

      $("battleMsg").textContent =
        `Retry ${r.retries}/2. Speak the sentence again.`;
    }


    $("battleMsg").className =
      "status";
  }


  // ==========================================================
  // START RECOGNITION
  // ==========================================================

  try {

    recognition.start();

  } catch (error) {

    busy = false;

    listening = false;


    console.warn(
      "Speech recognition could not start:",
      error
    );


    if ($("battleMsg")) {

      $("battleMsg").textContent =
        "Could not start the microphone. Please try again.";

      $("battleMsg").className =
        "status error";
    }


    render();
  }
}


// ============================================================
// RETRY
// ============================================================

function retry() {

  const r =
    ensureRound();


  // ==========================================================
  // MUST HAVE PREVIOUS RESULT
  // ==========================================================

  if (
    r.score === null ||
    r.score === undefined
  ) {

    return;
  }


  // ==========================================================
  // MAXIMUM 2 RETRIES
  // ==========================================================

  if (
    r.retries >= MAX_RETRIES
  ) {

    return;
  }


  // ==========================================================
  // INCREASE RETRY COUNT
  // ==========================================================

  r.retries += 1;


  // ==========================================================
  // CLEAR PREVIOUS RESULT
  // ==========================================================

  r.score = null;

  r.recognizedText = "";


  // ==========================================================
  // SAVE STATE
  // ==========================================================

  saveState(state);


  // ==========================================================
  // SHOW MESSAGE
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
  // START MICROPHONE
  // ==========================================================

  setTimeout(() => {

    startSpeech();

  }, 250);
}


// ============================================================
// CONTINUE TO NEXT ROUND
// ============================================================

async function advanceRound() {

  const r =
    currentRoundData();


  // ==========================================================
  // REQUIRE RESULT
  // ==========================================================

  if (
    !r ||
    r.score === null ||
    r.score === undefined
  ) {

    return;
  }


  // ==========================================================
  // MOVE TO NEXT ROUND
  // ==========================================================

  state.currentRound += 1;


  // Save immediately
  saveState(state);


  // ==========================================================
  // FIVE ROUNDS COMPLETED
  // ==========================================================

  if (
    state.currentRound >=
    TOTAL_ROUNDS
  ) {

    await finishBattle();

    return;
  }


  // ========================
