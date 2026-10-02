// ============================================================
// POLYGLOT PRONUNCIATION BATTLE
// host.js
// ============================================================

import {
  database,
  auth,
  ref,
  set,
  onValue,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "../firebase.js";

import {
  randomCode,
  stableCompare,
  escapeHtml
} from "./utils.js";


// ============================================================
// HELPERS
// ============================================================

const $ = (id) =>
  document.getElementById(id);


// ============================================================
// STATE
// ============================================================

let activeCode =
  localStorage.getItem(
    "pbHostCompetition"
  ) || "";

let unsubscribe =
  null;

let currentTeams = {};


// ============================================================
// SECURITY UI
// ============================================================

function showLogin() {

  document.body.classList.remove(
    "host-loading"
  );


  $("loginCard").style.display =
    "block";


  $("dashboard").style.display =
    "none";


  $("logoutBtn").style.display =
    "none";


  if ($("createBtn")) {

    $("createBtn").disabled =
      true;

  }


  if ($("refreshBtn")) {

    $("refreshBtn").disabled =
      true;

  }


  if ($("downloadBtn")) {

    $("downloadBtn").disabled =
      true;

  }

}


function showDashboard() {

  document.body.classList.remove(
    "host-loading"
  );


  $("loginCard").style.display =
    "none";


  $("dashboard").style.display =
    "block";


  $("logoutBtn").style.display =
    "inline-block";


  if ($("createBtn")) {

    $("createBtn").disabled =
      false;

  }


  if ($("refreshBtn")) {

    $("refreshBtn").disabled =
      false;

  }


  if (activeCode) {

    loadCompetition(
      activeCode
    );

  }

}


// ============================================================
// LOGIN
// ============================================================

$("loginForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    if (!email || !password) {

      $("loginMsg").textContent =
        "Enter the host email and password.";

      $("loginMsg").className =
        "status error";

      return;

    }


    const loginButton =
      $("loginBtn");


    loginButton.disabled =
      true;


    loginButton.textContent =
      "Signing in…";


    $("loginMsg").textContent =
      "Authenticating…";

    $("loginMsg").className =
      "status";


    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


      /*
        IMPORTANT:

        Do NOT manually show the dashboard here.

        onAuthStateChanged() will do it only after
        Firebase confirms the authenticated user.
      */

      $("loginMsg").textContent =
        "";

    } catch (error) {

      console.error(
        "Host login failed:",
        error
      );


      $("loginMsg").textContent =
        getAuthErrorMessage(
          error
        );

      $("loginMsg").className =
        "status error";


      loginButton.disabled =
        false;


      loginButton.textContent =
        "Sign in";

    }

  }
);


// ============================================================
// FIREBASE AUTH ERROR MESSAGE
// ============================================================

function getAuthErrorMessage(
  error
) {

  switch (error?.code) {

    case "auth/invalid-credential":

      return "Incorrect host email or password.";

    case "auth/invalid-login-credentials":

      return "Incorrect host email or password.";

    case "auth/user-not-found":

      return "Incorrect host email or password.";

    case "auth/wrong-password":

      return "Incorrect host email or password.";

    case "auth/invalid-email":

      return "Please enter a valid email address.";

    case "auth/too-many-requests":

      return "Too many login attempts. Please try again later.";

    case "auth/user-disabled":

      return "This host account has been disabled.";

    default:

      return (
        error?.message ||
        "Host login failed."
      );

  }

}


// ============================================================
// LOGOUT
// ============================================================

$("logoutBtn").addEventListener(
  "click",
  async () => {

    try {

      if (unsubscribe) {

        unsubscribe();

        unsubscribe =
          null;

      }


      currentTeams =
        {};


      activeCode =
        "";


      localStorage.removeItem(
        "pbHostCompetition"
      );


      await signOut(auth);


    } catch (error) {

      console.error(
        "Logout failed:",
        error
      );

    }

  }
);


// ============================================================
// CREATE COMPETITION
// ============================================================

$("createBtn").addEventListener(
  "click",
  async () => {

    /*
      Extra security check.

      Even if somebody somehow triggers this function,
      Firebase must have an authenticated user.
    */

    const user =
      auth.currentUser;


    if (!user) {

      showLogin();

      return;

    }


    try {

      $("createBtn").disabled =
        true;


      const code =
        randomCode();


      await set(

        ref(
          database,
          `competitions/${code}`
        ),

        {

          code,

          active: true,

          createdAt:
            Date.now(),

          createdBy:
            user.uid,

          teams: {}

        }

      );


      activeCode =
        code;


      localStorage.setItem(
        "pbHostCompetition",
        code
      );


      loadCompetition(
        code
      );


    } catch (error) {

      console.error(
        "Create competition failed:",
        error
      );


      alert(
        error.message
      );


    } finally {

      $("createBtn").disabled =
        false;

    }

  }
);


// ============================================================
// REFRESH
// ============================================================

$("refreshBtn").addEventListener(
  "click",
  () => {

    if (!auth.currentUser) {

      showLogin();

      return;

    }


    if (activeCode) {

      loadCompetition(
        activeCode
      );

    }

  }
);


// ============================================================
// LOAD COMPETITION
// ============================================================

