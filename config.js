/**
 * Pronunciation Battle - Configuration Module
 * Polyglot Communication Club
 */

export const APP_CONFIG = {
  // Valid Competition Codes accepted during registration
  VALID_COMPETITION_CODES: [
    'POLYGLOT2026',
    'BATTLE2026',
    'CLUB100',
    'DEMO2026'
  ],

  // Max retries allowed per sentence round before locking attempt
  MAX_RETRIES_PER_ROUND: 3,

  // Penalty points subtracted per retry after the 1st attempt
  PENALTY_PER_RETRY: 5,

  // Firebase Configuration (Replace with your Firebase Project credentials if using real Firebase)
  FIREBASE_CONFIG: {
    apiKey: "AIzaSyDemoKey-PronunciationBattle2026",
    authDomain: "polyglot-pronunciation-battle.firebaseapp.com",
    projectId: "polyglot-pronunciation-battle",
    storageBucket: "polyglot-pronunciation-battle.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:demo1234567890"
  },

  // Fallback to Mock Firebase if true or if real Firebase is unreachable
  ENABLE_MOCK_FALLBACK: true,

  // Round progression configuration: 2 Easy, 2 Moderate, 1 Hard
  ROUND_DIFFICULTY_SCHEDULE: [
    { round: 1, difficulty: 'Easy', label: 'Round 1 (Easy)' },
    { round: 2, difficulty: 'Easy', label: 'Round 2 (Easy)' },
    { round: 3, difficulty: 'Moderate', label: 'Round 3 (Moderate)' },
    { round: 4, difficulty: 'Moderate', label: 'Round 4 (Moderate)' },
    { round: 5, difficulty: 'Hard', label: 'Final Round (Hard)' }
  ]
};
