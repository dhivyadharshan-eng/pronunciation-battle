// ============================================================
// POLYGLOT PRONUNCIATION BATTLE
// utils.js
// ============================================================

// ------------------------------------------------------------
// Local Storage Keys
// ------------------------------------------------------------

const ACTIVE_STATE_KEY = "polyglot_active_team";
const COMPLETED_KEY = "polyglot_completed_competitions";

// ------------------------------------------------------------
// ID GENERATOR
// ------------------------------------------------------------

export function createId(prefix = "id") {
  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

  return `${prefix}-${Date.now()}-${randomPart}`;
}

// ------------------------------------------------------------
// COMPETITION CODE GENERATOR
// Example: POLY-AABH94
// ------------------------------------------------------------

export function randomCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code +=
      characters[
        Math.floor(
          Math.random() * characters.length
        )
      ];
  }

  return `POLY-${code}`;
}

// ------------------------------------------------------------
// ACTIVE BATTLE STATE
// ------------------------------------------------------------

export function saveState(state) {
  if (!state) return;

  try {
    localStorage.setItem(
      ACTIVE_STATE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error(
      "Failed to save battle state:",
      error
    );
  }
}

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
      "Failed to load battle state:",
      error
    );

    return null;
  }
}

export function clearActiveState() {
  try {
    localStorage.removeItem(
      ACTIVE_STATE_KEY
    );
  } catch (error) {
    console.error(
      "Failed to clear active state:",
      error
    );
  }
}

// ------------------------------------------------------------
// COMPLETED COMPETITIONS
// ------------------------------------------------------------

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

export function markCompetitionCompleted(
  competitionCode
) {
  if (!competitionCode) {
    return;
  }

  const completed =
    getCompletedMap();

  completed[competitionCode] = true;

  try {
    localStorage.setItem(
      COMPLETED_KEY,
      JSON.stringify(completed)
    );
  } catch (error) {
    console.error(
      "Failed to save completed competition:",
      error
    );
  }
}

// ------------------------------------------------------------
// TEXT NORMALIZATION
// ------------------------------------------------------------

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[.,!?;:'"()\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------------------------------------------
// LEVENSHTEIN DISTANCE
// ------------------------------------------------------------

function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {

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

// ------------------------------------------------------------
// SPEECH ACCURACY
// ------------------------------------------------------------

export function similarity(
  expected,
  actual
) {
  const original =
    normalizeText(expected);

  const spoken =
    normalizeText(actual);

  if (!original || !spoken) {
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
    (1 - distance / maxLength) * 100;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(accuracy)
    )
  );
}

// ------------------------------------------------------------
// LEADERBOARD SORTING
// ------------------------------------------------------------

export function stableCompare(a, b) {

  const scoreA =
    Number(a?.finalScore ?? 0);

  const scoreB =
    Number(b?.finalScore ?? 0);

  // Higher score first
  if (scoreA !== scoreB) {
    return scoreB - scoreA;
  }

  // If scores are equal,
  // earlier completion time comes first
  const timeA =
    Number(a?.completedAt ?? Infinity);

  const timeB =
    Number(b?.completedAt ?? Infinity);

  if (timeA !== timeB) {
    return timeA - timeB;
  }

  // Final deterministic tie-breaker
  const nameA =
    String(a?.teamName || "").toLowerCase();

  const nameB =
    String(b?.teamName || "").toLowerCase();

  return nameA.localeCompare(nameB);
}

// ------------------------------------------------------------
// HTML ESCAPING
// Prevents team names / text from being interpreted as HTML
// ------------------------------------------------------------

export function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
