const apiBase = '/api';

async function api(path, options = {}) {
  const res = await fetch(apiBase + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro na API');
  }
  return res.json();
}

const els = {
  playerForm: document.getElementById('player-form'),
  playerName: document.getElementById('player-name'),
  playersList: document.getElementById('players-list'),

  tournamentForm: document.getElementById('tournament-form'),
  tournamentName: document.getElementById('tournament-name'),
  tournamentSelect: document.getElementById('tournament-select'),
  refreshTournament: document.getElementById('refresh-tournament'),

  regPlayerSelect: document.getElementById('reg-player-select'),
  registerPlayerBtn: document.getElementById('register-player-btn'),
  tournamentPlayersList: document.getElementById('tournament-players-list'),

  startTournamentBtn: document.getElementById('start-tournament-btn'),
  nextRoundBtn: document.getElementById('next-round-btn'),
  roundsContainer: document.getElementById('rounds-container'),

  standingsTableBody: document.querySelector('#standings-table tbody'),
};

let state = {
  players: [],
  tournaments: [],
  currentTournament: null,
};

async function loadPlayers() {
  state.players = await api('/players');
  renderPlayers();
  renderPlayerSelect();
}

async function loadTournaments() {
  state.tournaments = await api('/tournaments');
  renderTournamentSelect();
  if (state.currentTournament) {
    const found = state.tournaments.find(t => t.id === state.currentTournament.id);
    if (found) {
      state.currentTournament = await api('/tournaments/' + found.id);
    }
  }
  if (!state.currentTournament && state.tournaments.length > 0) {
    state.currentTournament = await api('/tournaments/' + state.tournaments[0].id);
  }
  renderTournamentDetails();
}