function loadCompetition(
  code
) {

  if (!auth.currentUser) {

    showLogin();

    return;

  }


  if (!code) {

    return;

  }


  if (unsubscribe) {

    unsubscribe();

    unsubscribe =
      null;

  }


  $("code").textContent =
    code;


  $("activeCode").textContent =
    `Competition: ${code}`;


  // ==========================================================
  // CREATE QR URL
  // ==========================================================

  const joinUrl =
    new URL(
      "index.html",
      window.location.href
    );


  joinUrl.searchParams.set(
    "code",
    code
  );


  const qrUrl =
    joinUrl.href;


  $("qr").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`;


  // ==========================================================
  // FIREBASE LISTENER
  // ==========================================================

  unsubscribe =
    onValue(

      ref(
        database,
        `competitions/${code}/teams`
      ),

      (snapshot) => {

        /*
          If authentication disappeared while the listener
          is active, immediately hide the dashboard.
        */

        if (!auth.currentUser) {

          showLogin();

          return;

        }


        const raw =
          snapshot.val() || {};


        render(
          raw
        );

      },

      (error) => {

        console.error(
          "Competition listener failed:",
          error
        );

        $("loginMsg").textContent =
          "Unable to access this competition.";

      }

    );

}


// ============================================================
// RENDER LEADERBOARD
// ============================================================

function render(
  raw
) {

  currentTeams =
    raw || {};


  const teams =
    Object.values(
      currentTeams
    ).sort(
      stableCompare
    );


  const completed =
    teams.filter(
      team =>
        team.status ===
        "completed"
    ).length;


  const inBattle =
    teams.filter(
      team =>
        team.status ===
        "in-battle"
    ).length;


  const registered =
    teams.filter(
      team =>
        team.status ===
        "registered"
    ).length;


  $("total").textContent =
    teams.length;


  $("completed").textContent =
    completed;


  $("inBattle").textContent =
    inBattle;


  $("registered").textContent =
    registered;


  // ==========================================================
  // ENABLE CSV ONLY WHEN EVERY TEAM HAS COMPLETED
  // ==========================================================

  const allCompleted =
    teams.length > 0 &&
    teams.every(
      team =>
        team.status ===
        "completed"
    );


  $("downloadBtn").disabled =
    !allCompleted;


  // ==========================================================
  // TABLE
  // ==========================================================

  if (teams.length === 0) {

    $("leaderboard").innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty"
        >
          Waiting for teams…
        </td>
      </tr>
    `;

    return;

  }


  $("leaderboard").innerHTML =
    teams.map(
      (team, index) => {

        const round =
          Math.min(
            Number(
              team.currentRound || 0
            ) +
            (
              team.status ===
              "completed"
                ? 0
                : 1
            ),
            5
          );


        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              <strong>
                ${escapeHtml(
                  team.teamName ||
                  "Team"
                )}
              </strong>

              <small>
                ${escapeHtml(
                  String(
                    team.teamId ||
                    ""
                  ).slice(-8)
                )}
              </small>
            </td>

            <td>
              <span
                class="status-chip ${escapeHtml(
                  team.status ||
                  ""
                )}"
              >
                ${escapeHtml(
                  team.status ||
                  "unknown"
                )}
              </span>
            </td>

            <td>
              ${round}/5
            </td>

            <td>
              ${Number(
                team.retriesUsed ||
                0
              )}
            </td>

            <td>
              ${
                team.finalScore == null
                  ? "—"
                  : Number(
                      team.finalScore
                    ).toFixed(0)
              }
            </td>

          </tr>
        `;

      }
    ).join("");

}


// ============================================================
// CSV ESCAPE
// ============================================================

function csvEscape(
  value
) {

  const text =
    String(
      value ?? ""
    );


  return `"${text.replace(
    /"/g,
    '""'
  )}"`;

}


// ============================================================
// DOWNLOAD CSV
// ============================================================

$("downloadBtn").addEventListener(
  "click",
  () => {

    /*
      Never allow the download if the host is logged out.
    */

    if (!auth.currentUser) {

      showLogin();

      return;

    }


    const teams =
      Object.values(
        currentTeams
      ).sort(
        stableCompare
      );


    if (
      teams.length === 0 ||
      !teams.every(
        team =>
          team.status ===
          "completed"
      )
    ) {

      alert(
        "The leaderboard can be downloaded after all teams complete the competition."
      );

      return;

    }


    const rows = [];


    rows.push([
      "Rank",
      "Team",
      "Team ID",
      "Status",
      "Round",
      "Retries",
      "Score",
      "Completed At"
    ]);


    teams.forEach(
      (team, index) => {

        rows.push([

          index + 1,

          team.teamName ||
            "",

          team.teamId ||
            "",

          team.status ||
            "",

          "5/5",

          Number(
            team.retriesUsed ||
            0
          ),

          team.finalScore == null
            ? ""
            : Number(
                team.finalScore
              ),

          team.completedAt
            ? new Date(
                team.completedAt
              ).toLocaleString()
            : ""

        ]);

      }
    );


    const csv =
      rows
        .map(
          row =>
            row
              .map(csvEscape)
              .join(",")
        )
        .join("\r\n");


    /*
      UTF-8 BOM helps Excel correctly recognize
      the CSV file.
    */

    const blob =
      new Blob(
        [
          "\uFEFF",
          csv
        ],
        {
          type:
            "text/csv;charset=utf-8;"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      `polyglot-${activeCode}-leaderboard.csv`;


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      url
    );

  }
);


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,
  (user) => {

    console.log(
      "Host authentication state:",
      user
        ? `Authenticated: ${user.email || user.uid}`
        : "Not authenticated"
    );


    if (user) {

      /*
        Firebase has confirmed authentication.
        Only NOW do we show the dashboard.
      */

      showDashboard();


    } else {

      /*
        No Firebase user.
        Dashboard must remain inaccessible.
      */

      if (unsubscribe) {

        unsubscribe();

        unsubscribe =
          null;

      }


      currentTeams =
        {};


      showLogin();

    }


    // Re-enable login button when auth state settles

    if ($("loginBtn")) {

      $("loginBtn").disabled =
        false;

      $("loginBtn").textContent =
        "Sign in";

    }

  }
);
