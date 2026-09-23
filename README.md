# Polyglot Pronunciation Battle — Production Foundation v2

This version fixes the two observed battle bugs and adds a stronger event architecture.

## Fixed
- Exactly 3 speech attempts per sentence: first attempt + 2 retries.
- After the third attempt, the current sentence is locked and the next sentence starts automatically.
- Refresh never resets the attempt counter or generates a new sentence set.
- A completed attempt is persisted immediately before UI transition.
- Refresh after an attempt restores the same recognized text and score instead of giving a fresh attempt.
- Completed devices go to `result.html` and cannot start another battle from the same browser state.
- Sentence set is generated once and persisted.
- Equal leaderboard scores use: score → completion time → stable team ID.
- Offline/online status is shown; battle state is always stored locally and Firebase sync retries when online.
- Microphone and SpeechRecognition errors receive user-friendly messages.
- Event Test Mode can generate up to 200 mock teams.
- Glassmorphism responsive UI.
- Uploaded Polyglot logo is used throughout the site.

## Firebase setup
1. Replace the placeholders in `firebase.js` with your Firebase Web App config.
2. Firebase Authentication → enable **Email/Password** and **Anonymous** sign-in.
3. Create a host email/password account.
4. In Realtime Database, apply `firebase/database.rules.json`.
5. In Realtime Database, add your host UID manually:
   `/hosts/YOUR_HOST_UID = true`
   This is required because only that UID can create competitions.
6. For local testing you can temporarily use open rules, but restore the supplied rules before the event.

## Important security limitation
The browser performs speech recognition and calculates similarity locally. Realtime Database rules prevent ordinary participants from changing an already stored `finalScore`, but **client-side scoring is not cryptographically authoritative**. For a high-stakes competition, move final score calculation to a trusted server/Cloud Function and write the official result from that trusted environment. Firebase App Check is also recommended.

## Running locally
Use VS Code Live Server or another HTTP server. Do not open the HTML files with `file://`.

## Host
Open `host.html`, sign in, then create a competition. The generated QR points to `index.html?code=...`.

## Participant
Open the registration page, enter the code, register the 3 members, and start the battle.

## Event mode
Open `event-mode.html`, enter the competition code and number of test teams, then generate mock teams. Do not use this during the real event.

## Android Chrome
Recommended browser for SpeechRecognition testing. Test microphone permission, HTTPS deployment, screen wake/lock behavior, and network conditions before the event.
