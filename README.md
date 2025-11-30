
# 📘 Table Tennis Swiss – Sistema de Campeonatos de Tênis de Mesa (Sistema Suíço)

Aplicação completa para gerenciar campeonatos de tênis de mesa utilizando o **Sistema Suíço**, com:

- Cadastro de jogadores
- Criação e gestão de torneios
- Sistema de pareamento suíço
- Inserção de resultados por sets
- Classificação automática com Buchholz, % de sets e vitórias
- UI simples em HTML/JS
- Backend em Node.js + Express
- Pronto para rodar localmente ou integrar com Electron para virar um app desktop

---

# ⭐ Funcionalidades Implementadas

## ✅ 1. Jogadores

- Cadastro de jogadores (nome)
- Listagem de todos os jogadores
- Seleção de jogadores para inscrição em torneios

## ✅ 2. Torneios

- Criação de torneios
- Listagem e seleção
- Inscrição de jogadores
- Drop mantendo resultados
- Salvamento em memória

## ✅ 3. Rodadas e Sistema Suíço

- Geração da primeira rodada
- Geração das próximas rodadas
- Pareamento suíço simplificado
- Bye automático

## ✅ 4. Partidas

- Exibição das partidas
- Inserção de sets (ex: 11-7, 8-11, 11-9)
- Cálculo automático do vencedor
- Status finalizado/agendado

## ✅ 5. Classificação (Standings)

- Ranking automático
- Pontos (vitórias)
- Sets vencidos e perdidos
- Percentual de sets
- Buchholz simplificado

## ✅ 6. Interface (UI)

- HTML + CSS + JS Vanilla
- Cadastro de jogadores
- Criação/seleção de torneios
- Inscrição
- Rodadas + resultados
- Classificação completa

---

# 🟡 Funcionalidades Futuras

## Persistência / Banco de Dados

- Salvar JSON
- SQLite opcional
- IndexedDB no browser

## Electron

- App desktop reutilizando UI
- Empacotamento multi-plataforma

## Sistema Suíço Avançado

- Buchholz completo
- Sonneborn-Berger
- Refinamento de pareamento

## Analytics

- Histórico por jogador
- Evolução rodada a rodada
- Exportar CSV

## UX

- Edição de resultados
- Melhor responsividade
- Dark/Light mode
- Confirmações de ações

---

# 🛠 Tecnologias Utilizadas

- Node.js + Express**s**
- JavaScript puro
- HTML + CSS
- Sistema de pareamento suíço implementado do zero

---

# 📁 Estrutura do Projeto

```
table-tennis-swiss/
│
├── public/
│   ├── index.html
│   ├── styles.css
│   └── main.js
│
├── src/
│   ├── core/
│   └── server/
│
├── package.json
└── README.md
```

---

# ▶️ Como Rodar

```bash
npm install
npm start
```

Abra em:

👉 http://localhost:3000

---

# 🤝 Contribuições

Pull requests são bem-vindos!
