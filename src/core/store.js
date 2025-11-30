// Armazenamento simples em memória (pode trocar por DB depois)
const store = {
  players: new Map(),     // id -> player
  tournaments: new Map(), // id -> tournament
};

module.exports = store;
