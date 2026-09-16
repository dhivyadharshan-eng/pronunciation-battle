# Pronunciation Battle - Polyglot Communication Club

A real-time, team-based speech recognition and pronunciation battle web application created for the **Polyglot Communication Club**.

---

## 🌟 Features Overview

1. **Team Registration**:
   - Competition Code validation (`POLYGLOT2026`, `BATTLE2026`, `CLUB100`, `DEMO2026`).
   - Registration for Team Name and 3 Member Names.
   - Unique `teamId` generation and Firebase sync.
   - Duplicate registration prevention.

2. **Random Sentence Generation**:
   - Automatic generation of 5 sentences per team battle:
     - **2 Easy** sentences
     - **2 Moderate** sentences
     - **1 Hard** sentence
   - Saved to `localStorage` and Firebase so refreshing the page preserves the battle set.

3. **Speech Recognition & Evaluation Engine**:
   - Web Speech API integration (`SpeechRecognition`).
   - Live pulse mic indicator & visualizer.
   - Levenshtein character distance & word-matching accuracy algorithm.
   - Retries limit (Up to 3 attempts per round) with retry penalties (-5 points per retry beyond attempt 1).

4. **Firebase Real-Time Monitoring & Dual Sync**:
   - Stores team details in Firestore (`competitions/{code}/teams/{teamId}`).
   - Updates current round (1-5), current speaker, difficulty, speech transcript, accuracy, retries, penalties, and status (`'Waiting'` -> `'Playing'` -> `'Finished'`).
   - Fallback BroadcastChannel synchronization for multi-tab testing without API keys.

5. **Host Live Monitoring Dashboard**:
   - Built-in Host Dashboard accessible via top navigation or `/host`.
   - Real-time leaderboard, active round & speaker feed, live transcripts, and team status cards.

6. **Refresh Protection & Device Lock**:
   - Progress restoration on page refresh.
   - Prevents completed teams from re-submitting or re-starting.
   - Device lock redirects finished browsers straight to the Result Page.

---

## 🚀 Getting Started

### Local Running

To launch the project using Vite or any standard HTTP static server:

```bash
# Navigate to project directory
cd C:\Users\acer\.gemini\antigravity\scratch\pronunciation-battle

# Install dev dependencies
npm install

# Start local server
npm run dev
```

Open your browser at `http://localhost:5173` (or the URL printed in terminal).

---

## 🔑 Default Competition Codes

- `POLYGLOT2026`
- `BATTLE2026`
- `CLUB100`
- `DEMO2026`

---

## 🔒 Firebase Configuration

To connect live cloud Firebase Firestore:
Edit `js/config.js` and replace `FIREBASE_CONFIG` with your Firebase project credentials.
