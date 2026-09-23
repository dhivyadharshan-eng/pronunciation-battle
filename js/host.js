import { database, auth, ref, set, onValue, signInWithEmailAndPassword, onAuthStateChanged, signOut, get } from "../firebase.js";
import { randomCode, stableCompare, escapeHtml } from "./utils.js";

const $=id=>document.getElementById(id); let activeCode=localStorage.getItem("pbHostCompetition")||""; let unsubscribe=null;
function showDashboard(){ $("loginCard").hidden=true; $("dashboard").hidden=false; $("logoutBtn").hidden=false; if(activeCode) loadCompetition(activeCode); }
function showLogin(){ $("loginCard").hidden=false; $("dashboard").hidden=true; $("logoutBtn").hidden=true; }

$("loginForm").addEventListener("submit",async e=>{e.preventDefault();$("loginMsg").textContent="Signing in…";try{await signInWithEmailAndPassword(auth,$("email").value,$("password").value);$("loginMsg").textContent="";}catch(err){$("loginMsg").textContent=err.message;$("loginMsg").className="status error";}});
$("logoutBtn").addEventListener("click",()=>signOut(auth));
$("createBtn").addEventListener("click",async()=>{try{const code=randomCode();const uid=auth.currentUser?.uid;if(!uid)throw new Error("Please sign in again.");await set(ref(database,`competitions/${code}`),{code,active:true,createdAt:Date.now(),createdBy:uid,teams:{}});activeCode=code;localStorage.setItem("pbHostCompetition",code);loadCompetition(code);}catch(err){alert(err.message);}});
$("refreshBtn").addEventListener("click",()=>activeCode&&loadCompetition(activeCode));

function loadCompetition(code){if(unsubscribe)unsubscribe();$("code").textContent=code;$("activeCode").textContent=`Competition: ${code}`;const qrUrl=`${location.origin}${location.pathname.replace(/host\.html$/,'index.html')}?code=${encodeURIComponent(code)}`;$("qr").src=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`;unsubscribe=onValue(ref(database,`competitions/${code}/teams`),snap=>render(snap.val()||{}));}
function render(raw){const teams=Object.values(raw).sort(stableCompare);const completed=teams.filter(t=>t.status==='completed').length;$("total").textContent=teams.length;$("completed").textContent=completed;$("inBattle").textContent=teams.filter(t=>t.status==='in-battle').length;$("registered").textContent=teams.filter(t=>t.status==='registered').length;$("leaderboard").innerHTML=teams.map((t,i)=>`<tr><td>${i+1}</td><td><strong>${escapeHtml(t.teamName)}</strong><small>${escapeHtml(t.teamId.slice(-8))}</small></td><td><span class="status-chip ${t.status}">${escapeHtml(t.status)}</span></td><td>${Math.min(Number(t.currentRound||0)+ (t.status==='completed'?0:1),5)}/5</td><td>${Number(t.retriesUsed||0)}</td><td>${t.finalScore==null?'—':Number(t.finalScore).toFixed(0)}</td></tr>`).join('')||`<tr><td colspan="6" class="empty">Waiting for teams…</td></tr>`;}

onAuthStateChanged(auth,user=>user?showDashboard():showLogin());
