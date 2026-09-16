/**
 * Pronunciation Battle - Host Live Monitoring Dashboard Component
 */

import { firebaseService } from './firebase-service.js';

export class HostDashboard {
  constructor(containerElement) {
    this.container = containerElement;
    this.activeCompCode = 'POLYGLOT2026';
    this.unsubscribe = null;
    this.teams = [];

    this.initUI();
  }

  initUI() {
    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-slate-100 max-w-6xl mx-auto my-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                <i class="fas fa-desktop text-lg"></i>
              </span>
              <div>
                <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
                  Host Live Monitoring Dashboard
                </h2>
                <p class="text-xs text-slate-400">Polyglot Communication Club • Real-Time Competition Feed</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 w-full md:w-auto">
            <div class="relative flex-1 md:w-48">
              <input type="text" id="hostCompCodeInput" value="${this.activeCompCode}" 
                class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm uppercase text-amber-300 font-mono tracking-wider focus:outline-none focus:border-amber-500" 
                placeholder="Comp Code">
            </div>
            <button id="btnConnectHost" class="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-sm transition flex items-center gap-2 shadow-lg shadow-amber-500/10">
              <i class="fas fa-sync-alt text-xs"></i> Monitor
            </button>
          </div>
        </div>

        <!-- Live Metrics Bar -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div class="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
            <p class="text-xs text-slate-400 font-medium">Total Registered Teams</p>
            <p id="statTotalTeams" class="text-2xl font-bold text-slate-100">0</p>
          </div>
          <div class="bg-slate-800/60 border border-emerald-900/40 rounded-xl p-4">
            <p class="text-xs text-emerald-400 font-medium">Currently Playing</p>
            <p id="statPlayingTeams" class="text-2xl font-bold text-emerald-400">0</p>
          </div>
          <div class="bg-slate-800/60 border border-blue-900/40 rounded-xl p-4">
            <p class="text-xs text-blue-400 font-medium">Battles Completed</p>
            <p id="statFinishedTeams" class="text-2xl font-bold text-blue-400">0</p>
          </div>
          <div class="bg-slate-800/60 border border-purple-900/40 rounded-xl p-4">
            <p class="text-xs text-purple-400 font-medium">Top Score Leader</p>
            <p id="statTopScore" class="text-xl font-bold text-purple-300 truncate">None</p>
          </div>
        </div>

        <!-- Teams Grid -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Team Feed
            </h3>
            <span id="liveStatusBadge" class="text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-full">
              ● Connected
            </span>
          </div>

          <div id="hostTeamsList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[220px]">
            <div class="col-span-full flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <i class="fas fa-users text-3xl mb-2 text-slate-600"></i>
              <p>No teams registered under competition code <span class="text-amber-400 font-mono">${this.activeCompCode}</span> yet.</p>
            </div>
          </div>
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
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = firebaseService.subscribeToHostMonitoring(code, (teams) => {
      this.teams = teams;
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

    totalEl.textContent = this.teams.length;
    playingEl.textContent = this.teams.filter(t => t.status === 'Playing').length;
    finishedEl.textContent = this.teams.filter(t => t.status === 'Finished').length;

    // Leader ranking
    const finishedWithScores = this.teams
      .filter(t => t.finalResult)
      .sort((a, b) => b.finalResult.finalScore - a.finalResult.finalScore);

    if (finishedWithScores.length > 0) {
      const top = finishedWithScores[0];
      topScoreEl.textContent = `${top.teamName} (${top.finalResult.finalScore} pts)`;
    } else {
      topScoreEl.textContent = 'None';
    }

    if (this.teams.length === 0) {
      listContainer.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
          <i class="fas fa-users text-3xl mb-2 text-slate-600"></i>
          <p class="text-sm">No teams registered under competition code <span class="text-amber-400 font-mono">${this.activeCompCode}</span> yet.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = this.teams.map(team => {
      const statusBadge = team.status === 'Finished'
        ? '<span class="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-medium">Finished</span>'
        : team.status === 'Playing'
        ? '<span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium animate-pulse">Playing</span>'
        : '<span class="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2 py-0.5 rounded-full font-medium">Waiting</span>';

      const lastRound = team.roundsData && team.roundsData.length > 0
        ? team.roundsData[team.roundsData.length - 1]
        : null;

      return `
        <div class="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition shadow-lg">
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-bold text-slate-100 text-lg flex items-center gap-2">
                <i class="fas fa-shield-alt text-amber-400 text-sm"></i> ${team.teamName}
              </h4>
              ${statusBadge}
            </div>

            <div class="text-xs text-slate-400 space-y-1 mb-3">
              <p><i class="fas fa-users text-slate-500 mr-1"></i> ${team.members.join(', ')}</p>
              <p><i class="fas fa-flag text-slate-500 mr-1"></i> Round: <span class="text-slate-200 font-bold">${team.currentRound || 1}/5</span> (${team.currentDifficulty || 'Easy'})</p>
              <p><i class="fas fa-microphone text-slate-500 mr-1"></i> Speaker: <span class="text-amber-300">${team.currentSpeaker || 'N/A'}</span></p>
            </div>

            ${lastRound ? `
              <div class="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 text-xs space-y-1">
                <div class="flex justify-between font-mono">
                  <span class="text-slate-400">Latest Accuracy:</span>
                  <span class="font-bold ${lastRound.accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}">${lastRound.accuracy}%</span>
                </div>
                <p class="text-slate-300 italic truncate" title="${lastRound.transcript || 'No speech recorded'}">
                  "${lastRound.transcript || 'No speech recorded'}"
                </p>
              </div>
            ` : ''}
          </div>

          ${team.finalResult ? `
            <div class="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span class="text-slate-400">Final Score:</span>
              <span class="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                ${team.finalResult.finalScore} pts
              </span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }
}
