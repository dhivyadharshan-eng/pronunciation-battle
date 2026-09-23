# Firebase deployment notes

Use `database.rules.json` in Firebase Realtime Database → Rules.

Host authorization model:
1. Create a Firebase Authentication Email/Password user.
2. Copy the user's UID.
3. In Realtime Database Data, create `hosts/<UID>` with boolean value `true`.

Participant devices authenticate anonymously.

For authoritative scoring, use a trusted backend/Cloud Function in the final competition build. Client-side JavaScript cannot be treated as a tamper-proof scoring authority.
