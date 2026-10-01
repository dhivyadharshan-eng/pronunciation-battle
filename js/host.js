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
// HELPER
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// HOST STATE
// ============================================================

let activeCode =
  localStorage.getItem("pbHostCompetition") || "";

let unsubscribe = null;


// ============================================================
// CURRENT TEAMS
// ============================================================

let currentTeams = [];


// ============================================================
// SHOW DASHBOARD
// ============================================================

function showDashboard() {

  $("loginCard").hidden = true;

  $("dashboard").hidden = false;

  $("logoutBtn").hidden = false;

  if (activeCode) {
    loadCompetition(activeCode);
  }
}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

  $("loginCard").hidden = false;

  $("dashboard").hidden = true;

  $("logoutBtn").hidden = true;
}


// ============================================================
// HOST LOGIN
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
        "Please enter your email and password.";

      $("loginMsg").className =
        "status error";

      return;
    }

    $("loginMsg").textContent =
      "Signing in…";

    $("loginMsg").className =
      "status";

    try {

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      $("loginMsg").textContent = "";

    } catch (error) {

      console.error(
        "Host login error:",
        error
      );

      $("loginMsg").textContent =
        getAuthErrorMessage(error);

      $("loginMsg").className =
        "status error";
    }
  }
);


// ============================================================
// FIREBASE AUTH ERROR MESSAGE
// ============================================================

