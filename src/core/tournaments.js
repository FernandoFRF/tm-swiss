const { randomUUID } = require('crypto');
const store = require('./store');
const { generateNextRound, recalcStandings } = require('./swissPairing');

function createTournament(name) {
  const id = randomUUID();
  const tournament = {
    id,
    name,
    players: [],
    rounds: [],
    status: 'not_started',
    createdAt: new Date().toISOString(),
    droppedPlayers: new Set(),
    standings: [],
  };
  store.tournaments.set(id, tournament);
  return tournament;
}

function getTournament(id) {
  return store.tournaments.get(id) || null;
}

function listTournaments() {
  return Array.from(store.tournaments.values());
}

function registerPlayerInTournament(tournamentId, playerId) {
  const t = getTournament(tournamentId);
  if (!t) throw new Error('Tournament not found');

  if (!t.players.includes(playerId)) {
    t.players.push(playerId);
  }
  return t;
}

// "Drop" do jogador: não remove resultados antigos, apenas bloqueia de próximos rounds
function dropPlayer(tournamentId, playerId) {
  const t = getTournament(tournamentId);
  if (!t) throw new Error('Tournament not found');

  t.droppedPlayers.add(playerId);

  return t;
}

function startTournament(tournamentId) {
  const t = getTournament(tournamentId);
  if (!t) throw new Error('Tournament not found');
  if (t.players.length < 2) throw new Error('Need at least 2 players');

  t.status = 'in_progress';
  // gera primeira rodada
  const round = generateNextRound(t, null); // sem rounds anteriores
  t.rounds.push(round);
  t.standings = recalcStandings(t);
  return t;
}

function reportMatchResult(tournamentId, roundNumber, matchId, sets) {
  const t = getTournament(tournamentId);
  if (!t) throw new Error('Tournament not found');

  const round = t.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) throw new Error('Round not found');

  const match = round.matches.find(m => m.id === matchId);
  if (!match) throw new Error('Match not found');

  match.sets = sets;
  match.status = 'finished';

  // Define vencedor contando sets
  let setsWonA = 0;
  let setsWonB = 0;
  for (const s of sets) {
    if (s.a > s.b) setsWonA++;
    else if (s.b > s.a) setsWonB++;
  }
  if (setsWonA === setsWonB) {
    // empates não deveriam acontecer em melhor-de-x, mas só pra garantir
    match.winner = null;
  } else {
    match.winner = setsWonA > setsWonB ? match.playerA : match.playerB;
  }

  // Recalcula standings (tabela)
  t.standings = recalcStandings(t);

  return { tournament: t, match };
}

function createNextRound(tournamentId) {
  const t = getTournament(tournamentId);
  if (!t) throw new Error('Tournament not found');

  const currentRound = t.rounds.length;
  const round = generateNextRound(t, currentRound);
  t.rounds.push(round);
  t.standings = recalcStandings(t);
  return round;
}

// Util para serializar (remover Sets para ir pro JSON)
function serializeTournament(t) {
  if (!t) return null;
  return {
    ...t,
    droppedPlayers: Array.from(t.droppedPlayers || []),
  };
}

module.exports = {
  createTournament,
  getTournament,
  listTournaments,
  registerPlayerInTournament,
  dropPlayer,
  startTournament,
  reportMatchResult,
  createNextRound,
  serializeTournament,
};
