import { loadState } from "./utils.js";
const s=loadState(); if(!s?.completed){location.replace("index.html");}else{document.getElementById("teamName").textContent=s.teamName;document.getElementById("finalScore").textContent=`${s.finalScore}/100`;document.getElementById("average").textContent=`${s.finalScore}%`;document.getElementById("retries").textContent=s.totalRetries??0;}
