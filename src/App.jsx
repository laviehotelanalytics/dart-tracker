import { useState } from 'react';
import './App.css';

function App() {
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', wins: 0, balance: 0 },
    { id: 2, name: 'Player 2', wins: 0, balance: 0 },
    { id: 3, name: 'Player 3', wins: 0, balance: 0 },
    { id: 4, name: 'Player 4', wins: 0, balance: 0 },
  ]);

  const [history, setHistory] = useState([]);

  const handleNameChange = (id, newName) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const logWin = (winnerId) => {
    const winnerName = players.find(p => p.id === winnerId).name;
    
    setPlayers(players.map(p => {
      if (p.id === winnerId) {
        return { ...p, wins: p.wins + 1, balance: p.balance + 60 };
      }
      return { ...p, balance: p.balance - 20 };
    }));

    setHistory(prev => [
      `Round ${prev.length + 1}: ${winnerName} won!`, 
      ...prev
    ]);
  };

  const resetGame = () => {
    if(window.confirm("Clear all debts and start over?")) {
      setPlayers(players.map(p => ({ ...p, wins: 0, balance: 0 })));
      setHistory([]);
    }
  };

  // --- NEW LOGIC: Calculate Who Owes Who ---
  const calculateSettlements = () => {
    let debtors = players
      .filter(p => p.balance < 0)
      .map(p => ({ name: p.name, debt: Math.abs(p.balance) }))
      .sort((a, b) => b.debt - a.debt); // Sort largest debts first

    let creditors = players
      .filter(p => p.balance > 0)
      .map(p => ({ name: p.name, credit: p.balance }))
      .sort((a, b) => b.credit - a.credit); // Sort largest credits first

    let settlements = [];
    let i = 0; // debtors index
    let j = 0; // creditors index

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i];
      let creditor = creditors[j];

      // Settle the maximum possible amount between these two players
      let amount = Math.min(debtor.debt, creditor.credit);

      settlements.push(`${debtor.name} owes ${creditor.name} ₱${amount}`);

      debtor.debt -= amount;
      creditor.credit -= amount;

      if (debtor.debt === 0) i++;
      if (creditor.credit === 0) j++;
    }

    return settlements;
  };

  const activeSettlements = calculateSettlements();

  return (
    <div className="arcade-container">
      <header>
        <h1 className="neon-text">DART WARS</h1>
        <p className="subtitle">20₱ BUY-IN // LIVE SETTLEMENT</p>
      </header>

      <div className="player-grid">
        {players.map((player) => (
          <div key={player.id} className="player-card">
            <input 
              type="text" 
              value={player.name} 
              onChange={(e) => handleNameChange(player.id, e.target.value)}
              className="player-input"
            />
            <div className="stats">
              <span className="wins">Wins: {player.wins}</span>
              <span className={`balance ${player.balance >= 0 ? 'positive' : 'negative'}`}>
                ₱{player.balance}
              </span>
            </div>
            <button className="win-btn" onClick={() => logWin(player.id)}>
              LOG WIN
            </button>
          </div>
        ))}
      </div>

      {/* --- NEW UI: Split Panels --- */}
      <div className="panels-container">
        <div className="panel">
          <h2>MATCH LOG</h2>
          <div className="scroll-list">
            {history.length === 0 ? <p className="empty-text">Insert Coin to Play...</p> : null}
            {history.map((log, index) => (
              <div key={index} className="list-item">{log}</div>
            ))}
          </div>
        </div>

        <div className="panel settle-panel">
          <h2 className="settle-title">SETTLE UP</h2>
          <div className="scroll-list">
            {activeSettlements.length === 0 ? (
              <p className="empty-text">All tabs are clear!</p>
            ) : null}
            {activeSettlements.map((settlement, index) => (
              <div key={index} className="list-item settlement-item">
                {settlement}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="reset-btn" onClick={resetGame}>RESET GAME</button>
    </div>
  );
}

export default App;