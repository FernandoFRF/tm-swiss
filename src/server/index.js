const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const {
  createPlayer,
  listPlayers,
} = require('../core/players');

const {
  createTournament,
  listTournaments,
  getTournament,
  registerPlayerInTournament,
  dropPlayer,
  startTournament,
  reportMatchResult,
  createNextRound,
  serializeTournament,
} = require('../core/tournaments');

const app = express();
app.use(bodyParser.json());

// Serve arquivos estáticos (UI)
const publicDir = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicDir));

// --- Players ---
app.post('/api/players', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const player = createPlayer(name);
  res.json(player);
});

app.get('/api/players', (req, res) => {
  res.json(listPlayers());
});

// --- Tournaments ---
app.post('/api/tournaments', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const t = createTournament(name);
  res.json(serializeTournament(t));
});

app.get('/api/tournaments', (req, res) => {
  res.json(listTournaments().map(serializeTournament));
});

app.get('/api/tournaments/:id', (req, res) => {
  const t = getTournament(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  res.json(serializeTournament(t));
});

app.post('/api/tournaments/:id/register', (req, res) => {
  const { playerId } = req.body;
  try {
    const t = registerPlayerInTournament(req.params.id, playerId);
    res.json(serializeTournament(t));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/tournaments/:id/drop', (req, res) => {
  const { playerId } = req.body;
  try {
    const t = dropPlayer(req.params.id, playerId);
    res.json(serializeTournament(t));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/tournaments/:id/start', (req, res) => {
  try {
    const t = startTournament(req.params.id);
    res.json(serializeTournament(t));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/tournaments/:id/rounds/:roundNumber/matches/:matchId/result', (req, res) => {
  const { sets } = req.body; // [{a:11,b:7},...]
  try {
    const result = reportMatchResult(
      req.params.id,
      Number(req.params.roundNumber),
      req.params.matchId,
      sets
    );
    res.json({
      tournament: serializeTournament(result.tournament),
      match: result.match,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/tournaments/:id/next-round', (req, res) => {
  try {
    const round = createNextRound(req.params.id);
    res.json(round);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Fallback: qualquer rota não-API devolve index.html (para front simples)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
