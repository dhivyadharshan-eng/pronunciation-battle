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


const HOST_UID = "DwoaP98ueUd4LkNnyF1pjp6Z40e2";

const $ = (id) => document.getElementById(id);

let activeCode =
  localStorage.getItem("pbHostCompetition") || "";

let unsubscribe = null;

let currentTeams = {};


/* =========================================================
   UI
   ========================================================= */

function showDashboard() {

  if (!$("loginCard") || !$("dashboard")) {
    return;
  }

  $("loginCard").hidden = true;
  $("dashboard").hidden = false;

  if ($("logoutBtn")) {
    $("logoutBtn").hidden = false;
  }

  if (activeCode) {
    loadCompetition(activeCode);
  }
}


function showLogin() {

  if (!$("loginCard") || !$("dashboard")) {
    return;
  }

  $("loginCard").hidden = false;
  $("dashboard").hidden = true;

  if ($("logoutBtn")) {
    $("logoutBtn").hidden = true;
  }
}


/* =========================================================
   LOGIN
   ========================================================= */

if ($("loginForm")) {

  $("loginForm").addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        $("email")?.value.trim() || "";

      const password =
        $("password")?.value || "";

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
          "Host login failed:",
          error
        );

        $("loginMsg").textContent =
          error.message;

        $("loginMsg").className =
          "status error";
      }

    }
  );

}


/* =========================================================
   LOGOUT
   ========================================================= */

if ($("logoutBtn")) {

  $("logoutBtn").addEventListener(
    "click",
    async () => {

      try {

        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        await signOut(auth);

        activeCode = "";

        currentTeams = {};

        localStorage.removeItem(
          "pbHostCompetition"
        );

      } catch (error) {

        console.error(
          "Logout failed:",
          error
        );

      }

    }
  );

}


/* =========================================================
   CREATE COMPETITION
   ========================================================= */

if ($("createBtn")) {

  $("createBtn").addEventListener(
    "click",
    async () => {

      try {

        const user = auth.currentUser;


        if (!user) {

          throw new Error(
            "Please sign in as the host first."
          );

        }


        if (user.uid !== HOST_UID) {

          throw new Error(
            "This account is not authorized as the host."
          );

        }


        const code = randomCode();


        await set(
          ref(
            database,
            `competitions/${code}`
          ),
          {
            code,
            active: true,
            createdAt: Date.now(),
            createdBy: user.uid,
            teams: {}
          }
        );


        activeCode = code;

        localStorage.setItem(
          "pbHostCompetition",
          code
        );


        loadCompetition(code);


      } catch (error) {

        console.error(
          "Create competition failed:",
          error
        );

        alert(error.message);
      }

    }
  );

}


/* =========================================================
   REFRESH
   ========================================================= */

if ($("refreshBtn")) {

  $("refreshBtn").addEventListener(
    "click",
    () => {

      if (activeCode) {
        loadCompetition(activeCode);
      }

    }
  );

}


/* =========================================================
   LOAD COMPETITION
   ========================================================= */

