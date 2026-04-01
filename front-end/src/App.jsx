import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadSimulatorSet } from "./api/loadSimulatorSet";
import PackOverlay from "./components/PackOverlay";
import CollectionGrid from "./components/CollectionGrid";
import "./styles.css";

const rarityWeights = {
  Common: 60,
  Uncommon: 25,
  Rare: 10,
  "Ultra Rare": 5,
};

const ENTER_DELAY_MS = 100;
const FLIP_DELAY_MS = 175;
const PAUSE_BEFORE_FLIP_MS = 300;

function weightedRandom(cards) {
  const expanded = cards.map((card) => ({
    ...card,
    weight: rarityWeights[card.rarity] ?? 1,
  }));

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

    const removeIndex = availableCards.findIndex(
      (card) => card.id === pulledCard.id
    );

    if (removeIndex !== -1) {
      availableCards.splice(removeIndex, 1);
    }
  }

  return pack;
}

export default function App() {
  const [sets, setSets] = useState([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSetId, setSelectedSetId] = useState("");

  const [lastPack, setLastPack] = useState([]);
  const [pendingPack, setPendingPack] = useState([]);
  const [allCollections, setAllCollections] = useState({});
  const [enteredCount, setEnteredCount] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isOpeningPack, setIsOpeningPack] = useState(false);

  const animationTimeoutRef = useRef([]);

  useEffect(() => {
    async function fetchSets() {
      try {
        setIsLoadingSets(true);
        setLoadError("");

        const englishSet = await loadSimulatorSet("swsh3", "en");
        setSets([englishSet]);
        setSelectedSetId(englishSet.id);
      } catch (error) {
        console.error("Set loading failed:", error);
        setLoadError(error.message || "Failed to load card sets.");
      } finally {
        setIsLoadingSets(false);
      }
    }

    fetchSets();
  }, []);

  useEffect(() => {
    if (sets.length === 0) return;

    setAllCollections((prev) => {
      const next = { ...prev };

      for (const set of sets) {
        if (!next[set.id]) {
          next[set.id] = {};
        }
      }

      return next;
    });
  }, [sets]);

  useEffect(() => {
    return () => {
      animationTimeoutRef.current.forEach((timeoutId) =>
        clearTimeout(timeoutId)
      );
    };
  }, []);

  function clearAnimationTimeouts() {
    animationTimeoutRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    animationTimeoutRef.current = [];
  }

  const selectedSet = useMemo(
    () => sets.find((setItem) => setItem.id === selectedSetId) ?? null,
    [sets, selectedSetId]
  );

  const collection = selectedSetId ? allCollections[selectedSetId] || {} : {};

  function handleOpenPack() {
    if (!selectedSet) return;

    clearAnimationTimeouts();

    const pack = openPack(selectedSet);
    setPendingPack(pack);
    setLastPack(pack);
    setEnteredCount(0);
    setRevealedCount(0);
    setIsOpeningPack(true);

    pack.forEach((_, index) => {
      const timeoutId = setTimeout(() => {
        setEnteredCount(index + 1);
      }, (index + 1) * ENTER_DELAY_MS);

      animationTimeoutRef.current.push(timeoutId);
    });

    const appearDuration = pack.length * ENTER_DELAY_MS + PAUSE_BEFORE_FLIP_MS;

    pack.forEach((_, index) => {
      const timeoutId = setTimeout(() => {
        setRevealedCount(index + 1);
      }, appearDuration + index * FLIP_DELAY_MS);

      animationTimeoutRef.current.push(timeoutId);
    });
  }

  function handleCloseOverlay() {
    clearAnimationTimeouts();

    if (pendingPack.length > 0 && selectedSetId) {
      setAllCollections((prev) => {
        const next = { ...prev };
        const currentSetCollection = { ...(next[selectedSetId] || {}) };

        for (const card of pendingPack) {
          currentSetCollection[card.id] =
            (currentSetCollection[card.id] || 0) + 1;
        }

        next[selectedSetId] = currentSetCollection;
        return next;
      });
    }

    setPendingPack([]);
    setIsOpeningPack(false);
    setLastPack([]);
    setEnteredCount(0);
    setRevealedCount(0);
  }

  function handleResetCollection() {
    if (!selectedSetId) return;

    clearAnimationTimeouts();

    setAllCollections((prev) => ({
      ...prev,
      [selectedSetId]: {},
    }));

    setPendingPack([]);
    setLastPack([]);
    setEnteredCount(0);
    setRevealedCount(0);
    setIsOpeningPack(false);
  }

  if (isLoadingSets) {
    return (
      <div className="app">
        <div className="layout">
          <section className="content">
            <p>Loading sets...</p>
          </section>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app">
        <div className="layout">
          <section className="content">
            <p>{loadError}</p>
          </section>
        </div>
      </div>
    );
  }

  if (!selectedSet) {
    return (
      <div className="app">
        <div className="layout">
          <section className="content">
            <p>No set selected.</p>
          </section>
        </div>
      </div>
    );
  }

  const uniqueCollected = Object.values(collection).filter(
    (count) => count > 0
  ).length;
  const totalCards = selectedSet.cards.length;

  return (
    <div className="app">
      <header className="header">
        <h1>Pokemon Pack Simulator</h1>

        <div className="controls">
          <select
            value={selectedSetId}
            onChange={(e) => {
              clearAnimationTimeouts();
              setSelectedSetId(e.target.value);
              setPendingPack([]);
              setLastPack([]);
              setEnteredCount(0);
              setRevealedCount(0);
              setIsOpeningPack(false);
            }}
          >
            {sets.map((setItem) => (
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
          <h2>
            Collection ({uniqueCollected}/{totalCards})
          </h2>

          <CollectionGrid
            selectedSet={selectedSet}
            collection={collection}
            selectedSetId={selectedSetId}
          />
        </section>
      </main>

      <PackOverlay
        isOpeningPack={isOpeningPack}
        lastPack={lastPack}
        enteredCount={enteredCount}
        revealedCount={revealedCount}
        selectedSet={selectedSet}
        handleCloseOverlay={handleCloseOverlay}
      />
    </div>
  );
}