function renderPlayers() {
  els.playersList.innerHTML = '';
  state.players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${p.name} (${p.id.slice(0, 6)})`;
    els.playersList.appendChild(li);
  });
}

function renderPlayerSelect() {
  els.regPlayerSelect.innerHTML = '';
  state.players.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    els.regPlayerSelect.appendChild(opt);
  });
}

function renderTournamentSelect() {
  els.tournamentSelect.innerHTML = '';
  state.tournaments.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.name;
    els.tournamentSelect.appendChild(opt);
  });
  if (state.currentTournament) {
    els.tournamentSelect.value = state.currentTournament.id;
  }
}

function renderTournamentDetails() {
  const t = state.currentTournament;
  if (!t) {
    els.tournamentPlayersList.innerHTML = '<li>Nenhum torneio selecionado</li>';
    els.roundsContainer.innerHTML = '';
    els.standingsTableBody.innerHTML = '';
    return;
  }

  // jogadores inscritos
  els.tournamentPlayersList.innerHTML = '';
  t.players.forEach(pid => {
    const player = state.players.find(p => p.id === pid);
    const li = document.createElement('li');
    li.textContent = player ? player.name : pid;
    els.tournamentPlayersList.appendChild(li);
  });

  // rounds
  els.roundsContainer.innerHTML = '';
  (t.rounds || []).forEach(round => {
    const div = document.createElement('div');
    div.className = 'round-card';
    const title = document.createElement('h3');
    title.textContent = `Rodada ${round.roundNumber}`;
    div.appendChild(title);

    round.matches.forEach(match => {
      const row = document.createElement('div');
      row.className = 'match-row';

      const playerA = state.players.find(p => p.id === match.playerA);
      const playerB = match.playerB && state.players.find(p => p.id === match.playerB);

      const label = document.createElement('span');
      if (match.isBye) {
        label.textContent = `${playerA ? playerA.name : match.playerA} (bye)`;
      } else {
        label.textContent = `${playerA ? playerA.name : match.playerA} vs ${playerB ? playerB.name : match.playerB}`;
      }
      row.appendChild(label);

      const status = document.createElement('span');
      status.className = 'match-status badge ' + (match.status === 'finished' ? 'badge-finished' : 'badge-scheduled');
      status.textContent = match.status === 'finished' ? 'Finalizado' : 'Agendado';
      row.appendChild(status);

      if (!match.isBye && match.status !== 'finished') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Sets ex: 11-7, 8-11, 11-9';

        const btn = document.createElement('button');
        btn.textContent = 'Salvar resultado';

        btn.addEventListener('click', async () => {
          try {
            const sets = parseSetsInput(input.value);
            await api(`/tournaments/${t.id}/rounds/${round.roundNumber}/matches/${match.id}/result`, {
              method: 'POST',
              body: JSON.stringify({ sets }),
            });
            await reloadCurrentTournament();
          } catch (err) {
            alert(err.message);
          }
        });

        row.appendChild(input);
        row.appendChild(btn);
      } else if (match.status === 'finished' && !match.isBye) {
        const resultSpan = document.createElement('span');
        resultSpan.textContent = ' Resultado salvo';
        row.appendChild(resultSpan);
      }

      div.appendChild(row);
    });

    els.roundsContainer.appendChild(div);
  });

  renderStandings(t);
}

function renderStandings(tournament) {
  els.standingsTableBody.innerHTML = '';
  (tournament.standings || []).forEach(s => {
    const tr = document.createElement('tr');

    const cells = [
      s.rank,
      s.name,
      s.wins,
      s.losses,
      s.setsWon,
      s.setsLost,
      (s.setWinPct * 100).toFixed(1) + '%',
      s.score,
      s.buchholz.toFixed(1),
    ];

    cells.forEach(c => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });

    els.standingsTableBody.appendChild(tr);
  });
}

function parseSetsInput(text) {
  if (!text.trim()) throw new Error('Informe os sets, ex: 11-7, 8-11, 11-9');
  const parts = text.split(',');
  const sets = [];
  for (const part of parts) {
    const [a, b] = part.trim().split('-').map(n => parseInt(n.trim(), 10));
    if (Number.isNaN(a) || Number.isNaN(b)) {
      throw new Error('Formato inválido. Use ex: 11-7, 8-11, 11-9');
    }
    sets.push({ a, b });
  }
  return sets;
}

async function reloadCurrentTournament() {
  if (!state.currentTournament) return;
  state.currentTournament = await api('/tournaments/' + state.currentTournament.id);
  renderTournamentDetails();
}

// --- Event listeners ---
els.playerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = els.playerName.value.trim();
  if (!name) return;
  await api('/players', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  els.playerName.value = '';
  await loadPlayers();
});

els.tournamentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = els.tournamentName.value.trim();
  if (!name) return;
  const t = await api('/tournaments', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  els.tournamentName.value = '';
  await loadTournaments();
  state.currentTournament = t;
  renderTournamentSelect();
  renderTournamentDetails();
});

els.tournamentSelect.addEventListener('change', async () => {
  const id = els.tournamentSelect.value;
  if (!id) return;
  state.currentTournament = await api('/tournaments/' + id);
  renderTournamentDetails();
});

els.refreshTournament.addEventListener('click', async () => {
  await reloadCurrentTournament();
});

els.registerPlayerBtn.addEventListener('click', async () => {
  const t = state.currentTournament;
  if (!t) {
    alert('Selecione um torneio');
    return;
  }
  const playerId = els.regPlayerSelect.value;
  if (!playerId) {
    alert('Selecione um jogador');
    return;
  }
  try {
    state.currentTournament = await api(`/tournaments/${t.id}/register`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
    await loadTournaments();
    await reloadCurrentTournament();
  } catch (err) {
    alert(err.message);
  }
});

els.startTournamentBtn.addEventListener('click', async () => {
  const t = state.currentTournament;
  if (!t) {
    alert('Selecione um torneio');
    return;
  }
  try {
    state.currentTournament = await api(`/tournaments/${t.id}/start`, {
      method: 'POST',
    });
    await reloadCurrentTournament();
  } catch (err) {
    alert(err.message);
  }
});

els.nextRoundBtn.addEventListener('click', async () => {
  const t = state.currentTournament;
  if (!t) {
    alert('Selecione um torneio');
    return;
  }
  try {
    await api(`/tournaments/${t.id}/next-round`, {
      method: 'POST',
    });
    await reloadCurrentTournament();
  } catch (err) {
    alert(err.message);
  }
});

// Init
(async function init() {
  try {
    await loadPlayers();
    await loadTournaments();
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar dados iniciais: ' + err.message);
  }
})();
