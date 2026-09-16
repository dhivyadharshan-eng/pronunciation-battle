/**
 * Pronunciation Battle - Main Application Logic & View Coordinator
 * Polyglot Communication Club
 */

import { APP_CONFIG } from './config.js';
import { generateTeamSentenceSet } from './sentences.js';
import { StorageService } from './storage.js';
import { SpeechEngine } from './speech-engine.js';
import { firebaseService } from './firebase-service.js';
import { HostDashboard } from './host-dashboard.js';

class PronunciationBattleApp {
  constructor() {
    this.session = null;
    this.speechEngine = null;
    this.hostDashboard = null;

    // Active state for current sentence attempt
    this.currentAttempt = {
      transcript: '',
      isFinal: false,
      accuracy: 0,
      retries: 1, // Attempt number (1st attempt = 1, 2nd attempt = 2, 3rd = 3)
      evaluatedScore: null
    };

    this.init();
  }

  async init() {
    this.bindDOM();
    this.initSpeechEngine();
    this.checkSessionAndRoute();
  }

  bindDOM() {
    // Views
    this.viewRegistration = document.getElementById('viewRegistration');
    this.viewBattle = document.getElementById('viewBattle');
    this.viewResult = document.getElementById('viewResult');
    this.viewHostModal = document.getElementById('viewHostModal');

    // Registration Elements
    this.formRegistration = document.getElementById('formRegistration');
    this.inputCompCode = document.getElementById('inputCompCode');
    this.inputTeamName = document.getElementById('inputTeamName');
    this.inputMember1 = document.getElementById('inputMember1');
    this.inputMember2 = document.getElementById('inputMember2');
    this.inputMember3 = document.getElementById('inputMember3');
    this.regErrorMessage = document.getElementById('regErrorMessage');
    this.btnRegisterTeam = document.getElementById('btnRegisterTeam');

    // Battle Elements
    this.txtBattleTeamName = document.getElementById('txtBattleTeamName');
    this.txtCurrentSpeaker = document.getElementById('txtCurrentSpeaker');
    this.txtCurrentRoundNum = document.getElementById('txtCurrentRoundNum');
    this.badgeDifficulty = document.getElementById('badgeDifficulty');
    this.txtTargetSentence = document.getElementById('txtTargetSentence');
    this.txtPhoneticTip = document.getElementById('txtPhoneticTip');

    // Speech & Recording Controls
    this.btnMicRecord = document.getElementById('btnMicRecord');
    this.micIcon = document.getElementById('micIcon');
    this.micStatusText = document.getElementById('micStatusText');
    this.audioWaveVisualizer = document.getElementById('audioWaveVisualizer');
    this.txtLiveTranscript = document.getElementById('txtLiveTranscript');
    
    // Attempt Feedback & Score Box
    this.boxScoreFeedback = document.getElementById('boxScoreFeedback');
    this.txtAccuracyScore = document.getElementById('txtAccuracyScore');
    this.txtPenaltyScore = document.getElementById('txtPenaltyScore');
    this.txtFinalRoundScore = document.getElementById('txtFinalRoundScore');
    this.txtRetryCount = document.getElementById('txtRetryCount');
    this.btnSubmitRound = document.getElementById('btnSubmitRound');
    this.btnRetrySpeech = document.getElementById('btnRetrySpeech');

    // Result Elements
    this.txtResultTeamName = document.getElementById('txtResultTeamName');
    this.txtResultFinalScore = document.getElementById('txtResultFinalScore');
    this.txtResultAvgAccuracy = document.getElementById('txtResultAvgAccuracy');
    this.txtResultTotalRetries = document.getElementById('txtResultTotalRetries');
    this.txtResultTotalPenalties = document.getElementById('txtResultTotalPenalties');
    this.containerRoundsBreakdown = document.getElementById('containerRoundsBreakdown');
    this.btnResetDeviceLock = document.getElementById('btnResetDeviceLock');

    // Top Navigation / Host Dashboard Toggle
    this.btnToggleHostView = document.getElementById('btnToggleHostView');
    this.btnCloseHostModal = document.getElementById('btnCloseHostModal');

    // Bind Event Handlers
    if (this.formRegistration) {
      this.formRegistration.addEventListener('submit', (e) => this.handleRegistration(e));
    }
    if (this.btnMicRecord) {
      this.btnMicRecord.addEventListener('click', () => this.toggleRecording());
    }
    if (this.btnRetrySpeech) {
      this.btnRetrySpeech.addEventListener('click', () => this.handleRetryAttempt());
    }
    if (this.btnSubmitRound) {
      this.btnSubmitRound.addEventListener('click', () => this.submitRound());
    }
    if (this.btnToggleHostView) {
      this.btnToggleHostView.addEventListener('click', () => this.openHostModal());
    }
    if (this.btnCloseHostModal) {
      this.btnCloseHostModal.addEventListener('click', () => this.closeHostModal());
    }
    if (this.btnResetDeviceLock) {
      this.btnResetDeviceLock.addEventListener('click', () => this.handleAdminReset());
    }
  }

