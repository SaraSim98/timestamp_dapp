import React, { useState } from "react";
import { ethers } from "ethers";
import "./index.css";

// ABI minimale con solo l'evento RawRegistered
const abi = [
  "event RawRegistered(uint256 indexed rawHashFull, address indexed beta, uint256 escrowed)"
];

// Indirizzo del contratto su Sepolia
const CONTRACT_ADDRESS = "0x27756b5a2f30c63f9db5debaf54464fc5321e4d7";

export default function App() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");

  const handleClick = async () => {
    setStatus("Verifico MetaMask...");
    setEvents([]);

    // Controllo se MetaMask è installato
    if (!window.ethereum) {
      setStatus("Errore: installa MetaMask per continuare.");
      return;
    }

    try {
      // Chiedo all'utente di connettere il wallet
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setStatus("MetaMask connesso, lettura ultimo evento...");

      // Uso sempre MetaMask come provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

      // Ottengo numero dell'ultimo blocco
      const currentBlock = await provider.getBlockNumber();

      // Filtro e recupero tutti i log dell'evento
      //Crea un filtro sugli eventi RawRegistered

    //Li cerca dal blocco 0 fino al blocco attuale


      const filter = contract.filters.RawRegistered();
      const logs = await contract.queryFilter(filter, 0, currentBlock);

      if (logs.length === 0) {
        setStatus("Nessun evento trovato.");
        return;
      }

      // Prendo solo l'ultimo evento
      //Estrae l’evento più recente dal log.
      const lastEvent = logs[logs.length - 1];
      //Recupera il blocco Ethereum in cui l’evento è stato incluso.

      //Prende il timestamp (data/ora) di quel blocco.
      const block = await provider.getBlock(lastEvent.blockNumber);
      const ts = block.timestamp;

      // Arricchisco i dati per la UI
      const enriched = [{
        timestamp: ts,
        timestampPlus1: ts + 1,
        date: new Date(ts * 1000).toLocaleString("it-IT"),
        datePlus1: new Date((ts + 1) * 1000).toLocaleString("it-IT"),
        beta: lastEvent.args.beta,
        escrowed: ethers.formatEther(lastEvent.args.escrowed)
      }];

      setEvents(enriched);
      setStatus("Ultimo evento letto correttamente.");
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Errore sconosciuto");
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h1 className="app-title">Ultimo evento RawRegistered</h1>
        <button onClick={handleClick} className="btn-primary">
          Leggi evento
        </button>
        <p className="status-message">{status}</p>

        {events.length > 0 && (
          <div className="result-card">
            <h2>Ultimo evento:</h2>
            {events.map((e, index) => (
              <div key={index} className="event-item">
                <p><strong>Timestamp:</strong> {e.timestamp} ({e.date})</p>
                <p><strong>Timestamp +1:</strong> {e.timestampPlus1} ({e.datePlus1})</p>
                <p><strong>Beta:</strong> {e.beta}</p>
                <p><strong>Escrow:</strong> {e.escrowed} ETH</p>
                <hr />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