function getAuthErrorMessage(error) {

  switch (error?.code) {

    case "auth/invalid-credential":
      return "Invalid email or password.";

    case "auth/user-not-found":
      return "No host account was found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/too-many-requests":
      return "Too many login attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    default:
      return (
        error?.message ||
        "Host login failed. Please try again."
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

      await signOut(auth);

      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      currentTeams = [];

    } catch (error) {

      console.error(
        "Logout error:",
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

    const user =
      auth.currentUser;

    if (!user) {

      alert(
        "Please sign in again."
      );

      return;
    }

    try {

      $("createBtn").disabled = true;

      $("createBtn").textContent =
        "Creating…";

      const code =
        randomCode();

      const competition = {

        code: code,

        active: true,

        createdAt:
          Date.now(),

        createdBy:
          user.uid,

        teams: {}
      };

      await set(
        ref(
          database,
          `competitions/${code}`
        ),
        competition
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
        "Competition creation error:",
        error
      );

      alert(
        error?.message ||
        "Unable to create competition."
      );

    } finally {

      $("createBtn").disabled =
        false;

      $("createBtn").textContent =
        "Create Competition";
    }
  }
);


// ============================================================
// REFRESH
// ============================================================

$("refreshBtn").addEventListener(
  "click",
  () => {

    if (!activeCode) {
      return;
    }

    loadCompetition(
      activeCode
    );
  }
);


// ============================================================
// LOAD COMPETITION
// ============================================================

function loadCompetition(code) {

  if (!code) {
    return;
  }

  if (unsubscribe) {

    unsubscribe();

    unsubscribe = null;
  }

  $("code").textContent =
    code;

  $("activeCode").textContent =
    `Competition: ${code}`;


  // ----------------------------------------------------------
  // Registration URL
  // ----------------------------------------------------------

  const registrationUrl =
    `${location.origin}${location.pathname.replace(
      /host\.html$/,
      "index1.html"
    )}?code=${encodeURIComponent(code)}`;


  // ----------------------------------------------------------
  // QR CODE
  // ----------------------------------------------------------

const joinUrl = new URL("index.html", window.location.href);
joinUrl.searchParams.set("code", code);

const qrUrl = joinUrl.href;

$("qr").src =
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`;

  // ----------------------------------------------------------
  // REAL-TIME TEAM LISTENER
  // ----------------------------------------------------------

  unsubscribe =
    onValue(
      ref(
        database,
        `competitions/${code}/teams`
      ),
      (snapshot) => {

        const teams =
          snapshot.exists()
            ? snapshot.val()
            : {};

        render(
          teams
        );
      },
      (error) => {

        console.error(
          "Competition listener error:",
          error
        );

        currentTeams = [];

        $("leaderboard").innerHTML =
          `<tr>
            <td colspan="9" class="empty">
              Unable to load teams.
            </td>
          </tr>`;
      }
    );
}


// ============================================================
// RENDER DASHBOARD
// ============================================================

function render(rawTeams) {

  const teams =
    Object.values(
      rawTeams || {}
    ).sort(
      stableCompare
    );

  // Save current teams for CSV export
  currentTeams = teams;


  // ----------------------------------------------------------
  // STATISTICS
  // ----------------------------------------------------------

  const completed =
    teams.filter(
      team =>
        team?.status ===
        "completed"
    ).length;

  const inBattle =
    teams.filter(
      team =>
        team?.status ===
        "in-battle"
    ).length;

  const registered =
    teams.filter(
      team =>
        team?.status ===
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


  // ----------------------------------------------------------
  // EXPORT BUTTON STATUS
  // ----------------------------------------------------------

  updateExportButton(
    teams
  );


  // ----------------------------------------------------------
  // EMPTY LEADERBOARD
  // ----------------------------------------------------------

  if (!teams.length) {

    $("leaderboard").innerHTML =
      `<tr>
        <td colspan="9" class="empty">
          Waiting for teams…
        </td>
      </tr>`;

    return;
  }


  // ----------------------------------------------------------
  // LEADERBOARD
  // ----------------------------------------------------------

  $("leaderboard").innerHTML =
    teams
      .map(
        (team, index) => {

          const currentRound =
            Math.min(
              Number(
                team?.currentRound || 0
              ) +
              (
                team?.status ===
                "completed"
                  ? 0
                  : 1
              ),
              5
            );


          const score =
            team?.finalScore == null
              ? "—"
              : Number(
                  team.finalScore
                ).toFixed(0);


          const retries =
            Number(
              team?.retriesUsed || 0
            );


          const teamName =
            escapeHtml(
              team?.teamName ||
              "Unnamed Team"
            );


          const teamId =
            escapeHtml(
              String(
                team?.teamId ||
                ""
              ).slice(-8)
            );


          const status =
            escapeHtml(
              team?.status ||
              "unknown"
            );


          return `
            <tr>

              <td>
                ${index + 1}
              </td>

              <td>
                <strong>
                  ${teamName}
                </strong>

                <small>
                  ${teamId}
                </small>
              </td>

              <td>
                <span
                  class="status-chip ${status}"
                >
                  ${status}
                </span>
              </td>

              <td>
                ${currentRound}/5
              </td>

              <td>
                ${retries}
              </td>

              <td>
                ${score}
              </td>

              <td>
                ${escapeHtml(
                  team?.member1 || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  team?.member2 || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  team?.member3 || "—"
                )}
              </td>

            </tr>
          `;
        }
      )
      .join("");
}


// ============================================================
// EXPORT BUTTON STATUS
// ============================================================

function updateExportButton(
  teams
) {

  const button =
    $("downloadCsvBtn");

  if (!button) {
    return;
  }

  if (!teams.length) {

    button.disabled = true;

    button.textContent =
      "📥 Download Leaderboard";

    return;
  }


  const allCompleted =
    teams.every(
      team =>
        team?.status ===
        "completed"
    );


  if (allCompleted) {

    button.disabled =
      false;

    button.textContent =
      "📥 Download Leaderboard CSV";

  } else {

    button.disabled =
      true;

    button.textContent =
      "🔒 Complete All Teams First";
  }
}


// ============================================================
// CSV ESCAPE
// ============================================================

function csvEscape(value) {

  const text =
    String(
      value ?? ""
    );

  return `"${text
    .replace(/"/g, '""')}"`;
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(timestamp) {

  if (!timestamp) {
    return "—";
  }

  const date =
    new Date(
      Number(timestamp)
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "medium"
    }
  );
}


// ============================================================
// DOWNLOAD LEADERBOARD CSV
// ============================================================

function downloadLeaderboardCSV() {

  if (!currentTeams.length) {

    alert(
      "There are no teams to export."
    );

    return;
  }


  // ----------------------------------------------------------
  // Make sure every team is completed
  // ----------------------------------------------------------

  const allCompleted =
    currentTeams.every(
      team =>
        team?.status ===
        "completed"
    );


  if (!allCompleted) {

    alert(
      "Please wait until all teams have completed the competition."
    );

    return;
  }


  // ----------------------------------------------------------
  // CSV HEADER
  // ----------------------------------------------------------

  const rows = [

    [
      "Position",
      "Team Name",
      "Member 1",
      "Member 2",
      "Member 3",
      "Status",
      "Rounds",
      "Retries",
      "Final Score",
      "Completed Time"
    ]

  ];


  // ----------------------------------------------------------
  // CSV DATA
  // ----------------------------------------------------------

  currentTeams.forEach(
    (team, index) => {

      rows.push([

        index + 1,

        team?.teamName ||
          "",

        team?.member1 ||
          "",

        team?.member2 ||
          "",

        team?.member3 ||
          "",

        team?.status ||
          "",

        "5/5",

        Number(
          team?.retriesUsed || 0
        ),

        team?.finalScore == null
          ? ""
          : Number(
              team.finalScore
            ).toFixed(0),

        formatDate(
          team?.completedAt
        )

      ]);
    }
  );


  // ----------------------------------------------------------
  // CREATE CSV
  // ----------------------------------------------------------

  const csv =
    rows
      .map(
        row =>
          row
            .map(csvEscape)
            .join(",")
      )
      .join("\r\n");


  // ----------------------------------------------------------
  // UTF-8 BOM
  // Helps Excel display the file correctly
  // ----------------------------------------------------------

  const blob =
    new Blob(
      [
        "\uFEFF" +
        csv
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  // ----------------------------------------------------------
  // FILE NAME
  // ----------------------------------------------------------

  const safeCode =
    String(
      activeCode ||
      "competition"
    )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        "_"
      );


  const fileName =
    `Polyglot_Leaderboard_${safeCode}.csv`;


  // ----------------------------------------------------------
  // DOWNLOAD
  // ----------------------------------------------------------

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
    fileName;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );
}


// ============================================================
// DOWNLOAD BUTTON
// ============================================================

$("downloadCsvBtn").addEventListener(
  "click",
  downloadLeaderboardCSV
);


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,
  (user) => {

    if (user) {

      console.log(
        "Host authenticated:",
        user.uid
      );

      showDashboard();

    } else {

      showLogin();
    }
  }
);
