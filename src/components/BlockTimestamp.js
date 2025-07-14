import React, { useState } from "react";
import { ethers } from "ethers";

export default function Timestamp() {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("");

  // ABI minimale con solo l'evento RawRegistered
  const abi = [
    "event RawRegistered(uint256 indexed rawHashFull, address indexed beta, uint256 escrowed)"
  ];

  // Indirizzo del contratto su Sepolia
  const CONTRACT_ADDRESS = "0x27756b5a2f30c63f9db5debaf54464fc5321e4d7";

  const handleClick = async () => {
    setStatus("Verifico MetaMask...");
    setEvents([]);

    if (!window.ethereum) {
      setStatus("Errore: installa MetaMask per continuare.");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      setStatus("MetaMask connesso, lettura ultimo evento...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
      const currentBlock = await provider.getBlockNumber();

      const filter = contract.filters.RawRegistered();
      const logs = await contract.queryFilter(filter, 0, currentBlock);

      if (logs.length === 0) {
        setStatus("Nessun evento trovato.");
        return;
      }

      const lastEvent = logs[logs.length - 1];
      const block = await provider.getBlock(lastEvent.blockNumber);
      const ts = block.timestamp;

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
  );
}
