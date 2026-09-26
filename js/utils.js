// ============================================================
// POLYGLOT PRONUNCIATION BATTLE
// utils.js
// ============================================================

const ACTIVE_STATE_KEY = "polyglot_active_team";
const COMPLETED_KEY = "polyglot_completed_competitions";


// ============================================================
// SAVE ACTIVE BATTLE
// ============================================================

export function saveState(state) {

  if (!state) return;

  localStorage.setItem(
    ACTIVE_STATE_KEY,
    JSON.stringify(state)
  );
}


// ============================================================
// LOAD ACTIVE BATTLE
// ============================================================

export function loadState() {

  try {

    const saved =
      localStorage.getItem(
        ACTIVE_STATE_KEY
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);

  } catch (error) {

    console.error(
      "Failed to load state:",
      error
    );

    return null;
  }
}


// ============================================================
// CLEAR ACTIVE BATTLE
// ============================================================

export function clearActiveState() {

  localStorage.removeItem(
    ACTIVE_STATE_KEY
  );
}


// ============================================================
// GET COMPLETED COMPETITIONS
// ============================================================

function getCompletedMap() {

  try {

    const saved =
      localStorage.getItem(
        COMPLETED_KEY
      );

    if (!saved) {
      return {};
    }

    return JSON.parse(saved);

  } catch (error) {

    console.error(
      "Failed to load completed competitions:",
      error
    );

    return {};
  }
}


// ============================================================
// CHECK COMPLETED COMPETITION
// ============================================================

export function isCompetitionCompleted(
  competitionCode
) {

  if (!competitionCode) {
    return false;
  }

  const completed =
    getCompletedMap();

  return (
    completed[competitionCode] === true
  );
}


// ============================================================
// MARK COMPETITION COMPLETED
// ============================================================

export function markCompetitionCompleted(
  competitionCode
) {

  if (!competitionCode) {
    return;
  }

  const completed =
    getCompletedMap();

  completed[competitionCode] = true;

  localStorage.setItem(
    COMPLETED_KEY,
    JSON.stringify(completed)
  );
}


// ============================================================
// TEXT NORMALIZATION
// ============================================================

function normalizeText(text) {

  return String(text || "")
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


// ============================================================
// LEVENSHTEIN DISTANCE
// ============================================================

function levenshtein(a, b) {

  const matrix = [];

  for (
    let i = 0;
    i <= b.length;
    i++
  ) {

    matrix[i] = [i];
  }

  for (
    let j = 0;
    j <= a.length;
    j++
  ) {

    matrix[0][j] = j;
  }

  for (
    let i = 1;
    i <= b.length;
    i++
  ) {

    for (
      let j = 1;
      j <= a.length;
      j++
    ) {

      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {

        matrix[i][j] =
          matrix[i - 1][j - 1];

      } else {

        matrix[i][j] =
          Math.min(

            matrix[i - 1][j] + 1,

            matrix[i][j - 1] + 1,

            matrix[i - 1][j - 1] + 1

          );
      }
    }
  }

  return matrix[b.length][a.length];
}


// ============================================================
// ACCURACY
// ============================================================

export function similarity(
  expected,
  actual
) {

  const original =
    normalizeText(expected);

  const spoken =
    normalizeText(actual);

  if (!original) {
    return 0;
  }

  if (!spoken) {
    return 0;
  }

  const distance =
    levenshtein(
      original,
      spoken
    );

  const maxLength =
    Math.max(
      original.length,
      spoken.length
    );

  if (maxLength === 0) {
    return 100;
  }

  const accuracy =
    (1 - distance / maxLength) *
    100;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(accuracy)
    )
  );
}
