/**
 * Pronunciation Battle - Firebase Real-Time Synchronization Service
 * Supports official Firebase Firestore Web SDK v10 with Timeout Protection & BroadcastChannel Fallback
 */

import { APP_CONFIG } from './config.js';

class FirebaseService {
  constructor() {
    this.db = null;
    this.isRealFirebaseActive = false;
    this.broadcastChannel = null;
    this.listeners = new Map();

    this.init();
  }

  async init() {
    // Setup local BroadcastChannel fallback for multi-window sync without server keys
    if ('BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('pb_firebase_sync');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    }

    // Only activate real Firebase if a non-demo API Key is provided
    const apiKey = APP_CONFIG.FIREBASE_CONFIG?.apiKey || '';
    const isDemoKey = apiKey.includes('DemoKey') || apiKey.includes('YOUR_API_KEY');

    try {
      if (!isDemoKey && window.firebase && window.firebase.firestore) {
        if (!firebase.apps.length) {
          firebase.initializeApp(APP_CONFIG.FIREBASE_CONFIG);
        }
        this.db = firebase.firestore();
        this.isRealFirebaseActive = true;
        console.log("🔥 Firebase Firestore successfully initialized with live cloud DB!");
      } else {
        console.log("⚡ Using Fast Local & Multi-Tab Broadcast Sync Engine (Mock Firebase)");
        this.isRealFirebaseActive = false;
      }
    } catch (e) {
      console.warn("Real Firebase init failed, running on Mock Broadcast engine:", e);
      this.isRealFirebaseActive = false;
    }
  }

  /**
   * Utility: Execute Firestore operation with a fast 1500ms timeout
   */
  async withTimeout(promise, timeoutMs = 1500) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * Validate Competition Code in Firebase / Stored Database
   */
  async validateCompetitionCode(code) {
    const cleanCode = code ? code.trim().toUpperCase() : '';
    if (!cleanCode) return false;

    // Check pre-configured codes first
    if (APP_CONFIG.VALID_COMPETITION_CODES.includes(cleanCode)) {
      return true;
    }

    // If real Firestore is enabled, check competitions collection
    if (this.isRealFirebaseActive) {
      try {
        const doc = await this.withTimeout(
          this.db.collection('competitions').doc(cleanCode).get()
        );
        return doc.exists;
      } catch (err) {
        console.warn("Error validating competition code on Firestore, using fallback:", err);
      }
    }

    return false;
  }

  /**
   * Check if team name is already registered for this competition
   */
  async isTeamNameTaken(compCode, teamName) {
    const normalizedName = teamName.trim().toLowerCase();

    if (this.isRealFirebaseActive) {
      try {
        const snapshot = await this.withTimeout(
          this.db.collection('competitions')
            .doc(compCode)
            .collection('teams')
            .where('nameLower', '==', normalizedName)
            .get()
        );
        return !snapshot.empty;
      } catch (e) {
        console.warn("Firestore team name check timeout/warning, using local storage check:", e);
      }
    }

    // Mock check against local stored team list
    const storedTeams = this.getMockTeams(compCode);
    return storedTeams.some(t => t.teamName.toLowerCase() === normalizedName);
  }

  /**
   * Register Team & create Competition doc in Firebase
   */
  async registerTeam(teamData) {
    const payload = {
      teamId: teamData.id,
      teamName: teamData.name,
      nameLower: teamData.name.toLowerCase(),
      competitionCode: teamData.code,
      members: teamData.members,
      status: 'Waiting', // 'Waiting' | 'Playing' | 'Finished'
      currentRound: 1,
      currentSpeaker: teamData.members[0] || 'Member 1',
      currentSentence: teamData.sentences[0]?.text || '',
      currentDifficulty: teamData.sentences[0]?.difficulty || 'Easy',
      roundsData: [],
      finalResult: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.isRealFirebaseActive) {
      try {
        await this.withTimeout(
          this.db.collection('competitions')
            .doc(teamData.code)
            .collection('teams')
            .doc(teamData.id)
            .set(payload)
        );
      } catch (err) {
        console.warn("Firestore registerTeam warning:", err);
      }
    }

    // Always update mock local storage list for live host monitoring & instant UI speed
    this.saveMockTeam(teamData.code, payload);
    this.broadcastUpdate('TEAM_REGISTERED', payload);

    return payload;
  }

  /**
   * Update team progress & current round state in Firebase
   */
  async updateTeamProgress(compCode, teamId, updateData) {
    const payload = {
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.isRealFirebaseActive) {
      try {
        await this.withTimeout(
          this.db.collection('competitions')
            .doc(compCode)
            .collection('teams')
            .doc(teamId)
            .update(payload)
        );
      } catch (err) {
        console.warn("Firestore updateTeamProgress warning:", err);
      }
    }

    // Update Mock database
    const team = this.getMockTeam(compCode, teamId);
    if (team) {
      Object.assign(team, payload);
      this.saveMockTeam(compCode, team);
    }

    this.broadcastUpdate('TEAM_UPDATED', { compCode, teamId, payload });
  }

  /**
   * Record Round Result (Recognized speech, accuracy, retries, penalty, score)
   */
  async recordRoundResult(compCode, teamId, roundResult, nextRoundInfo = null) {
    const team = this.getMockTeam(compCode, teamId) || {};
    const updatedRounds = [...(team.roundsData || [])];
    
    const existingIdx = updatedRounds.findIndex(r => r.roundNum === roundResult.roundNum);
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

    if (this.isRealFirebaseActive) {
      try {
        await this.withTimeout(
          this.db.collection('competitions')
            .doc(compCode)
            .collection('teams')
            .doc(teamId)
            .update(updates)
        );
      } catch (err) {
        console.warn("Firestore recordRoundResult warning:", err);
      }
    }

    Object.assign(team, updates);
    this.saveMockTeam(compCode, team);
    this.broadcastUpdate('ROUND_RECORDED', { compCode, teamId, roundResult, updates });
  }

  /**
   * Finalize Battle & save score summary
   */
  async finalizeBattle(compCode, teamId, finalResult) {
    const updates = {
      status: 'Finished',
      finalResult: finalResult,
      updatedAt: new Date().toISOString()
    };

    if (this.isRealFirebaseActive) {
      try {
        await this.withTimeout(
          this.db.collection('competitions')
            .doc(compCode)
            .collection('teams')
            .doc(teamId)
            .update(updates)
        );
      } catch (err) {
        console.warn("Firestore finalizeBattle warning:", err);
      }
    }

    const team = this.getMockTeam(compCode, teamId);
    if (team) {
      Object.assign(team, updates);
      this.saveMockTeam(compCode, team);
    }

    this.broadcastUpdate('BATTLE_FINISHED', { compCode, teamId, finalResult });
  }

  /**
   * Real-time Listener for Host Dashboard (Listens to all teams in competition)
   */
  subscribeToHostMonitoring(compCode, callback) {
    if (this.isRealFirebaseActive) {
      try {
        const unsubscribe = this.db.collection('competitions')
          .doc(compCode)
          .collection('teams')
          .onSnapshot((snapshot) => {
            const teams = [];
            snapshot.forEach(doc => teams.push(doc.data()));
            callback(teams);
          });
        return unsubscribe;
      } catch (err) {
        console.warn("Firestore snapshot listener failed, using mock listener:", err);
      }
    }

    // Mock Live Listener using BroadcastChannel + Polling
    const updateHandler = () => {
      const teams = this.getMockTeams(compCode);
      callback(teams);
    };

    this.listeners.set(compCode, updateHandler);
    updateHandler(); // Immediate initial trigger

    return () => this.listeners.delete(compCode);
  }

  // --- Mock Storage & Broadcast Helpers ---

  getMockTeams(compCode) {
    const raw = localStorage.getItem(`pb_mock_db_${compCode}`);
    return raw ? JSON.parse(raw) : [];
  }

  getMockTeam(compCode, teamId) {
    const teams = this.getMockTeams(compCode);
    return teams.find(t => t.teamId === teamId) || null;
  }

  saveMockTeam(compCode, teamData) {
    const teams = this.getMockTeams(compCode);
    const idx = teams.findIndex(t => t.teamId === teamData.teamId);
    if (idx >= 0) {
      teams[idx] = { ...teams[idx], ...teamData };
    } else {
      teams.push(teamData);
    }
    localStorage.setItem(`pb_mock_db_${compCode}`, JSON.stringify(teams));
  }

  broadcastUpdate(type, data) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type, data, timestamp: Date.now() });
    }
  }

  handleBroadcastMessage(msg) {
    if (!msg || !msg.type) return;
    this.listeners.forEach((handler) => handler());
  }
}

export const firebaseService = new FirebaseService();