  initSpeechEngine() {
    this.speechEngine = new SpeechEngine(
      (transcript, isFinal) => this.handleSpeechResult(transcript, isFinal),
      (errorMsg) => this.handleSpeechError(errorMsg),
      (status) => this.handleSpeechStatusChange(status)
    );
  }

  /**
   * Router / State Recovery on Load
   */
  checkSessionAndRoute() {
    this.session = StorageService.getSession();

    if (!this.session) {
      this.showView('registration');
      return;
    }

    if (this.session.isLocked || this.session.status === 'Finished') {
      this.showView('result');
      this.renderResultsScreen();
      return;
    }

    if (this.session.status === 'Playing' || this.session.status === 'Waiting') {
      this.showView('battle');
      this.loadRoundState();
    }
  }

  showView(viewName) {
    this.viewRegistration.classList.add('hidden');
    this.viewBattle.classList.add('hidden');
    this.viewResult.classList.add('hidden');

    if (viewName === 'registration') this.viewRegistration.classList.remove('hidden');
    if (viewName === 'battle') this.viewBattle.classList.remove('hidden');
    if (viewName === 'result') this.viewResult.classList.remove('hidden');
  }

  /**
   * 1. Team Registration Handler
   */
  async handleRegistration(event) {
    event.preventDefault();
    this.regErrorMessage.classList.add('hidden');
    this.btnRegisterTeam.disabled = true;
    this.btnRegisterTeam.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Validating & Registering...`;

    try {
      const code = this.inputCompCode.value.trim().toUpperCase();
      const teamName = this.inputTeamName.value.trim();
      const member1 = this.inputMember1.value.trim();
      const member2 = this.inputMember2.value.trim();
      const member3 = this.inputMember3.value.trim();

      if (!code || !teamName || !member1 || !member2 || !member3) {
        this.showRegError("Please fill in all fields including the 3 team member names.");
        return;
      }

      // Step 1: Validate competition code against Firebase
      const isValidCode = await firebaseService.validateCompetitionCode(code);
      if (!isValidCode) {
        this.showRegError(`Invalid Competition Code '${code}'. Please check with competition staff.`);
        return;
      }

      // Step 2: Check for duplicate team name registration
      const isTaken = await firebaseService.isTeamNameTaken(code, teamName);
      if (isTaken) {
        this.showRegError(`Team name '${teamName}' is already registered for code ${code}. Please pick a unique name.`);
        return;
      }

      // Step 3: Generate 5 sentences (2 Easy, 2 Moderate, 1 Hard)
      const sentenceSet = generateTeamSentenceSet();
      const uniqueTeamId = `team_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;

      const teamData = {
        id: uniqueTeamId,
        name: teamName,
        code: code,
        members: [member1, member2, member3],
        sentences: sentenceSet
      };

      // Step 4: Save to LocalStorage & Firebase Firestore
      StorageService.initTeamSession(teamData);
      
      // Async register (fire and don't block transition if network is slow)
      firebaseService.registerTeam(teamData);

      this.session = StorageService.getSession();
      this.showView('battle');
      this.loadRoundState();
    } catch (err) {
      console.error("Registration error:", err);
      this.showRegError("An unexpected error occurred during registration. Please try again.");
    } finally {
      this.resetRegButton();
    }
  }

  showRegError(msg) {
    this.regErrorMessage.textContent = msg;
    this.regErrorMessage.classList.remove('hidden');
  }

  resetRegButton() {
    this.btnRegisterTeam.disabled = false;
    this.btnRegisterTeam.innerHTML = `<i class="fas fa-rocket mr-2"></i> Register Team & Start Battle`;
  }

  /**
   * 2. Load Round State & Sentence Information
   */
  loadRoundState() {
    if (!this.session || !this.session.sentences) return;

    const roundIndex = this.session.currentRoundIdx || 0;
    
    if (roundIndex >= 5) {
      this.finishBattle();
      return;
    }

    const currentSentenceObj = this.session.sentences[roundIndex];
    const currentMember = this.session.members[roundIndex % 3]; // Rotates members: M1 -> M2 -> M3 -> M1 -> M3

    // Update UI Elements
    this.txtBattleTeamName.textContent = this.session.name;
    this.txtCurrentRoundNum.textContent = `${roundIndex + 1} / 5`;
    this.txtCurrentSpeaker.textContent = currentMember;
    this.txtTargetSentence.textContent = currentSentenceObj.text;
    this.txtPhoneticTip.textContent = `💡 Phonetic Tip: ${currentSentenceObj.tip || currentSentenceObj.phonetic}`;

    // Update Difficulty Badge
    this.badgeDifficulty.textContent = currentSentenceObj.difficulty;
    this.badgeDifficulty.className = 'px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ';
    if (currentSentenceObj.difficulty === 'Easy') this.badgeDifficulty.classList.add('badge-easy');
    if (currentSentenceObj.difficulty === 'Moderate') this.badgeDifficulty.classList.add('badge-moderate');
    if (currentSentenceObj.difficulty === 'Hard') this.badgeDifficulty.classList.add('badge-hard');

    // Reset attempt variables for new round
    this.currentAttempt = {
      transcript: '',
      isFinal: false,
      accuracy: 0,
      retries: 1,
      evaluatedScore: null
    };

    this.resetSpeechControlsUI();

    // Firebase state update: team is playing round X
    firebaseService.updateTeamProgress(this.session.code, this.session.id, {
      status: 'Playing',
      currentRound: roundIndex + 1,
      currentSpeaker: currentMember,
      currentSentence: currentSentenceObj.text,
      currentDifficulty: currentSentenceObj.difficulty
    });
  }

  resetSpeechControlsUI() {
    this.txtLiveTranscript.textContent = 'Press the microphone button and speak clearly into your device...';
    this.txtLiveTranscript.className = 'text-slate-400 italic font-mono text-sm leading-relaxed';
    this.boxScoreFeedback.classList.add('hidden');
    this.btnSubmitRound.classList.add('hidden');
    this.btnRetrySpeech.classList.add('hidden');
    this.txtRetryCount.textContent = `Attempt 1 of ${APP_CONFIG.MAX_RETRIES_PER_ROUND}`;
    this.audioWaveVisualizer.classList.add('hidden');
    this.micStatusText.textContent = 'Tap Microphone to Speak';
    this.btnMicRecord.className = 'w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-3xl font-bold flex items-center justify-center shadow-xl shadow-amber-500/20 transition transform hover:scale-105 active:scale-95';
  }

  /**
   * 3. Speech Recognition & Live Processing
   */
  toggleRecording() {
    if (!this.speechEngine) return;

    if (this.speechEngine.isListening) {
      this.speechEngine.stop();
    } else {
      this.speechEngine.start();
    }
  }

  handleSpeechStatusChange(status) {
    if (status === 'listening') {
      this.micStatusText.textContent = 'Listening... Speak Now!';
      this.btnMicRecord.classList.add('mic-recording-pulse');
      this.audioWaveVisualizer.classList.remove('hidden');
      this.txtLiveTranscript.textContent = 'Listening for speech...';
    } else if (status === 'idle') {
      this.btnMicRecord.classList.remove('mic-recording-pulse');
      this.audioWaveVisualizer.classList.add('hidden');
      if (!this.currentAttempt.transcript) {
        this.micStatusText.textContent = 'Tap Microphone to Speak';
      } else {
        this.micStatusText.textContent = 'Speech Captured';
      }
    }
  }

  handleSpeechError(errorMsg) {
    this.micStatusText.textContent = 'Microphone Error';
    this.txtLiveTranscript.textContent = `Error: ${errorMsg}. Please ensure microphone permissions are granted.`;
    this.txtLiveTranscript.className = 'text-red-400 font-mono text-sm';
  }

  handleSpeechResult(transcript, isFinal) {
    this.currentAttempt.transcript = transcript;
    this.currentAttempt.isFinal = isFinal;

    this.txtLiveTranscript.textContent = `"${transcript}"`;
    this.txtLiveTranscript.className = 'text-slate-100 font-medium text-lg leading-relaxed';

    // Calculate live accuracy
    const targetText = this.session.sentences[this.session.currentRoundIdx || 0].text;
    const accuracy = SpeechEngine.calculateAccuracy(transcript, targetText);
    this.currentAttempt.accuracy = accuracy;

    // Evaluate scoring with retry count penalties
    const evaluated = SpeechEngine.calculateRoundScore(
      accuracy,
      this.currentAttempt.retries,
      APP_CONFIG.PENALTY_PER_RETRY
    );
    this.currentAttempt.evaluatedScore = evaluated;

    this.renderAttemptFeedback(evaluated);
  }

  renderAttemptFeedback(scoreObj) {
    this.boxScoreFeedback.classList.remove('hidden');
    this.txtAccuracyScore.textContent = `${scoreObj.accuracy}%`;
    this.txtPenaltyScore.textContent = `-${scoreObj.penaltyPoints} pts`;
    this.txtFinalRoundScore.textContent = `${scoreObj.finalScore} pts`;

    this.btnSubmitRound.classList.remove('hidden');

    // Handle retries limit (Max 3 attempts)
    if (this.currentAttempt.retries < APP_CONFIG.MAX_RETRIES_PER_ROUND) {
      this.btnRetrySpeech.classList.remove('hidden');
    } else {
      this.btnRetrySpeech.classList.add('hidden');
      this.txtRetryCount.textContent = `Max Attempts Reached (3/3)`;
    }
  }

  handleRetryAttempt() {
    if (this.currentAttempt.retries >= APP_CONFIG.MAX_RETRIES_PER_ROUND) return;

    this.currentAttempt.retries += 1;
    this.currentAttempt.transcript = '';
    this.currentAttempt.accuracy = 0;
    this.currentAttempt.evaluatedScore = null;

    this.resetSpeechControlsUI();
    this.txtRetryCount.textContent = `Attempt ${this.currentAttempt.retries} of ${APP_CONFIG.MAX_RETRIES_PER_ROUND}`;
    
    // Automatically re-trigger mic for smooth user experience
    setTimeout(() => this.toggleRecording(), 300);
  }

  /**
   * 4. Submit Round & Advance Battle
   */
  async submitRound() {
    if (!this.session || !this.currentAttempt.evaluatedScore) return;

    const roundIdx = this.session.currentRoundIdx || 0;
    const currentSentenceObj = this.session.sentences[roundIdx];
    const speaker = this.session.members[roundIdx % 3];

    const roundResult = {
      roundNum: roundIdx + 1,
      difficulty: currentSentenceObj.difficulty,
      targetSentence: currentSentenceObj.text,
      speaker: speaker,
      transcript: this.currentAttempt.transcript,
      accuracy: this.currentAttempt.evaluatedScore.accuracy,
      retries: this.currentAttempt.retries,
      penalty: this.currentAttempt.evaluatedScore.penaltyPoints,
      score: this.currentAttempt.evaluatedScore.finalScore,
      submittedAt: new Date().toISOString()
    };

    const isLastRound = roundIdx >= 4;

    // Save locally
    StorageService.saveRoundProgress(roundIdx, roundResult, isLastRound);
    this.session = StorageService.getSession();

    // Prepare next round info if continuing
    let nextRoundInfo = null;
    if (!isLastRound) {
      const nextIdx = roundIdx + 1;
      nextRoundInfo = {
        roundNum: nextIdx + 1,
        speaker: this.session.members[nextIdx % 3],
        sentence: this.session.sentences[nextIdx].text,
        difficulty: this.session.sentences[nextIdx].difficulty
      };
    }

    // Real-time Firebase Sync
    await firebaseService.recordRoundResult(this.session.code, this.session.id, roundResult, nextRoundInfo);

    if (isLastRound) {
      this.finishBattle();
    } else {
      this.loadRoundState();
    }
  }

  /**
   * 5. Battle Completion & Results Calculations
   */
  async finishBattle() {
    if (!this.session) return;

    const rounds = this.session.roundsData || [];
    
    const totalAccuracy = rounds.reduce((sum, r) => sum + (r.accuracy || 0), 0);
    const avgAccuracy = rounds.length > 0 ? Math.round(totalAccuracy / rounds.length) : 0;
    
    const totalRetries = rounds.reduce((sum, r) => sum + Math.max(0, (r.retries || 1) - 1), 0);
    const totalPenalties = rounds.reduce((sum, r) => sum + (r.penalty || 0), 0);
    
    const totalRoundScores = rounds.reduce((sum, r) => sum + (r.score || 0), 0);
    const finalCompositeScore = rounds.length > 0 ? Math.round(totalRoundScores / rounds.length) : 0;

    const finalResultObj = {
      averageAccuracy: avgAccuracy,
      totalRetries: totalRetries,
      totalPenalties: totalPenalties,
      finalScore: finalCompositeScore,
      completedAt: new Date().toISOString()
    };

    // Save final status in LocalStorage & Firebase
    StorageService.saveFinalResult(finalResultObj);
    await firebaseService.finalizeBattle(this.session.code, this.session.id, finalResultObj);

    this.session = StorageService.getSession();
    this.showView('result');
    this.renderResultsScreen();
  }

  /**
   * Render Final Summary & Device Lock Screen
   */
  renderResultsScreen() {
    if (!this.session) return;

    const res = this.session.finalResult || {
      averageAccuracy: 0,
      totalRetries: 0,
      totalPenalties: 0,
      finalScore: 0
    };

    this.txtResultTeamName.textContent = this.session.name;
    this.txtResultFinalScore.textContent = `${res.finalScore}`;
    this.txtResultAvgAccuracy.textContent = `${res.averageAccuracy}%`;
    this.txtResultTotalRetries.textContent = `${res.totalRetries}`;
    this.txtResultTotalPenalties.textContent = `-${res.totalPenalties} pts`;

    // Render Round Breakdown
    const rounds = this.session.roundsData || [];
    this.containerRoundsBreakdown.innerHTML = rounds.map((r, i) => `
      <div class="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-amber-400">Round ${r.roundNum} (${r.difficulty})</span>
          <span class="text-slate-400"><i class="fas fa-user text-slate-500 mr-1"></i> ${r.speaker}</span>
        </div>
        <p class="text-sm font-medium text-slate-200">"${r.targetSentence}"</p>
        <p class="text-xs text-slate-400 italic">Recognized: "${r.transcript || 'None'}"</p>
        <div class="flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs font-mono">
          <span class="text-emerald-400">Accuracy: ${r.accuracy}%</span>
          <span class="text-amber-400">Penalties: -${r.penalty} pts</span>
          <span class="font-bold text-slate-100">Score: ${r.score} pts</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Host Monitoring Modal
   */
  openHostModal() {
    this.viewHostModal.classList.remove('hidden');
    if (!this.hostDashboard) {
      this.hostDashboard = new HostDashboard(document.getElementById('hostDashboardContainer'));
    }
  }

  closeHostModal() {
    this.viewHostModal.classList.add('hidden');
  }

  /**
   * Reset Device Lock for new battle test
   */
  handleAdminReset() {
    if (confirm("Are you sure you want to reset this device session to start a new team battle?")) {
      StorageService.clearSession();
      window.location.reload();
    }
  }
}

// Instantiate App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PronunciationBattleApp();
});
