const { randomUUID } = require('crypto');
const store = require('./store');

function createPlayer(name) {
  const id = randomUUID();
  const player = { id, name };
  store.players.set(id, player);
  return player;
}

function getPlayer(id) {
  return store.players.get(id) || null;
}

function listPlayers() {
  return Array.from(store.players.values());
}

module.exports = {
  createPlayer,
  getPlayer,
  listPlayers,
};
