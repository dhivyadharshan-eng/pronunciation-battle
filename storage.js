/**
 * Pronunciation Battle - LocalStorage Management & Refresh Protection
 */

const STORAGE_KEYS = {
  TEAM_ID: 'pb_team_id',
  TEAM_NAME: 'pb_team_name',
  COMPETITION_CODE: 'pb_comp_code',
  MEMBERS: 'pb_team_members',
  SENTENCE_SET: 'pb_sentence_set',
  CURRENT_ROUND_INDEX: 'pb_current_round_idx',
  ROUNDS_DATA: 'pb_rounds_data',
  STATUS: 'pb_battle_status', // 'Waiting' | 'Playing' | 'Finished'
  FINAL_RESULT: 'pb_final_result',
  DEVICE_LOCKED: 'pb_device_locked'
};

export const StorageService = {
  /**
   * Save initial team registration details and sentence set
   */
  initTeamSession(teamData) {
    localStorage.setItem(STORAGE_KEYS.TEAM_ID, teamData.id);
    localStorage.setItem(STORAGE_KEYS.TEAM_NAME, teamData.name);
    localStorage.setItem(STORAGE_KEYS.COMPETITION_CODE, teamData.code);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(teamData.members));
    localStorage.setItem(STORAGE_KEYS.SENTENCE_SET, JSON.stringify(teamData.sentences));
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROUND_INDEX, '0');
    localStorage.setItem(STORAGE_KEYS.ROUNDS_DATA, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STATUS, 'Waiting');
    localStorage.setItem(STORAGE_KEYS.DEVICE_LOCKED, 'false');
    localStorage.removeItem(STORAGE_KEYS.FINAL_RESULT);
  },

  /**
   * Get active team session data if available
   */
  getSession() {
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
  },

  /**
   * Update battle progress after completing a round
   */
  saveRoundProgress(roundIndex, roundResult, isBattleFinished = false) {
    const session = this.getSession();
    if (!session) return;

    let roundsData = session.roundsData;
    
    // Check if this round was already recorded to prevent duplicate insertion on refresh
    const existingIndex = roundsData.findIndex(r => r.roundNum === roundResult.roundNum);
    if (existingIndex >= 0) {
      roundsData[existingIndex] = roundResult;
    } else {
      roundsData.push(roundResult);
    }

    const nextRoundIndex = isBattleFinished ? roundIndex : roundIndex + 1;
    const nextStatus = isBattleFinished ? 'Finished' : 'Playing';

    localStorage.setItem(STORAGE_KEYS.ROUNDS_DATA, JSON.stringify(roundsData));
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROUND_INDEX, nextRoundIndex.toString());
    localStorage.setItem(STORAGE_KEYS.STATUS, nextStatus);

    if (isBattleFinished) {
      localStorage.setItem(STORAGE_KEYS.DEVICE_LOCKED, 'true');
    }
  },

  /**
   * Save calculated final result summary
   */
  saveFinalResult(finalResult) {
    localStorage.setItem(STORAGE_KEYS.FINAL_RESULT, JSON.stringify(finalResult));
    localStorage.setItem(STORAGE_KEYS.STATUS, 'Finished');
    localStorage.setItem(STORAGE_KEYS.DEVICE_LOCKED, 'true');
  },

  /**
   * Update team status ('Waiting', 'Playing', 'Finished')
   */
  updateStatus(status) {
    localStorage.setItem(STORAGE_KEYS.STATUS, status);
  },

  /**
   * Clear local storage session (used for admin reset or new demo competition)
   */
  clearSession() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }
};
