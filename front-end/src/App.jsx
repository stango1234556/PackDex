import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const SETS = [
  {
    id: "sv-en-001",
    language: "English",
    name: "Scarlet & Violet Demo Set",
    packSize: 5,
    cards: [
      { id: "en-001", name: "Sprout Cat", rarity: "Common", image: "https://placehold.co/240x336?text=Sprout+Cat" },
      { id: "en-002", name: "Wave Duck", rarity: "Common", image: "https://placehold.co/240x336?text=Wave+Duck" },
      { id: "en-003", name: "Fire Croc", rarity: "Common", image: "https://placehold.co/240x336?text=Fire+Croc" },
      { id: "en-004", name: "Pika Clone", rarity: "Uncommon", image: "https://placehold.co/240x336?text=Pika+Clone" },
      { id: "en-005", name: "Professor Pine", rarity: "Uncommon", image: "https://placehold.co/240x336?text=Professor+Pine" },
      { id: "en-006", name: "Dragon EX", rarity: "Rare", image: "https://placehold.co/240x336?text=Dragon+EX" },
      { id: "en-007", name: "Golden Ball", rarity: "Ultra Rare", image: "https://placehold.co/240x336?text=Golden+Ball" },
      { id: "en-008", name: "Leaf Bug", rarity: "Common", image: "https://placehold.co/240x336?text=Leaf+Bug" },
      { id: "en-009", name: "Tiny Mouse", rarity: "Common", image: "https://placehold.co/240x336?text=Tiny+Mouse" },
      { id: "en-010", name: "Stone Pup", rarity: "Uncommon", image: "https://placehold.co/240x336?text=Stone+Pup" },
      { id: "en-011", name: "Night Bat", rarity: "Rare", image: "https://placehold.co/240x336?text=Night+Bat" },
      { id: "en-012", name: "Silver Trainer", rarity: "Ultra Rare", image: "https://placehold.co/240x336?text=Silver+Trainer" },
    ],
  },
  {
    id: "sv-jp-001",
    language: "Japanese",
    name: "Japanese Demo Set",
    packSize: 5,
    cards: [
      { id: "jp-001", name: "ニャオハ", rarity: "Common", image: "https://placehold.co/240x336?text=%E3%83%8B%E3%83%A3%E3%82%AA%E3%83%8F" },
      { id: "jp-002", name: "クワッス", rarity: "Common", image: "https://placehold.co/240x336?text=%E3%82%AF%E3%83%AF%E3%83%83%E3%82%B9" },
      { id: "jp-003", name: "ホゲータ", rarity: "Common", image: "https://placehold.co/240x336?text=%E3%83%9B%E3%82%B2%E3%83%BC%E3%82%BF" },
      { id: "jp-004", name: "トレーナーA", rarity: "Uncommon", image: "https://placehold.co/240x336?text=%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8A%E3%83%BCA" },
      { id: "jp-005", name: "トレーナーB", rarity: "Uncommon", image: "https://placehold.co/240x336?text=%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8A%E3%83%BCB" },
      { id: "jp-006", name: "伝説EX", rarity: "Rare", image: "https://placehold.co/240x336?text=%E4%BC%9D%E8%AA%ACEX" },
      { id: "jp-007", name: "金のカード", rarity: "Ultra Rare", image: "https://placehold.co/240x336?text=%E9%87%91%E3%81%AE%E3%82%AB%E3%83%BC%E3%83%89" },
      { id: "jp-008", name: "コロボーシ", rarity: "Common", image: "https://placehold.co/240x336?text=%E3%82%B3%E3%83%AD%E3%83%9C%E3%83%BC%E3%82%B7" },
      { id: "jp-009", name: "パモ", rarity: "Common", image: "https://placehold.co/240x336?text=%E3%83%91%E3%83%A2" },
      { id: "jp-010", name: "いわいぬ", rarity: "Uncommon", image: "https://placehold.co/240x336?text=%E3%81%84%E3%82%8F%E3%81%84%E3%81%AC" },
      { id: "jp-011", name: "よるこうもり", rarity: "Rare", image: "https://placehold.co/240x336?text=%E3%82%88%E3%82%8B%E3%81%93%E3%81%86%E3%82%82%E3%82%8A" },
      { id: "jp-012", name: "ぎんのトレーナー", rarity: "Ultra Rare", image: "https://placehold.co/240x336?text=%E3%81%8E%E3%82%93%E3%81%AE%E3%83%88%E3%83%AC%E3%83%BC%E3%83%8A%E3%83%BC" },
    ],
  },
];

