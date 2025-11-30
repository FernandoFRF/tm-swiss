const { randomUUID } = require('crypto');
const store = require('./store');

// Calcula standings baseado nas partidas jogadas
function recalcStandings(tournament) {
  const stats = new Map(); // playerId -> stats

  function ensure(pId) {
    if (!stats.has(pId)) {
      const player = store.players.get(pId);
      stats.set(pId, {
        playerId: pId,
        name: player ? player.name : pId,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        matchesPlayed: 0,
        score: 0,
        opponents: [],
      });
    }
    return stats.get(pId);
  }

  // Inicializa todos inscritos
  for (const pId of tournament.players) {
    ensure(pId);
  }

  for (const round of tournament.rounds) {
    for (const m of round.matches) {
      if (!m.winner || m.status !== 'finished') continue;

      const a = ensure(m.playerA);
      const b = m.playerB ? ensure(m.playerB) : null;

      if (b) {
        a.matchesPlayed++;
        b.matchesPlayed++;
        a.opponents.push(b.playerId);
        b.opponents.push(a.playerId);
      }

      let setsWonA = 0;
      let setsWonB = 0;
      for (const s of m.sets || []) {
        if (s.a > s.b) setsWonA++;
        else if (s.b > s.a) setsWonB++;
      }

      a.setsWon += setsWonA;
      a.setsLost += setsWonB;

      if (b) {
        b.setsWon += setsWonB;
        b.setsLost += setsWonA;
      }

      if (m.winner === m.playerA) {
        a.wins++; a.score++;
        if (b) b.losses++;
      } else if (b && m.winner === m.playerB) {
        b.wins++; b.score++;
        a.losses++;
      }
    }
  }

  // setWinPct
  for (const st of stats.values()) {
    const total = st.setsWon + st.setsLost;
    st.setWinPct = total > 0 ? st.setsWon / total : 0;
  }

  // Buchholz simplificado: soma das pontuações dos oponentes
  for (const st of stats.values()) {
    st.buchholz = st.opponents
      .map(oid => stats.get(oid)?.score || 0)
      .reduce((a, b) => a + b, 0);
  }

  // Ordena: score desc, buchholz desc, setWinPct desc
  const arr = Array.from(stats.values());
  arr.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    if (b.setWinPct !== a.setWinPct) return b.setWinPct - a.setWinPct;
    return 0;
  });

  // Atribui rank
  arr.forEach((st, i) => { st.rank = i + 1; });

  return arr;
}

// Retorna um mapa playerId -> score
function getScoresMap(tournament) {
  const standings = recalcStandings(tournament);
  const map = new Map();
  for (const s of standings) {
    map.set(s.playerId, s.score);
  }
  // Jogadores sem partida ainda têm score 0
  for (const pId of tournament.players) {
    if (!map.has(pId)) map.set(pId, 0);
  }
  return map;
}

// Verifica se dois jogadores já jogaram entre si
function alreadyPlayed(tournament, pA, pB) {
  for (const round of tournament.rounds) {
    for (const m of round.matches) {
      if (
        (m.playerA === pA && m.playerB === pB) ||
        (m.playerA === pB && m.playerB === pA)
      ) {
        return true;
      }
    }
  }
  return false;
}

// Gera próxima rodada suíça (simplificado)
function generateNextRound(tournament, currentRoundNumber) {
  const roundNumber = (currentRoundNumber ?? 0) + 1;
  const scores = getScoresMap(tournament);

  // jogadores ativos (não dropped)
  const dropped = tournament.droppedPlayers || new Set();
  let players = tournament.players.filter(p => !dropped.has(p));

  // Ordena por score desc (e random pra desempatar levemente)
  players.sort((a, b) => {
    const diff = (scores.get(b) || 0) - (scores.get(a) || 0);
    if (diff !== 0) return diff;
    return Math.random() < 0.5 ? -1 : 1;
  });

  const matches = [];
  const used = new Set();
  let byePlayer = null;

  for (let i = 0; i < players.length; i++) {
    const pA = players[i];
    if (used.has(pA)) continue;

    // procura oponente compatível
    let opponent = null;
    for (let j = i + 1; j < players.length; j++) {
      const pB = players[j];
      if (used.has(pB)) continue;
      if (!alreadyPlayed(tournament, pA, pB)) {
        opponent = pB;
        break;
      }
    }

    // se não achou ninguém que nunca tenha jogado, pega o próximo disponível
    if (!opponent) {
      for (let j = i + 1; j < players.length; j++) {
        const pB = players[j];
        if (!used.has(pB)) {
          opponent = pB;
          break;
        }
      }
    }

    if (opponent) {
      used.add(pA);
      used.add(opponent);
      matches.push({
        id: randomUUID(),
        roundNumber,
        playerA: pA,
        playerB: opponent,
        sets: [],
        winner: null,
        status: 'scheduled',
      });
    } else {
      // jogador ímpar = bye
      byePlayer = pA;
    }
  }

  if (byePlayer) {
    // marca um bye como vitória automática
    matches.push({
      id: randomUUID(),
      roundNumber,
      playerA: byePlayer,
      playerB: null,
      sets: [],
      winner: byePlayer,
      status: 'finished',
      isBye: true,
    });
  }

  return {
    roundNumber,
    matches,
  };
}

module.exports = {
  recalcStandings,
  generateNextRound,
};
