# Setup checklist

## 1. Firebase
- Authentication → Sign-in method → enable Email/Password and Anonymous.
- Realtime Database → create database in your chosen region.
- Copy the Web App config into `firebase.js`.
- Publish `firebase/database.rules.json` as your database rules.

## 2. Host account
- Create an Email/Password user in Firebase Authentication.
- Copy its UID.
- In Realtime Database Data, create `hosts/<UID>` with boolean `true`.
- Open `host.html` and sign in.

## 3. Test competition
- Create a competition.
- Open the participant URL/QR.
- Register a test team.
- Complete all five rounds.
- Verify exactly three attempts per sentence.
- Refresh after attempt 1 and attempt 2; the attempt count and score must remain unchanged.
- On attempt 3, the sentence locks and advances automatically.
- Refresh after completion; the result page remains locked.

## 4. 100-device rehearsal
- Use 1–5 real devices first.
- Then use 10–20 real devices.
- Use `event-mode.html` for database load simulation up to 200 mock teams.
- Test temporary Wi-Fi loss and reconnection.
- Test Android Chrome microphone permissions.

## 5. Before the real event
- Do not use open `.read/.write` rules.
- Deploy over HTTPS.
- Create a dedicated host account.
- Keep a backup of the Firebase database.
- For authoritative anti-cheat scoring, add a trusted backend/Cloud Function before treating browser-calculated scores as official.
