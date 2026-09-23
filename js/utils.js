export const MAX_ATTEMPTS = 4; // 1 original + 3 retries

export function createId(prefix = "id") {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return prefix + "-" + [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "POLY-";
  const values = crypto.getRandomValues(new Uint32Array(6));
  for (let i = 0; i < 6; i++) out += chars[values[i] % chars.length];
  return out;
}

export function cleanText(text) {
  return String(text || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
}

export function similarity(a, b) {
  a = cleanText(a); b = cleanText(b);
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  const prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return Math.max(0, Math.min(100, Math.round((1 - prev[b.length] / Math.max(a.length, b.length)) * 100)));
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
}

export function stableCompare(a, b) {
  const scoreA = Number(a.finalScore ?? -1), scoreB = Number(b.finalScore ?? -1);
  if (scoreB !== scoreA) return scoreB - scoreA;
  const timeA = Number(a.completedAt ?? Number.MAX_SAFE_INTEGER), timeB = Number(b.completedAt ?? Number.MAX_SAFE_INTEGER);
  if (timeA !== timeB) return timeA - timeB;
  return String(a.teamId || "").localeCompare(String(b.teamId || ""));
}

export function saveState(state) {
  localStorage.setItem("pbBattleState", JSON.stringify(state));
}
export function loadState() {
  try { return JSON.parse(localStorage.getItem("pbBattleState") || "null"); } catch { return null; }
}
export function clearBattleState() { localStorage.removeItem("pbBattleState"); }