const rarityWeights = {
  Common: 55,
  Uncommon: 28,
  Rare: 13,
  "Ultra Rare": 4,
};

function weightedRandom(cards) {
  const expanded = cards.map((card) => ({ ...card, weight: rarityWeights[card.rarity] ?? 1 }));

  const total = expanded.reduce((sum, card) => sum + card.weight, 0);
  let roll = Math.random() * total;

  for (const card of expanded) {
    roll -= card.weight;
    if (roll <= 0) return card;
  }

  return expanded[expanded.length - 1];
}

function openPack(setData) {
  const availableCards = [...setData.cards];
  const pack = [];
  const cardsToPull = Math.min(setData.packSize, availableCards.length);

  for (let i = 0; i < cardsToPull; i++) {
    const pulledCard = weightedRandom(availableCards);
    pack.push(pulledCard);

    const removeIndex = availableCards.findIndex((card) => card.id === pulledCard.id);
    if (removeIndex !== -1) {
      availableCards.splice(removeIndex, 1);
    }
  }

  return pack;
}

export default function App() {
  const [selectedSetId, setSelectedSetId] = useState(SETS[0].id);
  const [lastPack, setLastPack] = useState([]);
  const [allCollections, setAllCollections] = useState(() => {
    const startingCollections = {};
    for (const set of SETS) {
      startingCollections[set.id] = {};
    }
    return startingCollections;
  });
  const [revealedCount, setRevealedCount] = useState(0);

  const collection = allCollections[selectedSetId] || {};

  const selectedSet = useMemo(
    () => SETS.find((setItem) => setItem.id === selectedSetId) ?? SETS[0],
    [selectedSetId]
  );

  function handleOpenPack() {
    const pack = openPack(selectedSet);
    setLastPack(pack);
    setRevealedCount(0);

    setAllCollections((prev) => {
      const next = { ...prev };
      const currentSetCollection = { ...(next[selectedSetId] || {}) };

      for (const card of pack) {
        currentSetCollection[card.id] = (currentSetCollection[card.id] || 0) + 1;
      }

      next[selectedSetId] = currentSetCollection;
      return next;
    });

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setRevealedCount(current);

      if (current >= pack.length) {
        clearInterval(interval);
      }
    }, 500);
  }

  function handleResetCollection() {
    setAllCollections((prev) => ({
      ...prev,
      [selectedSetId]: {},
    }));
    setLastPack([]);
    setRevealedCount(0);
  }

  const uniqueCollected = Object.values(collection).filter((count) => count > 0).length;
  const totalCards = selectedSet.cards.length;

  return (
    <div className="app">
      <header className="header">
        <h1>Pokemon Pack Simulator</h1>

        <div className="controls">
          <select
            value={selectedSetId}
            onChange={(e) => {
              setSelectedSetId(e.target.value);
              setLastPack([]);
              setRevealedCount(0);
            }}
          >
            {SETS.map((setItem) => (
              <option key={setItem.id} value={setItem.id}>
                {setItem.language} - {setItem.name}
              </option>
            ))}
          </select>

          <button onClick={handleOpenPack}>Open Pack</button>
          <button onClick={handleResetCollection}>Reset Set</button>
        </div>
      </header>

      <main className="layout">
        <section className="content">
          <h2>Latest Pack</h2>

          {lastPack.length === 0 ? (
            <p>No pack opened yet.</p>
          ) : (
            <div className="card-grid">
              {lastPack.slice(0, revealedCount).map((card, index) => (
                <div key={`${card.id}-${index}`} className="pack-card">
                  <img src={card.image} alt={card.name} />
                </div>
              ))}
            </div>
          )}

          <h2>Collection ({uniqueCollected}/{totalCards})</h2>

          <div className="card-grid" key={selectedSetId}>
            {selectedSet.cards
              .filter((card) => (collection[card.id] || 0) > 0)
              .map((card) => {
                const owned = collection[card.id];

                return (
                  <div key={card.id} className="collection-card">
                    <img src={card.image} alt={card.name} />
                    <h4 className="card-name">{card.name}</h4>
                    <p className="count-badge">x{owned}</p>
                  </div>
                );
              })}
          </div>
        </section>
      </main>
    </div>
  );
}