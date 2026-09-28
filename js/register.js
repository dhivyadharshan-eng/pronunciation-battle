// ============================================================
// POLYGLOT PRONUNCIATION BATTLE
// register.js
// ============================================================

import {
  database,
  ref,
  get,
  set,
  ensureAnonymousAuth
} from "../firebase.js";

import {
  createId,
  saveState,
  isCompetitionCompleted
} from "./utils.js";


// ============================================================
// DOM ELEMENTS
// ============================================================

const form =
  document.getElementById("registerForm");

const msg =
  document.getElementById("registerMsg");

const codeInput =
  document.getElementById("competitionCode");


// ============================================================
// READ COMPETITION CODE FROM QR URL
// Example:
// ?code=POLY-ABC123
// ============================================================

const qsCode =
  new URLSearchParams(
    location.search
  ).get("code");

if (qsCode) {

  codeInput.value =
    qsCode
      .trim()
      .toUpperCase();
}


// ============================================================
// IMPORTANT
// ============================================================
//
// DO NOT check:
//
// const existing = loadState();
// if (existing?.completed) ...
//
// That would lock the whole browser.
//
// Completion is checked using:
// competitionCode + anonymous Firebase UID
//
// Therefore:
//
// Same browser + Competition A  → blocked after completion
// Same browser + Competition B  → allowed
//
// ============================================================


// ============================================================
// MESSAGE HELPER
// ============================================================

function showMessage(
  text,
  type = "status"
) {

  msg.textContent = text;
  msg.className = type;
}


// ============================================================
// SUBMIT REGISTRATION
// ============================================================

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    // ----------------------------------------------------------
    // BASIC UI
    // ----------------------------------------------------------

    showMessage(
      "Connecting to competition…",
      "status"
    );


    // ----------------------------------------------------------
    // GET FORM VALUES
    // ----------------------------------------------------------

    const code =
      codeInput.value
        .trim()
        .toUpperCase();


    const teamName =
      document
        .getElementById("teamName")
        .value
        .trim();


    const members = [
      document
        .getElementById("member1")
        .value
        .trim(),

      document
        .getElementById("member2")
        .value
        .trim(),

      document
        .getElementById("member3")
        .value
        .trim()
    ];


    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------

    if (!code) {

      showMessage(
        "Please enter the competition code.",
        "status error"
      );

      return;
    }


    if (!teamName) {

      showMessage(
        "Please enter the team name.",
        "status error"
      );

      return;
    }


    if (
      members.some(
        member => !member
      )
    ) {

      showMessage(
        "Please enter all three member names.",
        "status error"
      );

      return;
    }


    try {

      // ========================================================
      // FIREBASE ANONYMOUS AUTH
      // ========================================================

      const user =
        await ensureAnonymousAuth();


      if (!user || !user.uid) {

        throw new Error(
          "Unable to identify this browser. Please refresh and try again."
        );
      }


      // ========================================================
      // CHECK LOCAL COMPLETION
      // ========================================================
      //
      // IMPORTANT:
      // This checks ONLY the entered competition code.
      //
      // It does NOT block another competition.
      //
      // ========================================================

      if (
        isCompetitionCompleted(code)
      ) {

        showMessage(
          "This device has already completed this competition.",
          "status error"
        );

        return;
      }


      // ========================================================
      // CHECK COMPETITION
      // ========================================================

      const competitionRef =
        ref(
          database,
          `competitions/${code}`
        );


      const competitionSnap =
        await get(competitionRef);


      if (
        !competitionSnap.exists()
      ) {

        throw new Error(
          "Invalid competition code."
        );
      }


      const competition =
        competitionSnap.val();


      if (
        competition?.active !== true
      ) {

        throw new Error(
          "This competition is inactive."
        );
      }


      // ========================================================
      // CHECK EXISTING TEAM FOR THIS BROWSER
      // ========================================================
      //
      // This is the important Firebase check.
      //
      // We look ONLY inside:
      //
      // competitions/<THIS CODE>/teams
      //
      // Therefore a team from another competition
      // does not block this registration.
      //
      // ========================================================

      const teamsRef =
        ref(
          database,
          `competitions/${code}/teams`
        );


      const teamsSnap =
        await get(teamsRef);


      if (teamsSnap.exists()) {

        const teams =
          teamsSnap.val();


        for (
          const teamId in teams
        ) {

          const existingTeam =
            teams[teamId];


          if (
            existingTeam?.ownerUid ===
            user.uid
          ) {

            // --------------------------------------------------
            // SAME BROWSER + SAME COMPETITION
            // --------------------------------------------------

            const existingStatus =
              existingTeam.status;


            if (
              existingStatus ===
                "completed"
            ) {

              showMessage(
                "This device has already completed this competition.",
                "status error"
              );

              return;
            }


            if (
              existingStatus ===
                "registered" ||
              existingStatus ===
                "in-battle"
            ) {

              showMessage(
                "This device is already registered for this competition.",
                "status error"
              );

              return;
            }


            // --------------------------------------------------
            // Any other existing registration
            // --------------------------------------------------

            showMessage(
              "This device has already entered this competition.",
              "status error"
            );

            return;
          }
        }
      }


      // ========================================================
      // CREATE NEW TEAM
      // ========================================================

      const teamId =
        createId("team");


      const now =
        Date.now();


      const team = {

        teamId,

        ownerUid:
          user.uid,

        teamName,

        member1:
          members[0],

        member2:
          members[1],

        member3:
          members[2],

        status:
          "registered",

        currentRound:
          0,

        retriesUsed:
          0,

        finalScore:
          null,

        createdAt:
          now
      };


      // ========================================================
      // SAVE TEAM TO FIREBASE
      // ========================================================

      await set(
        ref(
          database,
          `competitions/${code}/teams/${teamId}`
        ),
        team
      );


      // ========================================================
      // SAVE ACTIVE BATTLE LOCALLY
      // ========================================================
      //
      // This replaces any old active battle from another
      // competition.
      //
      // This is intentional because the browser is now
      // entering a new competition.
      //
      // ========================================================

      const battleState = {

        version:
          2,

        competitionCode:
          code,

        teamId,

        ownerUid:
          user.uid,

        teamName,

        members,

        currentRound:
          0,

        attempts:
          0,

        completed:
          false,

        rounds:
          [],

        sentenceSet:
          null,

        pendingAdvance:
          false,

        createdAt:
          now
      };


      saveState(
        battleState
      );


      // ========================================================
      // GO TO BATTLE
      // ========================================================

      location.replace(
        "battle.html"
      );

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      showMessage(
        error?.message ||
          "Registration failed. Please check your internet connection and try again.",
        "status error"
      );
    }
  }
);
