import { database, ref, get, set, ensureAnonymousAuth } from "../firebase.js";
import { createId, saveState, loadState, escapeHtml } from "./utils.js";

const form = document.getElementById("registerForm");
const msg = document.getElementById("registerMsg");
const codeInput = document.getElementById("competitionCode");
const qsCode = new URLSearchParams(location.search).get("code");
if (qsCode) codeInput.value = qsCode.toUpperCase();

const existing = loadState();
if (existing?.completed) location.replace("result.html");

form.addEventListener("submit", async e => {
  e.preventDefault(); msg.textContent = "Connecting to competition…"; msg.className = "status";
  const code = codeInput.value.trim().toUpperCase();
  const teamName = document.getElementById("teamName").value.trim();
  const members = ["member1","member2","member3"].map(id => document.getElementById(id).value.trim());
  try {
    const user = await ensureAnonymousAuth();
    const compSnap = await get(ref(database, `competitions/${code}`));
    if (!compSnap.exists() || compSnap.val()?.active !== true) throw new Error("Invalid or inactive competition code.");
    const teamId = createId("team");
    const now = Date.now();
    const team = { teamId, ownerUid:user.uid, teamName, member1:members[0], member2:members[1], member3:members[2], status:"registered", currentRound:0, retriesUsed:0, finalScore:null, createdAt:now };
    await set(ref(database, `competitions/${code}/teams/${teamId}`), team);
    saveState({version:2, competitionCode:code, teamId, ownerUid:user.uid, teamName, members, currentRound:0, attempts:0, completed:false, rounds:[], sentenceSet:null, pendingAdvance:false});
    location.href = "battle.html";
  } catch (err) {
    msg.textContent = err.message || "Registration failed. Check your internet connection."; msg.className = "status error";
  }
});
