/**
 * Pronunciation Battle - Speech Engine & Accuracy Evaluation Module
 */

export class SpeechEngine {
  constructor(onResultCallback, onErrorCallback, onStatusChangeCallback) {
    this.onResult = onResultCallback;
    this.onError = onErrorCallback;
    this.onStatusChange = onStatusChangeCallback;

    this.recognition = null;
    this.isListening = false;
    this.supported = false;

    this.initRecognition();
  }

  /**
   * Initialize Web Speech API instance
   */
  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.");
      this.supported = false;
      return;
    }

    this.supported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false; // Stop after sentence end
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStatusChange) this.onStatusChange('listening');
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      if (this.onResult) {
        this.onResult(currentTranscript, !!finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      this.isListening = false;
      if (this.onStatusChange) this.onStatusChange('error');
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onStatusChange) this.onStatusChange('idle');
    };
  }

  start() {
    if (!this.supported) {
      if (this.onError) this.onError("Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    if (this.isListening) return;

    try {
      this.recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  /**
   * Calculate Pronunciation Accuracy between spoken transcript and target sentence.
   * Combines word-level match ratio & normalized Levenshtein distance.
   */
  static calculateAccuracy(spokenText, targetText) {
    if (!spokenText || spokenText.trim() === '') return 0;

    const normalize = (str) =>
      str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const targetNorm = normalize(targetText);
    const spokenNorm = normalize(spokenText);

    if (targetNorm === spokenNorm) return 100;

    const targetWords = targetNorm.split(' ');
    const spokenWords = spokenNorm.split(' ');

    // 1. Word Level Accuracy
    let matchedWords = 0;
    const spokenWordSet = [...spokenWords];

    targetWords.forEach(word => {
      const idx = spokenWordSet.indexOf(word);
      if (idx !== -1) {
        matchedWords++;
        spokenWordSet.splice(idx, 1);
      }
    });

    const wordAccuracy = (matchedWords / targetWords.length) * 100;

    // 2. Character-level Levenshtein Similarity
    const distance = SpeechEngine.levenshteinDistance(spokenNorm, targetNorm);
    const maxLength = Math.max(spokenNorm.length, targetNorm.length);
    const charAccuracy = maxLength > 0 ? ((maxLength - distance) / maxLength) * 100 : 0;

    // Weighted Combined Score (60% Word Match + 40% Char Levenshtein)
    const combinedAccuracy = Math.round((wordAccuracy * 0.60) + (charAccuracy * 0.40));
    
    return Math.min(100, Math.max(0, combinedAccuracy));
  }

  /**
   * Levenshtein Distance matrix calculation helper
   */
  static levenshteinDistance(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Calculate Penalties & Final Score for a round based on retry count
   */
  static calculateRoundScore(accuracy, retries, penaltyPerRetry = 5) {
    // Retries 0 or 1 attempt = 0 penalty points
    // Attempt 2 = 1 retry = 5 penalty points
    // Attempt 3 = 2 retries = 10 penalty points
    const retryCount = Math.max(0, retries - 1);
    const penaltyPoints = retryCount * penaltyPerRetry;
    const finalScore = Math.max(0, Math.round(accuracy - penaltyPoints));

    return {
      accuracy,
      penaltyPoints,
      finalScore
    };
  }
}
