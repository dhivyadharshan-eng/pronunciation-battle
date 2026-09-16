/**
 * Pronunciation Battle - Standalone Bundled Script
 * Polyglot Communication Club
 * Fully defensive script for GitHub Pages, Mobile & Desktop Browsers.
 * Theme: Electric Blue (#004BFF), Bright Purple (#8A2BE2), Neon Pink (#FF00EF) Buttons, Yellow Score.
 */

(function () {
  'use strict';

  // ==========================================
  // 1. CONFIGURATION
  // ==========================================
  const APP_CONFIG = {
    VALID_COMPETITION_CODES: ['POLYGLOT2026', 'BATTLE2026', 'CLUB100', 'DEMO2026'],
    MAX_RETRIES_PER_ROUND: 3,
    PENALTY_PER_RETRY: 5,
    FIREBASE_CONFIG: {
      apiKey: "AIzaSyDemoKey-PronunciationBattle2026",
      authDomain: "polyglot-pronunciation-battle.firebaseapp.com",
      projectId: "polyglot-pronunciation-battle",
      storageBucket: "polyglot-pronunciation-battle.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:demo1234567890"
    }
  };

  // ==========================================
  // 2. SENTENCE BANK & GENERATOR
  // ==========================================
  const SENTENCE_BANK = {
    Easy: [
      {
        id: 'e1',
        text: "The sun shines bright over the blue ocean.",
        phonetic: "ðə sʌn ʃaɪnz braɪt ˈoʊvər ðə bluː ˈoʊʃən",
        tip: "Focus on clear vowel sounds and the 'sh' in shines."
      },
      {
        id: 'e2',
        text: "She sells sweet apples at the local market.",
        phonetic: "ʃiː sɛlz swiːt ˈæpəlz æt ðə ˈloʊkəl ˈmɑːrkət",
        tip: "Distinctly pronounce the initial 's' and 'sw' sounds."
      },
      {
        id: 'e3',
        text: "We love learning new languages together every day.",
        phonetic: "wiː lʌv ˈlɜːrnɪŋ njuː ˈlæŋɡwɪdʒəz təˈɡɛðər ˈɛvri deɪ",
        tip: "Keep the rhythm steady and emphasize 'learning'."
      },
      {
        id: 'e4',
        text: "A quick cup of hot tea helps me focus.",
        phonetic: "ə kwɪk kʌp ʌv hɑːt tiː hɛlps miː ˈfoʊkəs",
        tip: "Crisp 'k' and 't' consonants are essential here."
      },
      {
        id: 'e5',
        text: "Bright green leaves dance gently in the summer breeze.",
        phonetic: "braɪt ɡriːn liːvz dæns ˈdʒɛntli ɪn ðə ˈsʌmər briːz",
        tip: "Smooth connection between 'green' and 'leaves'."
      }
    ],

    Moderate: [
      {
        id: 'm1',
        text: "Peter Piper picked a peck of pickled peppers with passion.",
        phonetic: "ˈpiːtər ˈpaɪpər pɪkt ə pɛk ʌv ˈpɪkəld ˈpɛpərz wɪð ˈpæʃən",
        tip: "Master the plosive 'P' sound without over-aspirating."
      },
      {
        id: 'm2',
        text: "The enthusiastic polyglot fluently articulated three dialects.",
        phonetic: "ði ɪnˌθuːziˈæstɪk ˈpɑːliˌɡlɑːt ˈfluːəntli ɑːrˈtɪkjuleɪtəd θriː ˈdaɪəˌlɛkts",
        tip: "Pay careful attention to multisyllabic stress pattern."
      },
      {
        id: 'm3',
        text: "Six slippery snakes slid silently past the stone wall.",
        phonetic: "sɪks ˈslɪpəri sneɪks slɪd ˈsaɪləntli pæst ðə stoʊn wɔːl",
        tip: "Distinguish between 's', 'sl', and 'sn' blends smoothly."
      },
      {
        id: 'm4',
        text: "Cultural communication requires curiosity and empathetic listening.",
        phonetic: "ˈkʌltʃərəl kəˌmjuːnɪˈkeɪʃən rɪˈkwaɪərz ˌkjʊriˈɑːsəti ænd ˌɛmpəˈθɛtɪk ˈlɪsənɪŋ",
        tip: "Enunciate 'communication' and 'empathetic' clearly."
      }
    ],

    Hard: [
      {
        id: 'h1',
        text: "The prerequisite for extraordinary multilingual proficiency is persistent practice.",
        phonetic: "ðə ˌpriːˈrɛkwəzət fɔːr ɪkˈstrɔːrdənɛri ˌmʌltiˈlɪŋɡwəl prəˈfɪʃənsi ɪz pərˈsɪstənt ˈpræktɪs",
        tip: "Challenging multisyllabic vocabulary; maintain steady pacing."
      },
      {
        id: 'h2',
        text: "Phenomenological investigations into linguistic variations yield illuminating insights.",
        phonetic: "fəˌnɑːmənəˈlɑːdʒɪkəl ɪnˌvɛstəˈɡeɪʃənz ˈɪntuː lɪŋˈɡwɪstɪk ˌvɛriˈeɪʃənz jiːld ɪˈluːməneɪtɪŋ ˈɪnsaɪts",
        tip: "High difficulty tongue-twister with academic jargon; articulate each syllable."
      },
      {
        id: 'h3',
        text: "Thirty-three thousand thankful thistles were thoughtfully sorted throughout Thursday.",
        phonetic: "ˈθɜːrti θriː ˈθaʊzənd ˈθæŋkfəl ˈθɪsəlz wɜːr ˈθɔːtfəli ˈsɔːrtəd θruːˈaʊt ˈθɜːrzdeɪ",
        tip: "Extreme 'TH' sound challenge; focus on tongue position against upper teeth."
      }
    ]
  };

  function generateTeamSentenceSet() {
    const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

    const easyPool = shuffleArray(SENTENCE_BANK.Easy).slice(0, 2);
    const modPool = shuffleArray(SENTENCE_BANK.Moderate).slice(0, 2);
    const hardPool = shuffleArray(SENTENCE_BANK.Hard).slice(0, 1);

    return [
      { round: 1, difficulty: 'Easy', ...easyPool[0] },
      { round: 2, difficulty: 'Easy', ...easyPool[1] },
      { round: 3, difficulty: 'Moderate', ...modPool[0] },
      { round: 4, difficulty: 'Moderate', ...modPool[1] },
      { round: 5, difficulty: 'Hard', ...hardPool[0] }
    ];
  }

  // ==========================================
  // 3. LOCAL STORAGE SERVICE
  // ==========================================
  const STORAGE_KEYS = {
    TEAM_ID: 'pb_team_id',
    TEAM_NAME: 'pb_team_name',
    COMPETITION_CODE: 'pb_comp_code',
    MEMBERS: 'pb_team_members',
    SENTENCE_SET: 'pb_sentence_set',
    CURRENT_ROUND_INDEX: 'pb_current_round_idx',
    ROUNDS_DATA: 'pb_rounds_data',
    STATUS: 'pb_battle_status',
    FINAL_RESULT: 'pb_final_result',
    DEVICE_LOCKED: 'pb_device_locked'
  };

  const StorageService = {
    initTeamSession(teamData) {
      try {
        localStorage.setItem(STORAGE_KEYS.TEAM_ID, teamData.id);
        localStorage.setItem(STORAGE_KEYS.TEAM_NAME, teamData.name);
        localStorage.setItem(STORAGE_KEYS.COMPETITION_CODE, teamData.code);
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(teamData.members || []));
        localStorage.setItem(STORAGE_KEYS.SENTENCE_SET, JSON.stringify(teamData.sentences || []));
        localStorage.setItem(STORAGE_KEYS.CURRENT_ROUND_INDEX, '0');
        localStorage.setItem(STORAGE_KEYS.ROUNDS_DATA, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.STATUS, 'Waiting');
        localStorage.setItem(STORAGE_KEYS.DEVICE_LOCKED, 'false');
        localStorage.removeItem(STORAGE_KEYS.FINAL_RESULT);
      } catch (e) {
        console.warn("LocalStorage save warning:", e);
      }
    },

    getSession() {
      try {
        const teamId = localStorage.getItem(STORAGE_KEYS.TEAM_ID);
        if (!teamId) return null;

        return {
          id: teamId,
          name: localStorage.getItem(STORAGE_KEYS.TEAM_NAME) || '',
          code: localStorage.getItem(STORAGE_KEYS.COMPETITION_CODE) || '',
          members: JSON.parse(localStorage.getItem(STORAGE_KEYS.MEMBERS) || '[]'),
          sentences: JSON.parse(localStorage.getItem(STORAGE_KEYS.SENTENCE_SET) || '[]'),
          currentRoundIdx: parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_ROUND_INDEX) || '0', 10),
          roundsData: JSON.parse(localStorage.getItem(STORAGE_KEYS.ROUNDS_DATA) || '[]'),
          status: localStorage.getItem(STORAGE_KEYS.STATUS) || 'Waiting',
          finalResult: JSON.parse(localStorage.getItem(STORAGE_KEYS.FINAL_RESULT) || 'null'),
          isLocked: localStorage.getItem(STORAGE_KEYS.DEVICE_LOCKED) === 'true'
        };
      } catch (e) {
        console.warn("LocalStorage read warning:", e);
        return null;
      }
    },

    saveRoundProgress(roundIndex, roundResult, isBattleFinished = false) {
      const session = this.getSession();
      if (!session) return;

      let roundsData = session.roundsData || [];
      const existingIndex = roundsData.findIndex(r => r && r.roundNum === roundResult.roundNum);
      if (existingIndex >= 0) {
        roundsData[existingIndex] = roundResult;
      } else {
        roundsData.push(roundResult);
      }

      const nextRoundIndex = isBattleFinished ? roundIndex : roundIndex + 1;
      const nextStatus = isBattleFinished ? 'Finished' : 'Playing';

      try {
        localStorage.setItem(STORAGE_KEYS.ROUNDS_DATA, JSON.stringify(roundsData));
        localStorage.setItem(STORAGE_KEYS.CURRENT_ROUND_INDEX, nextRoundIndex.toString());
        localStorage.setItem(STORAGE_KEYS.STATUS, nextStatus);

        if (isBattleFinished) {
          localStorage.setItem(STORAGE_KEYS.DEVICE_LOCKED, 'true');
        }
      } catch (e) {
        console.warn("Save round warning:", e);
      }
    },

    saveFinalResult(finalResult) {
      try {
        localStorage.setItem(STORAGE_KEYS.FINAL_RESULT, JSON.stringify(finalResult));
        localStorage.setItem(STORAGE_KEYS.STATUS, 'Finished');
        localStorage.setItem(STORAGE_KEYS.DEVICE_LOCKED, 'true');
      } catch (e) {
        console.warn("Save final result warning:", e);
      }
    },

    clearSession() {
      try {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      } catch (e) {}
    }
  };

  // ==========================================
  // 4. SPEECH ENGINE & ACCURACY EVALUATION
  // ==========================================
  class SpeechEngine {
    constructor(onResultCallback, onErrorCallback, onStatusChangeCallback) {
      this.onResult = onResultCallback;
      this.onError = onErrorCallback;
      this.onStatusChange = onStatusChangeCallback;

      this.recognition = null;
      this.isListening = false;
      this.supported = false;

      this.initRecognition();
    }

    initRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.warn("Web Speech API is not supported in this browser.");
        this.supported = false;
        return;
      }

      this.supported = true;
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
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
      } catch (e) {
        console.warn("Speech init error:", e);
        this.supported = false;
      }
    }

    start() {
      if (!this.supported) {
        if (this.onError) this.onError("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.");
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
        try {
          this.recognition.stop();
        } catch (e) {}
      }
    }

    static calculateAccuracy(spokenText, targetText) {
      if (!spokenText || spokenText.trim() === '') return 0;

      const normalize = (str) =>
        (str || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

      const targetNorm = normalize(targetText);
      const spokenNorm = normalize(spokenText);

      if (targetNorm === spokenNorm) return 100;

      const targetWords = targetNorm.split(' ');
      const spokenWords = spokenNorm.split(' ');

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
      const distance = SpeechEngine.levenshteinDistance(spokenNorm, targetNorm);
      const maxLength = Math.max(spokenNorm.length, targetNorm.length);
      const charAccuracy = maxLength > 0 ? ((maxLength - distance) / maxLength) * 100 : 0;

      const combinedAccuracy = Math.round((wordAccuracy * 0.60) + (charAccuracy * 0.40));
      return Math.min(100, Math.max(0, combinedAccuracy));
    }

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
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[b.length][a.length];
    }

    static calculateRoundScore(accuracy, retries, penaltyPerRetry = 5) {
      const retryCount = Math.max(0, retries - 1);
      const penaltyPoints = retryCount * penaltyPerRetry;
      const finalScore = Math.max(0, Math.round(accuracy - penaltyPoints));

      return { accuracy, penaltyPoints, finalScore };
    }
  }

  // ==========================================
  // 5. FIREBASE REAL-TIME SERVICE (MOCK FALLBACK)
  // ==========================================
  class FirebaseService {
    constructor() {
      this.broadcastChannel = null;
      this.listeners = new Map();

      if ('BroadcastChannel' in window) {
        try {
          this.broadcastChannel = new BroadcastChannel('pb_firebase_sync');
          this.broadcastChannel.onmessage = (event) => {
            this.handleBroadcastMessage(event.data);
          };
        } catch (e) {}
      }
    }

    async validateCompetitionCode(code) {
      const cleanCode = code ? code.trim().toUpperCase() : '';
      return APP_CONFIG.VALID_COMPETITION_CODES.includes(cleanCode);
    }

    async isTeamNameTaken(compCode, teamName) {
      const normalizedName = (teamName || '').trim().toLowerCase();
      const storedTeams = this.getMockTeams(compCode);
      return storedTeams.some(t => t && t.teamName && t.teamName.toLowerCase() === normalizedName);
    }

    async registerTeam(teamData) {
      const payload = {
        teamId: teamData.id,
        teamName: teamData.name,
        nameLower: (teamData.name || '').toLowerCase(),
        competitionCode: teamData.code,
        members: teamData.members || [],
        status: 'Waiting',
        currentRound: 1,
        currentSpeaker: teamData.members ? teamData.members[0] : 'Member 1',
        currentSentence: teamData.sentences && teamData.sentences[0] ? teamData.sentences[0].text : '',
        currentDifficulty: teamData.sentences && teamData.sentences[0] ? teamData.sentences[0].difficulty : 'Easy',
        roundsData: [],
        finalResult: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.saveMockTeam(teamData.code, payload);
      this.broadcastUpdate('TEAM_REGISTERED', payload);
      return payload;
    }

    async updateTeamProgress(compCode, teamId, updateData) {
      const team = this.getMockTeam(compCode, teamId);
      if (team) {
        Object.assign(team, updateData, { updatedAt: new Date().toISOString() });
        this.saveMockTeam(compCode, team);
      }
      this.broadcastUpdate('TEAM_UPDATED', { compCode, teamId, updateData });
    }

    async recordRoundResult(compCode, teamId, roundResult, nextRoundInfo = null) {
      const team = this.getMockTeam(compCode, teamId) || {};
      const updatedRounds = [...(team.roundsData || [])];
      const existingIdx = updatedRounds.findIndex(r => r && r.roundNum === roundResult.roundNum);

      if (existingIdx >= 0) {
        updatedRounds[existingIdx] = roundResult;
      } else {
        updatedRounds.push(roundResult);
      }

      const updates = {
        roundsData: updatedRounds,
        status: nextRoundInfo ? 'Playing' : 'Finished',
        updatedAt: new Date().toISOString()
      };

      if (nextRoundInfo) {
        updates.currentRound = nextRoundInfo.roundNum;
        updates.currentSpeaker = nextRoundInfo.speaker;
        updates.currentSentence = nextRoundInfo.sentence;
        updates.currentDifficulty = nextRoundInfo.difficulty;
      }

      Object.assign(team, updates);
      this.saveMockTeam(compCode, team);
      this.broadcastUpdate('ROUND_RECORDED', { compCode, teamId, roundResult, updates });
    }

    async finalizeBattle(compCode, teamId, finalResult) {
      const team = this.getMockTeam(compCode, teamId);
      if (team) {
        Object.assign(team, { status: 'Finished', finalResult, updatedAt: new Date().toISOString() });
        this.saveMockTeam(compCode, team);
      }
      this.broadcastUpdate('BATTLE_FINISHED', { compCode, teamId, finalResult });
    }

    subscribeToHostMonitoring(compCode, callback) {
      const updateHandler = () => {
        const teams = this.getMockTeams(compCode);
        callback(teams);
      };

      this.listeners.set(compCode, updateHandler);
      updateHandler();

      return () => this.listeners.delete(compCode);
    }

    getMockTeams(compCode) {
      try {
        const raw = localStorage.getItem(`pb_mock_db_${compCode}`);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    getMockTeam(compCode, teamId) {
      const teams = this.getMockTeams(compCode);
      return teams.find(t => t && t.teamId === teamId) || null;
    }

    saveMockTeam(compCode, teamData) {
      try {
        const teams = this.getMockTeams(compCode);
        const idx = teams.findIndex(t => t && t.teamId === teamData.teamId);
        if (idx >= 0) {
          teams[idx] = { ...teams[idx], ...teamData };
        } else {
          teams.push(teamData);
        }
        localStorage.setItem(`pb_mock_db_${compCode}`, JSON.stringify(teams));
      } catch (e) {}
    }

    broadcastUpdate(type, data) {
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
        } catch (e) {}
      }
    }

    handleBroadcastMessage(msg) {
      if (!msg || !msg.type) return;
      this.listeners.forEach(handler => handler());
    }
  }

  const firebaseService = new FirebaseService();

  // ==========================================
  // 6. HOST DASHBOARD COMPONENT
  // ==========================================
  class HostDashboard {
    constructor(containerElement) {
      this.container = containerElement;
      this.activeCompCode = 'POLYGLOT2026';
      this.unsubscribe = null;
      this.teams = [];

      this.initUI();
    }

    initUI() {
      this.container.innerHTML = `
        <div class="bg-[#040c24] border border-[#8A2BE2]/50 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-slate-100 max-w-6xl mx-auto my-6">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-[#8A2BE2]/30">
            <div>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF00EF] via-[#8A2BE2] to-[#004BFF] p-0.5 shadow-lg shadow-[#FF00EF]/40 flex items-center justify-center">
                  <div class="w-full h-full bg-[#040c24] rounded-[10px] flex items-center justify-center">
                    <i class="fas fa-infinity text-xl text-transparent bg-clip-text bg-gradient-to-tr from-[#FF00EF] to-[#8A2BE2]"></i>
                  </div>
                </div>
                <div>
                  <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF00EF] via-purple-300 to-indigo-200">
                    Host Live Monitoring Dashboard
                  </h2>
                  <p class="text-xs text-purple-300">Polyglot Communication Club • Real-Time Competition Feed</p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 w-full md:w-auto">
              <div class="relative flex-1 md:w-48">
                <input type="text" id="hostCompCodeInput" value="${this.activeCompCode}" 
                  class="w-full bg-[#030a21] border border-[#8A2BE2]/40 rounded-lg px-3 py-1.5 text-sm uppercase text-[#FF00EF] font-mono tracking-wider focus:outline-none focus:border-[#FF00EF]" 
                  placeholder="Comp Code">
              </div>
              <button id="btnConnectHost" class="btn-neon-pink font-bold px-4 py-1.5 rounded-lg text-sm transition flex items-center gap-2 cursor-pointer">
                <i class="fas fa-sync-alt text-xs"></i> Monitor
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            <div class="bg-[#030a21]/80 border border-[#8A2BE2]/30 rounded-xl p-4">
              <p class="text-xs text-slate-400 font-medium">Total Registered Teams</p>
              <p id="statTotalTeams" class="text-2xl font-bold text-slate-100">0</p>
            </div>
            <div class="bg-[#030a21]/80 border border-emerald-900/40 rounded-xl p-4">
              <p class="text-xs text-emerald-400 font-medium">Currently Playing</p>
              <p id="statPlayingTeams" class="text-2xl font-bold text-emerald-400">0</p>
            </div>
            <div class="bg-[#030a21]/80 border border-blue-900/40 rounded-xl p-4">
              <p class="text-xs text-blue-400 font-medium">Battles Completed</p>
              <p id="statFinishedTeams" class="text-2xl font-bold text-blue-400">0</p>
            </div>
            <div class="bg-[#030a21]/80 border border-yellow-500/40 rounded-xl p-4">
              <p class="text-xs text-yellow-400 font-medium">Top Score Leader</p>
              <p id="statTopScore" class="text-xl font-bold text-yellow-300 truncate">None</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-[#FF00EF] animate-ping"></span> Live Team Feed
              </h3>
              <span class="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                ● Connected
              </span>
            </div>
            <div id="hostTeamsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[220px]"></div>
          </div>
        </div>
      `;

      this.bindEvents();
      this.startListening(this.activeCompCode);
    }

    bindEvents() {
      const btnConnect = this.container.querySelector('#btnConnectHost');
      const inputCode = this.container.querySelector('#hostCompCodeInput');

      if (btnConnect && inputCode) {
        btnConnect.addEventListener('click', () => {
          const code = inputCode.value.trim().toUpperCase();
          if (code) {
            this.activeCompCode = code;
            this.startListening(code);
          }
        });
      }
    }

    startListening(code) {
      if (this.unsubscribe) this.unsubscribe();
      this.unsubscribe = firebaseService.subscribeToHostMonitoring(code, (teams) => {
        this.teams = teams || [];
        this.renderTeams();
      });
    }

    renderTeams() {
      const listContainer = this.container.querySelector('#hostTeamsList');
      const totalEl = this.container.querySelector('#statTotalTeams');
      const playingEl = this.container.querySelector('#statPlayingTeams');
      const finishedEl = this.container.querySelector('#statFinishedTeams');
      const topScoreEl = this.container.querySelector('#statTopScore');

      if (!listContainer) return;

      const safeTeams = (this.teams || []).filter(Boolean);

      totalEl.textContent = safeTeams.length;
      playingEl.textContent = safeTeams.filter(t => t.status === 'Playing').length;
      finishedEl.textContent = safeTeams.filter(t => t.status === 'Finished').length;

      const finishedWithScores = safeTeams
        .filter(t => t && t.finalResult)
        .sort((a, b) => (b.finalResult.finalScore || 0) - (a.finalResult.finalScore || 0));

      if (finishedWithScores.length > 0) {
        const top = finishedWithScores[0];
        topScoreEl.textContent = `${top.teamName || 'Team'} (${top.finalResult.finalScore || 0} pts)`;
      } else {
        topScoreEl.textContent = 'None';
      }

      if (safeTeams.length === 0) {
        listContainer.innerHTML = `
          <div class="col-span-full flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-[#8A2BE2]/30 rounded-xl">
            <i class="fas fa-users text-3xl mb-2 text-purple-300"></i>
            <p class="text-sm">No teams registered under competition code <span class="text-[#FF00EF] font-mono">${this.activeCompCode}</span> yet.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = safeTeams.map(team => {
        const statusBadge = team.status === 'Finished'
          ? '<span class="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-medium">Finished</span>'
          : team.status === 'Playing'
          ? '<span class="bg-[#FF00EF]/20 text-[#FF00EF] border border-[#FF00EF]/40 text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">Playing</span>'
          : '<span class="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full font-medium">Waiting</span>';

        const lastRound = team.roundsData && team.roundsData.length > 0
          ? team.roundsData[team.roundsData.length - 1]
          : null;

        const membersList = (team.members || []).join(', ') || 'No members listed';

        return `
          <div class="bg-[#030a21]/90 border border-[#8A2BE2]/40 rounded-xl p-4 flex flex-col justify-between hover:border-[#FF00EF]/60 transition shadow-lg">
            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-bold text-slate-100 text-lg flex items-center gap-2">
                  <i class="fas fa-shield-alt text-[#FF00EF] text-sm"></i> ${team.teamName || 'Team'}
                </h4>
                ${statusBadge}
              </div>
              <div class="text-xs text-slate-400 space-y-1 mb-3">
                <p><i class="fas fa-users text-purple-400 mr-1"></i> ${membersList}</p>
                <p><i class="fas fa-flag text-purple-400 mr-1"></i> Round: <span class="text-slate-200 font-bold">${team.currentRound || 1}/5</span> (${team.currentDifficulty || 'Easy'})</p>
                <p><i class="fas fa-microphone text-purple-400 mr-1"></i> Speaker: <span class="text-[#FF00EF] font-bold">${team.currentSpeaker || 'N/A'}</span></p>
              </div>
              ${lastRound ? `
                <div class="bg-[#0b163d] rounded-lg p-2.5 border border-[#8A2BE2]/30 text-xs space-y-1">
                  <div class="flex justify-between font-mono">
                    <span class="text-slate-400">Latest Accuracy:</span>
                    <span class="font-bold ${lastRound.accuracy >= 80 ? 'text-emerald-400' : 'text-[#FF00EF]'}">${lastRound.accuracy || 0}%</span>
                  </div>
                  <p class="text-slate-300 italic truncate" title="${lastRound.transcript || 'No speech recorded'}">
                    "${lastRound.transcript || 'No speech recorded'}"
                  </p>
                </div>
              ` : ''}
            </div>
            ${team.finalResult ? `
              <div class="mt-4 pt-3 border-t border-[#8A2BE2]/30 flex items-center justify-between text-xs">
                <span class="text-slate-400">Final Score:</span>
                <span class="text-xl font-black text-yellow-300 font-mono">
                  ${team.finalResult.finalScore || 0} pts
                </span>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  }

  // ==========================================
  // 7. MAIN APPLICATION CONTROLLER
  // ==========================================
  class PronunciationBattleApp {
    constructor() {
      this.session = null;
      this.speechEngine = null;
      this.hostDashboard = null;

      this.currentAttempt = {
        transcript: '',
        isFinal: false,
        accuracy: 0,
        retries: 1,
        evaluatedScore: null
      };

      this.init();
    }

    init() {
      this.bindDOM();
      this.initSpeechEngine();
      this.checkSessionAndRoute();
    }

    bindDOM() {
      this.viewRegistration = document.getElementById('viewRegistration');
      this.viewBattle = document.getElementById('viewBattle');
      this.viewResult = document.getElementById('viewResult');
      this.viewHostModal = document.getElementById('viewHostModal');

      this.formRegistration = document.getElementById('formRegistration');
      this.inputCompCode = document.getElementById('inputCompCode');
      this.inputTeamName = document.getElementById('inputTeamName');
      this.inputMember1 = document.getElementById('inputMember1');
      this.inputMember2 = document.getElementById('inputMember2');
      this.inputMember3 = document.getElementById('inputMember3');
      this.regErrorMessage = document.getElementById('regErrorMessage');
      this.btnRegisterTeam = document.getElementById('btnRegisterTeam');

      this.txtBattleTeamName = document.getElementById('txtBattleTeamName');
      this.txtCurrentSpeaker = document.getElementById('txtCurrentSpeaker');
      this.txtCurrentRoundNum = document.getElementById('txtCurrentRoundNum');
      this.badgeDifficulty = document.getElementById('badgeDifficulty');
      this.txtTargetSentence = document.getElementById('txtTargetSentence');
      this.txtPhoneticTip = document.getElementById('txtPhoneticTip');

      this.btnMicRecord = document.getElementById('btnMicRecord');
      this.micIcon = document.getElementById('micIcon');
      this.micStatusText = document.getElementById('micStatusText');
      this.audioWaveVisualizer = document.getElementById('audioWaveVisualizer');
      this.txtLiveTranscript = document.getElementById('txtLiveTranscript');

      this.boxScoreFeedback = document.getElementById('boxScoreFeedback');
      this.txtAccuracyScore = document.getElementById('txtAccuracyScore');
      this.txtPenaltyScore = document.getElementById('txtPenaltyScore');
      this.txtFinalRoundScore = document.getElementById('txtFinalRoundScore');
      this.txtRetryCount = document.getElementById('txtRetryCount');
      this.btnSubmitRound = document.getElementById('btnSubmitRound');
      this.btnRetrySpeech = document.getElementById('btnRetrySpeech');

      this.txtResultTeamName = document.getElementById('txtResultTeamName');
      this.txtResultFinalScore = document.getElementById('txtResultFinalScore');
      this.txtResultAvgAccuracy = document.getElementById('txtResultAvgAccuracy');
      this.txtResultTotalRetries = document.getElementById('txtResultTotalRetries');
      this.txtResultTotalPenalties = document.getElementById('txtResultTotalPenalties');
      this.containerRoundsBreakdown = document.getElementById('containerRoundsBreakdown');
      this.btnResetDeviceLock = document.getElementById('btnResetDeviceLock');

      this.btnToggleHostView = document.getElementById('btnToggleHostView');
      this.btnCloseHostModal = document.getElementById('btnCloseHostModal');
    }

    initSpeechEngine() {
      this.speechEngine = new SpeechEngine(
        (transcript, isFinal) => this.handleSpeechResult(transcript, isFinal),
        (errorMsg) => this.handleSpeechError(errorMsg),
        (status) => this.handleSpeechStatusChange(status)
      );
    }

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
      if (this.viewRegistration) this.viewRegistration.classList.add('hidden');
      if (this.viewBattle) this.viewBattle.classList.add('hidden');
      if (this.viewResult) this.viewResult.classList.add('hidden');

      if (viewName === 'registration' && this.viewRegistration) this.viewRegistration.classList.remove('hidden');
      if (viewName === 'battle' && this.viewBattle) this.viewBattle.classList.remove('hidden');
      if (viewName === 'result' && this.viewResult) this.viewResult.classList.remove('hidden');
    }

    async handleRegistration(event) {
      if (event && event.preventDefault) event.preventDefault();
      this.bindDOM();

      if (this.regErrorMessage) this.regErrorMessage.classList.add('hidden');
      if (this.btnRegisterTeam) {
        this.btnRegisterTeam.disabled = true;
        this.btnRegisterTeam.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Registering Team...`;
      }

      try {
        const code = this.inputCompCode ? this.inputCompCode.value.trim().toUpperCase() : 'POLYGLOT2026';
        const teamName = this.inputTeamName ? this.inputTeamName.value.trim() : 'Team';
        const member1 = this.inputMember1 ? this.inputMember1.value.trim() : 'Member 1';
        const member2 = this.inputMember2 ? this.inputMember2.value.trim() : 'Member 2';
        const member3 = this.inputMember3 ? this.inputMember3.value.trim() : 'Member 3';

        if (!code || !teamName || !member1 || !member2 || !member3) {
          this.showRegError("Please fill in all fields including the 3 team member names.");
          return;
        }

        const isValidCode = await firebaseService.validateCompetitionCode(code);
        if (!isValidCode) {
          this.showRegError(`Invalid Competition Code '${code}'. Accepted codes: POLYGLOT2026, BATTLE2026, CLUB100, DEMO2026.`);
          return;
        }

        const sentenceSet = generateTeamSentenceSet();
        const uniqueTeamId = `team_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;

        const teamData = {
          id: uniqueTeamId,
          name: teamName,
          code: code,
          members: [member1, member2, member3],
          sentences: sentenceSet
        };

        StorageService.initTeamSession(teamData);
        firebaseService.registerTeam(teamData);

        this.session = StorageService.getSession();
        this.showView('battle');
        this.loadRoundState();
      } catch (err) {
        console.error("Registration Exception:", err);
        this.showView('battle');
      } finally {
        this.resetRegButton();
      }
    }

    showRegError(msg) {
      if (this.regErrorMessage) {
        this.regErrorMessage.textContent = msg;
        this.regErrorMessage.classList.remove('hidden');
      }
    }

    resetRegButton() {
      if (this.btnRegisterTeam) {
        this.btnRegisterTeam.disabled = false;
        this.btnRegisterTeam.innerHTML = `<i class="fas fa-rocket mr-2"></i> Register Team & Start Battle`;
      }
    }

    loadRoundState() {
      this.bindDOM();
      if (!this.session || !this.session.sentences) return;

      const roundIndex = this.session.currentRoundIdx || 0;
      if (roundIndex >= 5) {
        this.finishBattle();
        return;
      }

      const currentSentenceObj = this.session.sentences[roundIndex];
      const members = this.session.members || ['Member 1', 'Member 2', 'Member 3'];
      const currentMember = members[roundIndex % members.length];

      if (this.txtBattleTeamName) this.txtBattleTeamName.textContent = this.session.name;
      if (this.txtCurrentRoundNum) this.txtCurrentRoundNum.textContent = `${roundIndex + 1} / 5`;
      if (this.txtCurrentSpeaker) this.txtCurrentSpeaker.textContent = currentMember;
      if (this.txtTargetSentence) this.txtTargetSentence.textContent = currentSentenceObj.text;
      if (this.txtPhoneticTip) this.txtPhoneticTip.textContent = `💡 Phonetic Tip: ${currentSentenceObj.tip || currentSentenceObj.phonetic}`;

      if (this.badgeDifficulty) {
        this.badgeDifficulty.textContent = currentSentenceObj.difficulty;
        this.badgeDifficulty.className = 'px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ';
        if (currentSentenceObj.difficulty === 'Easy') this.badgeDifficulty.classList.add('badge-easy');
        if (currentSentenceObj.difficulty === 'Moderate') this.badgeDifficulty.classList.add('badge-moderate');
        if (currentSentenceObj.difficulty === 'Hard') this.badgeDifficulty.classList.add('badge-hard');
      }

      this.currentAttempt = {
        transcript: '',
        isFinal: false,
        accuracy: 0,
        retries: 1,
        evaluatedScore: null
      };

      this.resetSpeechControlsUI();

      firebaseService.updateTeamProgress(this.session.code, this.session.id, {
        status: 'Playing',
        currentRound: roundIndex + 1,
        currentSpeaker: currentMember,
        currentSentence: currentSentenceObj.text,
        currentDifficulty: currentSentenceObj.difficulty
      });
    }

    resetSpeechControlsUI() {
      if (this.txtLiveTranscript) {
        this.txtLiveTranscript.textContent = 'Press the microphone button and speak clearly into your device...';
        this.txtLiveTranscript.className = 'text-slate-400 italic font-mono text-sm leading-relaxed';
      }
      if (this.boxScoreFeedback) this.boxScoreFeedback.classList.add('hidden');
      if (this.btnSubmitRound) this.btnSubmitRound.classList.add('hidden');
      if (this.btnRetrySpeech) this.btnRetrySpeech.classList.add('hidden');
      if (this.txtRetryCount) this.txtRetryCount.textContent = `Attempt 1 of ${APP_CONFIG.MAX_RETRIES_PER_ROUND}`;
      if (this.audioWaveVisualizer) this.audioWaveVisualizer.classList.add('hidden');
      if (this.micStatusText) this.micStatusText.textContent = 'Tap Microphone to Speak';
      if (this.btnMicRecord) {
        this.btnMicRecord.className = 'w-20 h-20 rounded-full btn-neon-pink text-3xl font-bold flex items-center justify-center shadow-2xl cursor-pointer';
      }
    }

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
        if (this.micStatusText) this.micStatusText.textContent = 'Listening... Speak Now!';
        if (this.btnMicRecord) this.btnMicRecord.classList.add('mic-recording-pulse');
        if (this.audioWaveVisualizer) this.audioWaveVisualizer.classList.remove('hidden');
        if (this.txtLiveTranscript) this.txtLiveTranscript.textContent = 'Listening for speech...';
      } else if (status === 'idle') {
        if (this.btnMicRecord) this.btnMicRecord.classList.remove('mic-recording-pulse');
        if (this.audioWaveVisualizer) this.audioWaveVisualizer.classList.add('hidden');
        if (this.micStatusText) {
          this.micStatusText.textContent = this.currentAttempt.transcript ? 'Speech Captured' : 'Tap Microphone to Speak';
        }
      }
    }

    handleSpeechError(errorMsg) {
      if (this.micStatusText) this.micStatusText.textContent = 'Microphone Error';
      if (this.txtLiveTranscript) {
        this.txtLiveTranscript.textContent = `Error: ${errorMsg}. Please ensure microphone permissions are granted.`;
        this.txtLiveTranscript.className = 'text-red-400 font-mono text-sm';
      }
    }

    handleSpeechResult(transcript, isFinal) {
      this.currentAttempt.transcript = transcript;
      this.currentAttempt.isFinal = isFinal;

      if (this.txtLiveTranscript) {
        this.txtLiveTranscript.textContent = `"${transcript}"`;
        this.txtLiveTranscript.className = 'text-slate-100 font-medium text-lg leading-relaxed';
      }

      const targetText = this.session.sentences[this.session.currentRoundIdx || 0].text;
      const accuracy = SpeechEngine.calculateAccuracy(transcript, targetText);
      this.currentAttempt.accuracy = accuracy;

      const evaluated = SpeechEngine.calculateRoundScore(
        accuracy,
        this.currentAttempt.retries,
        APP_CONFIG.PENALTY_PER_RETRY
      );
      this.currentAttempt.evaluatedScore = evaluated;

      this.renderAttemptFeedback(evaluated);
    }

    renderAttemptFeedback(scoreObj) {
      if (this.boxScoreFeedback) this.boxScoreFeedback.classList.remove('hidden');
      if (this.txtAccuracyScore) this.txtAccuracyScore.textContent = `${scoreObj.accuracy}%`;
      if (this.txtPenaltyScore) this.txtPenaltyScore.textContent = `-${scoreObj.penaltyPoints} pts`;
      if (this.txtFinalRoundScore) this.txtFinalRoundScore.textContent = `${scoreObj.finalScore} pts`;

      if (this.btnSubmitRound) this.btnSubmitRound.classList.remove('hidden');

      if (this.currentAttempt.retries < APP_CONFIG.MAX_RETRIES_PER_ROUND) {
        if (this.btnRetrySpeech) this.btnRetrySpeech.classList.remove('hidden');
      } else {
        if (this.btnRetrySpeech) this.btnRetrySpeech.classList.add('hidden');
        if (this.txtRetryCount) this.txtRetryCount.textContent = `Max Attempts Reached (3/3)`;
      }
    }

    handleRetryAttempt() {
      if (this.currentAttempt.retries >= APP_CONFIG.MAX_RETRIES_PER_ROUND) return;

      this.currentAttempt.retries += 1;
      this.currentAttempt.transcript = '';
      this.currentAttempt.accuracy = 0;
      this.currentAttempt.evaluatedScore = null;

      this.resetSpeechControlsUI();
      if (this.txtRetryCount) this.txtRetryCount.textContent = `Attempt ${this.currentAttempt.retries} of ${APP_CONFIG.MAX_RETRIES_PER_ROUND}`;
      setTimeout(() => this.toggleRecording(), 300);
    }

    async submitRound() {
      if (!this.session || !this.currentAttempt.evaluatedScore) return;

      const roundIdx = this.session.currentRoundIdx || 0;
      const currentSentenceObj = this.session.sentences[roundIdx];
      const members = this.session.members || ['Member 1', 'Member 2', 'Member 3'];
      const speaker = members[roundIdx % members.length];

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
      StorageService.saveRoundProgress(roundIdx, roundResult, isLastRound);
      this.session = StorageService.getSession();

      let nextRoundInfo = null;
      if (!isLastRound) {
        const nextIdx = roundIdx + 1;
        nextRoundInfo = {
          roundNum: nextIdx + 1,
          speaker: members[nextIdx % members.length],
          sentence: this.session.sentences[nextIdx].text,
          difficulty: this.session.sentences[nextIdx].difficulty
        };
      }

      firebaseService.recordRoundResult(this.session.code, this.session.id, roundResult, nextRoundInfo);

      if (isLastRound) {
        this.finishBattle();
      } else {
        this.loadRoundState();
      }
    }

    finishBattle() {
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

      StorageService.saveFinalResult(finalResultObj);
      firebaseService.finalizeBattle(this.session.code, this.session.id, finalResultObj);

      this.session = StorageService.getSession();
      this.showView('result');
      this.renderResultsScreen();
    }

    renderResultsScreen() {
      this.bindDOM();
      if (!this.session) return;

      const res = this.session.finalResult || { averageAccuracy: 0, totalRetries: 0, totalPenalties: 0, finalScore: 0 };
      if (this.txtResultTeamName) this.txtResultTeamName.textContent = this.session.name;
      if (this.txtResultFinalScore) this.txtResultFinalScore.textContent = `${res.finalScore}`;
      if (this.txtResultAvgAccuracy) this.txtResultAvgAccuracy.textContent = `${res.averageAccuracy}%`;
      if (this.txtResultTotalRetries) this.txtResultTotalRetries.textContent = `${res.totalRetries}`;
      if (this.txtResultTotalPenalties) this.txtResultTotalPenalties.textContent = `-${res.totalPenalties} pts`;

      const rounds = this.session.roundsData || [];
      if (this.containerRoundsBreakdown) {
        this.containerRoundsBreakdown.innerHTML = rounds.map(r => `
          <div class="bg-[#030a21]/90 border border-[#8A2BE2]/40 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-[#FF00EF]">Round ${r.roundNum} (${r.difficulty})</span>
              <span class="text-slate-400"><i class="fas fa-user text-purple-400 mr-1"></i> ${r.speaker}</span>
            </div>
            <p class="text-sm font-medium text-slate-200">"${r.targetSentence}"</p>
            <p class="text-xs text-slate-400 italic">Recognized: "${r.transcript || 'None'}"</p>
            <div class="flex items-center justify-between pt-2 border-t border-[#8A2BE2]/30 text-xs font-mono">
              <span class="text-emerald-400">Accuracy: ${r.accuracy}%</span>
              <span class="text-[#FF00EF]">Penalties: -${r.penalty} pts</span>
              <span class="font-bold text-yellow-300">Score: ${r.score} pts</span>
            </div>
          </div>
        `).join('');
      }
    }

    openHostModal() {
      this.bindDOM();
      if (this.viewHostModal) this.viewHostModal.classList.remove('hidden');
      const container = document.getElementById('hostDashboardContainer');
      if (container) {
        this.hostDashboard = new HostDashboard(container);
      }
    }

    closeHostModal() {
      this.bindDOM();
      if (this.viewHostModal) this.viewHostModal.classList.add('hidden');
    }

    handleAdminReset() {
      if (confirm("Reset this device session to start a new team battle?")) {
        StorageService.clearSession();
        window.location.reload();
      }
    }
  }

  // Instant global instantiation
  const initApp = () => {
    if (!window.app) {
      window.app = new PronunciationBattleApp();
    } else if (window.app.bindDOM) {
      window.app.bindDOM();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  }
  
  // Instant instantiation for script execution
  initApp();
})();