function loadCompetition(code) {

  if (!code) {
    return;
  }


  if (unsubscribe) {

    unsubscribe();
    unsubscribe = null;

  }


  if ($("code")) {
    $("code").textContent = code;
  }


  if ($("activeCode")) {

    $("activeCode").textContent =
      `Competition: ${code}`;

  }


  /*
   * Build the participant URL correctly
   * even when the site is hosted inside
   * a GitHub Pages project folder.
   */

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


  if ($("qr")) {

    $("qr").src =
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`;

  }


  unsubscribe =
    onValue(
      ref(
        database,
        `competitions/${code}/teams`
      ),
      (snapshot) => {

        render(
          snapshot.val() || {}
        );

      },
      (error) => {

        console.error(
          "Leaderboard listener failed:",
          error
        );

      }
    );

}


/* =========================================================
   RENDER LEADERBOARD
   ========================================================= */

function render(raw) {

  currentTeams =
    raw || {};


  const teams =
    Object.values(currentTeams)
      .sort(stableCompare);


  const completed =
    teams.filter(
      (team) =>
        team.status === "completed"
    ).length;


  const inBattle =
    teams.filter(
      (team) =>
        team.status === "in-battle"
    ).length;


  const registered =
    teams.filter(
      (team) =>
        team.status === "registered"
    ).length;


  if ($("total")) {
    $("total").textContent =
      teams.length;
  }


  if ($("completed")) {
    $("completed").textContent =
      completed;
  }


  if ($("inBattle")) {
    $("inBattle").textContent =
      inBattle;
  }


  if ($("registered")) {
    $("registered").textContent =
      registered;
  }


  /*
   * Enable CSV download only when
   * every registered team has completed.
   */

  const allCompleted =
    teams.length > 0 &&
    teams.every(
      (team) =>
        team.status === "completed"
    );


  if ($("downloadBtn")) {

    $("downloadBtn").disabled =
      !allCompleted;

  }


  if (!teams.length) {

    if ($("leaderboard")) {

      $("leaderboard").innerHTML = `
        <tr>
          <td
            colspan="8"
            class="empty"
          >
            Waiting for teams…
          </td>
        </tr>
      `;

    }

    return;
  }


  if (!$("leaderboard")) {
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
              team.status === "completed"
                ? 0
                : 1
            ),
            5
          );


        const member1 =
          team.member1 || "—";

        const member2 =
          team.member2 || "—";

        const member3 =
          team.member3 || "—";


        const completedAt =
          team.completedAt
            ? new Date(
                team.completedAt
              ).toLocaleString()
            : "—";


        return `
          <tr>

            <td class="rank-cell">
              ${index + 1}
            </td>


            <td class="team-cell">

              <strong>
                ${escapeHtml(
                  team.teamName || "Team"
                )}
              </strong>

              <small>
                ${escapeHtml(
                  String(
                    team.teamId || ""
                  ).slice(-8)
                )}
              </small>

            </td>


            <td class="members-cell">

              <span>
                ${escapeHtml(member1)}
              </span>

              <span>
                ${escapeHtml(member2)}
              </span>

              <span>
                ${escapeHtml(member3)}
              </span>

            </td>


            <td>

              <span
                class="status-chip ${escapeHtml(
                  team.status || ""
                )}"
              >
                ${escapeHtml(
                  team.status || "unknown"
                )}
              </span>

            </td>


            <td class="center-cell">
              ${round}/5
            </td>


            <td class="center-cell">
              ${Number(
                team.retriesUsed || 0
              )}
            </td>


            <td class="score-cell">

              ${
                team.finalScore == null
                  ? "—"
                  : Number(
                      team.finalScore
                    ).toFixed(0)
              }

            </td>


            <td class="completed-cell">
              ${escapeHtml(
                completedAt
              )}
            </td>

          </tr>
        `;

      }
    ).join("");

}


/* =========================================================
   DOWNLOAD CSV
   ========================================================= */

if ($("downloadBtn")) {

  $("downloadBtn").addEventListener(
    "click",
    () => {

      const teams =
        Object.values(currentTeams)
          .sort(stableCompare);


      if (!teams.length) {

        alert(
          "There are no teams to download."
        );

        return;
      }


      const allCompleted =
        teams.every(
          (team) =>
            team.status === "completed"
        );


      if (!allCompleted) {

        alert(
          "The leaderboard can be downloaded after all teams complete."
        );

        return;
      }


      const rows = [
        [
          "Rank",
          "Team",
          "Team ID",
          "Status",
          "Round",
          "Retries",
          "Score",
          "Completed At"
        ]
      ];


      teams.forEach(
        (team, index) => {

          rows.push([
            index + 1,
            team.teamName || "",
            team.teamId || "",
            team.status || "",
            `${Math.min(
              Number(
                team.currentRound || 0
              ),
              5
            )}/5`,
            Number(
              team.retriesUsed || 0
            ),
            team.finalScore == null
              ? ""
              : Number(
                  team.finalScore
                ).toFixed(0),
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
            (row) =>
              row
                .map(csvEscape)
                .join(",")
          )
          .join("\n");


      const blob =
        new Blob(
          [
            "\uFEFF" + csv
          ],
          {
            type:
              "text/csv;charset=utf-8;"
          }
        );


      const url =
        URL.createObjectURL(blob);


      const link =
        document.createElement("a");


      link.href = url;

      link.download =
        `polyglot-${activeCode}-leaderboard.csv`;


      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(url);

    }
  );

}


/* =========================================================
   CSV ESCAPING
   ========================================================= */

function csvEscape(value) {

  const text =
    String(value ?? "");


  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;

  }


  return text;
}


/* =========================================================
   FIREBASE AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  (user) => {

    console.log(
      "Host auth state:",
      user
        ? {
            uid: user.uid,
            email: user.email
          }
        : null
    );


    if (!user) {

      showLogin();

      return;
    }


    /*
     * Only your Firebase UID is allowed
     * to use the host dashboard.
     */

    if (user.uid !== HOST_UID) {

      console.warn(
        "Unauthorized host account:",
        user.uid
      );


      signOut(auth);

      if ($("loginMsg")) {

        $("loginMsg").textContent =
          "This account is not authorized to access the host dashboard.";

        $("loginMsg").className =
          "status error";

      }


      showLogin();

      return;
    }


    showDashboard();

  }
);
