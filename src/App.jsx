import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [players, setPlayers] = useState([
    { id: 1, name: 'Player 1', wins: 0, balance: 0 },
    { id: 2, name: 'Player 2', wins: 0, balance: 0 },
    { id: 3, name: 'Player 3', wins: 0, balance: 0 },
    { id: 4, name: 'Player 4', wins: 0, balance: 0 },
  ]);

  const [history, setHistory] = useState([]);
  const [ledger, setLedger] = useState([]); // NEW: State for KV database

  // NEW: Fetch historical debts when the app loads
  useEffect(() => {
    fetch('/api/debts')
      .then(res => res.json())
      .then(data => setLedger(data))
      .catch(err => console.error("Could not load ledger", err));
  }, []);

  const handleNameChange = (id, newName) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const logWin = (winnerId) => {
    const winnerName = players.find(p => p.id === winnerId).name;
    setPlayers(players.map(p => {
      if (p.id === winnerId) return { ...p, wins: p.wins + 1, balance: p.balance + 60 };
      return { ...p, balance: p.balance - 20 };
    }));
    setHistory(prev => [`Round ${prev.length + 1}: ${winnerName} won!`, ...prev]);
  };

  const calculateSettlements = () => {
    let debtors = players.filter(p => p.balance < 0).map(p => ({ name: p.name, debt: Math.abs(p.balance) })).sort((a, b) => b.debt - a.debt);
    let creditors = players.filter(p => p.balance > 0).map(p => ({ name: p.name, credit: p.balance })).sort((a, b) => b.credit - a.credit);
    let settlements = [];
    let i = 0; let j = 0;

    while (i < debtors.length && j < creditors.length) {
      let debtor = debtors[i]; let creditor = creditors[j];
      let amount = Math.min(debtor.debt, creditor.credit);
      settlements.push(`${debtor.name} owes ${creditor.name} ₱${amount}`);
      debtor.debt -= amount; creditor.credit -= amount;
      if (debtor.debt === 0) i++;
      if (creditor.credit === 0) j++;
    }
    return settlements;
  };

  const activeSettlements = calculateSettlements();

  // NEW: Save to KV Database
  const saveToLedger = async () => {
    if (activeSettlements.length === 0) return alert("No debts to save!");
    
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const response = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, settlements: activeSettlements })
    });

    if (response.ok) {
      const updatedLedger = await response.json();
      setLedger(updatedLedger);
      alert("Night saved to database!");
      // Reset board after saving
      setPlayers(players.map(p => ({ ...p, wins: 0, balance: 0 })));
      setHistory([]);
    }
  };

  const resetGame = () => {
    if(window.confirm("Clear current board without saving?")) {
      setPlayers(players.map(p => ({ ...p, wins: 0, balance: 0 })));
      setHistory([]);
    }
  };

  return (
    <div className="arcade-container">
      <header>
        <h1 className="neon-text">DART WARS</h1>
        <p className="subtitle">20₱ BUY-IN // CLOUD LEDGER</p>
      </header>

      {/* --- Player Grid remains exactly the same --- */}
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
              <span className={`balance ${player.balance >= 0 ? 'positive' : 'negative'}`}>₱{player.balance}</span>
            </div>
            <button className="win-btn" onClick={() => logWin(player.id)}>LOG WIN</button>
          </div>
        ))}
      </div>

      <div className="panels-container">
        {/* Match Log Panel */}
        <div className="panel">
          <h2>MATCH LOG</h2>
          <div className="scroll-list">
            {history.length === 0 ? <p className="empty-text">Insert Coin...</p> : null}
            {history.map((log, index) => <div key={index} className="list-item">{log}</div>)}
          </div>
        </div>

        {/* Live Settle Panel */}
        <div className="panel settle-panel">
          <h2 className="settle-title">LIVE TABS</h2>
          <div className="scroll-list">
            {activeSettlements.length === 0 ? <p className="empty-text">All clear!</p> : null}
            {activeSettlements.map((settlement, index) => (
              <div key={index} className="list-item settlement-item">{settlement}</div>
            ))}
          </div>
          {/* THE NEW SAVE BUTTON */}
          <button className="save-btn" onClick={saveToLedger}>SAVE TO LEDGER</button>
        </div>

        {/* NEW: Database Ledger Panel */}
        <div className="panel db-panel">
          <h2>DATABASE HISTORY</h2>
          <div className="scroll-list">
            {ledger.length === 0 ? <p className="empty-text">No past debts.</p> : null}
            {ledger.map((entry, index) => (
              <div key={index} className="ledger-block">
                <div className="ledger-date">{entry.date}</div>
                {entry.settlements.map((s, i) => <div key={i} className="list-item">{s}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="reset-btn" onClick={resetGame}>WIPE CURRENT BOARD</button>
    </div>
  );
}

export default App;