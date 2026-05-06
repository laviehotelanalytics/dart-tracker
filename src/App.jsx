import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const generatePlayers = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1, name: `Player ${i + 1}`, wins: 0, balance: 0
    }));
  };

  const [players, setPlayers] = useState(generatePlayers(4));
  const [history, setHistory] = useState([]);
  const [ledger, setLedger] = useState([]); 
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', content: null });

  // THE FIX: Safe loading to prevent React crashes
  useEffect(() => {
    fetch('/api/debts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLedger(data);
        } else {
          setLedger([]); // Fallback to empty if the database sends a bad response
        }
      })
      .catch(err => {
        console.error("Could not load ledger", err);
        setLedger([]);
      });
  }, []);

  const changePlayerCount = (delta) => {
    const newCount = players.length + delta;
    if (newCount < 2 || newCount > 8) return; 
    if (history.length > 0 && !window.confirm("Changing players wipes the board. Continue?")) return; 
    setPlayers(generatePlayers(newCount));
    setHistory([]);
  };

  const handleNameChange = (id, newName) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const logWin = (winnerId) => {
    const winnerName = players.find(p => p.id === winnerId).name;
    const buyIn = 20;
    const winAmount = buyIn * (players.length - 1);

    setPlayers(players.map(p => {
      if (p.id === winnerId) return { ...p, wins: p.wins + 1, balance: p.balance + winAmount };
      return { ...p, balance: p.balance - buyIn };
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

  const saveToLedger = async () => {
    if (activeSettlements.length === 0) return alert("No debts to save!");
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    
    const response = await fetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, settlements: activeSettlements, history: history })
    });
    
    if (response.ok) {
      const updatedLedger = await response.json();
      setLedger(updatedLedger);
      alert("Night saved to database!");
      setPlayers(generatePlayers(players.length)); 
      setHistory([]);
    }
  };

  const resetGame = () => {
    if(window.confirm("Clear current board without saving?")) {
      setPlayers(generatePlayers(players.length)); 
      setHistory([]);
    }
  };

  // THE NEW FEATURE: Delete a single entry
  const deleteEntry = async (index, e) => {
    e.stopPropagation(); // Stops the modal from opening when you click the X
    
    if (window.confirm("Delete this specific record?")) {
      const response = await fetch('/api/debts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: index })
      });

      if (response.ok) {
        const updatedLedger = await response.json();
        setLedger(updatedLedger);
      }
    }
  };

  const clearLedger = async () => {
    if (ledger.length === 0) return alert("Database is already empty!");
    if (window.confirm("WARNING: This will permanently wipe all saved cloud history. Are you absolutely sure?")) {
      const response = await fetch('/api/debts', { method: 'DELETE' });
      if (response.ok) {
        setLedger([]);
        alert("Database wiped clean!");
      }
    }
  };

  const openModal = (title, content) => {
    setModalConfig({ isOpen: true, title, content });
  };

  return (
    <div className="arcade-container">
      <header>
        <h1 className="neon-text">DART WARS</h1>
        <p className="subtitle">20₱ BUY-IN // CLOUD LEDGER</p>
        
        <div className="setup-controls">
          <label>PLAYERS</label>
          <div className="player-stepper">
            <button className="stepper-btn" onClick={() => changePlayerCount(-1)}>-</button>
            <span className="stepper-value">{players.length}</span>
            <button className="stepper-btn" onClick={() => changePlayerCount(1)}>+</button>
          </div>
        </div>
      </header>

      <div className="player-grid">
        {players.map((player) => (
          <div key={player.id} className="player-card">
            <input 
              type="text" value={player.name} onChange={(e) => handleNameChange(player.id, e.target.value)}
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
        <div className="panel">
          <h2>MATCH LOG</h2>
          <div className="scroll-list">
            {history.length === 0 ? <p className="empty-text">Insert Coin...</p> : null}
            {history.map((log, index) => (
              <div key={index} className="list-item clickable" onClick={() => openModal(`Log Details`, log)}>
                {log}
              </div>
            ))}
          </div>
        </div>

        <div className="panel settle-panel">
          <h2 className="settle-title">LIVE TABS</h2>
          <div className="scroll-list">
            {activeSettlements.length === 0 ? <p className="empty-text">All clear!</p> : null}
            {activeSettlements.map((settlement, index) => (
              <div key={index} className="list-item settlement-item">{settlement}</div>
            ))}
          </div>
          <button className="save-btn" onClick={saveToLedger}>SAVE TO LEDGER</button>
        </div>

        <div className="panel db-panel">
          <h2>DATABASE HISTORY</h2>
          <div className="scroll-list">
            {ledger.length === 0 ? <p className="empty-text">No past debts.</p> : null}
            {ledger.map((entry, index) => (
              <div 
                key={index} 
                className="ledger-block clickable"
                onClick={() => openModal(`Records for ${entry.date}`, { 
                  history: entry.history, 
                  settlements: entry.settlements 
                })}
              >
                {/* UPDATED: Added a header row to hold the date and the X button side-by-side */}
                <div className="ledger-header">
                  <div className="ledger-date">{entry.date}</div>
                  <button className="del-entry-btn" onClick={(e) => deleteEntry(index, e)}>X</button>
                </div>
                <div className="click-hint">Click to view records...</div>
              </div>
            ))}
          </div>
          {ledger.length > 0 && (
            <button className="delete-db-btn" onClick={clearLedger}>WIPE DATABASE</button>
          )}
        </div>
      </div>

      <button className="reset-btn" onClick={resetGame}>WIPE CURRENT BOARD</button>

      {modalConfig.isOpen && (
        <div className="modal-overlay" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{modalConfig.title}</h2>
            <div className="modal-body">
              {modalConfig.content && typeof modalConfig.content === 'object' ? (
                <>
                  <h3 className="modal-subtitle">MATCH HISTORY</h3>
                  {modalConfig.content.history && modalConfig.content.history.length > 0 ? (
                    modalConfig.content.history.map((item, i) => <p key={`h-${i}`} className="modal-item">{item}</p>)
                  ) : (
                    <p className="modal-item" style={{ color: '#888' }}>No history recorded.</p>
                  )}
                  <br />
                  <h3 className="modal-subtitle" style={{ color: 'var(--neon-yellow)' }}>FINAL TABS</h3>
                  {modalConfig.content.settlements && modalConfig.content.settlements.map((item, i) => (
                    <p key={`s-${i}`} className="modal-item settlement-item">{item}</p>
                  ))}
                </>
              ) : (
                <p className="modal-item">{modalConfig.content}</p>
              )}
            </div>
            <button className="close-btn" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;