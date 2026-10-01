// ============================================================
// POLYGLOT PRONUNCIATION BATTLE
// utils.js
// ============================================================

const ACTIVE_STATE_KEY = "polyglot_active_team";
const COMPLETED_KEY = "polyglot_completed_competitions";


// ============================================================
// CREATE UNIQUE ID
// ============================================================

export function createId(prefix = "id") {
  const random =
    Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

  return `${prefix}-${Date.now()}-${random}`;
}


// ============================================================
// CREATE COMPETITION CODE
// Example: POLY-A7K92B
// ============================================================

export function randomCode() {

  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < 6; i++) {

    code +=
      characters[
        Math.floor(
          Math.random() *
          characters.length
        )
      ];
  }

  return `POLY-${code}`;
}


// ============================================================
// SAVE ACTIVE BATTLE
// ============================================================

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


// ============================================================
// LOAD ACTIVE BATTLE
// ============================================================

export function loadState() {

  try {

    const saved =
      localStorage.getItem(
        ACTIVE_STATE_KEY
      );

    if (!saved) return null;

    return JSON.parse(saved);

  } catch (error) {

    console.error(
      "Failed to load battle state:",
      error
    );

    return null;
  }
}


// ============================================================
// CLEAR ACTIVE BATTLE
// ============================================================

export function clearActiveState() {

  try {

    localStorage.removeItem(
      ACTIVE_STATE_KEY
    );

  } catch (error) {

    console.error(
      "Failed to clear active battle:",
      error
    );
  }
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

    if (!saved) return {};

    const parsed =
      JSON.parse(saved);

    return (
      parsed &&
      typeof parsed === "object"
    )
      ? parsed
      : {};

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

  const code =
    String(
      competitionCode
    )
      .trim()
      .toUpperCase();

  const completed =
    getCompletedMap();

  return (
    completed[code] === true
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

  const code =
    String(
      competitionCode
    )
      .trim()
      .toUpperCase();

  const completed =
    getCompletedMap();

  completed[code] = true;

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


// ============================================================
// TEXT NORMALIZATION
// ============================================================

function normalizeText(text) {

  return String(text || "")
    .toLowerCase()
    .replace(
      /[.,!?;:'"()\-]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    )
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
// SPEECH ACCURACY
// ============================================================

export function similarity(
  expected,
  actual
) {

  const original =
    normalizeText(expected);

  const spoken =
    normalizeText(actual);

  if (
    !original ||
    !spoken
  ) {

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
    (
      1 -
      distance / maxLength
    ) * 100;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(accuracy)
    )
  );
}


// ============================================================
// LEADERBOARD SORTING
// ============================================================

export function stableCompare(
  a,
  b
) {

  const scoreA =
    Number(
      a?.finalScore ?? 0
    );

  const scoreB =
    Number(
      b?.finalScore ?? 0
    );


  // Higher score first

  if (
    scoreA !== scoreB
  ) {

    return scoreB - scoreA;
  }


  // Earlier completion first

  const timeA =
    Number(
      a?.completedAt ??
      Infinity
    );

  const timeB =
    Number(
      b?.completedAt ??
      Infinity
    );

  if (
    timeA !== timeB
  ) {

    return timeA - timeB;
  }


  // Alphabetical team-name tie breaker

  const nameA =
    String(
      a?.teamName || ""
    ).toLowerCase();

  const nameB =
    String(
      b?.teamName || ""
    ).toLowerCase();

  return nameA.localeCompare(
    nameB
  );
}


// ============================================================
// HTML ESCAPING
// ============================================================

export function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}
