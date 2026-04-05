import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadSimulatorSet } from "../api/loadSimulatorSet";
import PackOverlay from "../components/PackOverlay";
import CollectionGrid from "../components/CollectionGrid";

const ENTER_DELAY_MS = 100;
const FLIP_DELAY_MS = 225;
const PAUSE_BEFORE_FLIP_MS = 300;

const EARLIER_SERIES_IDS = [
  "base",
  "ex",
  "dp",
  "pl",
  "hgss",
  "bw",
  "xy",
  "sm",
  "swsh",
  "placeholder_old_1",
  "placeholder_old_2",
];

const ERA_PACK_RULES = {
  swsh_and_earlier: {
    commonCount: 5,
    uncommonCount: 3,
    reverseSlot: {
      allowRarities: ["Common", "Uncommon", "Rare"],
      rarityWeights: {
        Common: 1,
        Uncommon: 1,
        Rare: 1,
      },
    },
    rareSlotWeights: {
      Rare: 55,
      "Holo Rare": 25,
      "Ultra Rare": 12,
      "Secret Rare": 5,
      "Hyper Rare": 3,
    },
  },
  modern_placeholder: {
    commonCount: 5,
    uncommonCount: 3,
    reverseSlot: {
      allowRarities: ["Common", "Uncommon", "Rare"],
      rarityWeights: {
        Common: 1,
        Uncommon: 1,
        Rare: 1,
      },
    },
    rareSlotWeights: {
      Rare: 45,
      "Holo Rare": 30,
      "Ultra Rare": 15,
      "Secret Rare": 7,
      "Hyper Rare": 3,
    },
  },
};

function getEraKeyForSet(setData) {
  if (EARLIER_SERIES_IDS.includes(setData.serieId)) {
    return "swsh_and_earlier";
  }
  return "modern_placeholder";
}

function weightedPickOne(cards, weightsByRarity) {
  if (cards.length === 0) return null;

  const expanded = cards.map((card) => ({
    ...card,
    weight: weightsByRarity[card.rarity] ?? 1,
  }));

  const total = expanded.reduce((sum, card) => sum + card.weight, 0);
  let roll = Math.random() * total;

  for (const card of expanded) {
    roll -= card.weight;
    if (roll <= 0) return card;
  }

  return expanded[expanded.length - 1];
}

function takeRandomUnique(cards, count, excludedIds = new Set()) {
  const available = cards.filter((card) => !excludedIds.has(card.id));
  const chosen = [];
  const pool = [...available];
  const amount = Math.min(count, pool.length);

  for (let i = 0; i < amount; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    const picked = pool[randomIndex];
    chosen.push(picked);
    excludedIds.add(picked.id);
    pool.splice(randomIndex, 1);
  }

  return chosen;
}

function takeWeightedUnique(cards, weightsByRarity, excludedIds = new Set()) {
  const pool = cards.filter((card) => !excludedIds.has(card.id));
  const picked = weightedPickOne(pool, weightsByRarity);

  if (!picked) return null;

  excludedIds.add(picked.id);
  return picked;
}

function openPack(setData) {
  const eraKey = getEraKeyForSet(setData);
  const rules = ERA_PACK_RULES[eraKey];
  const usedIds = new Set();

  const commonsPool = setData.cards.filter((card) => card.rarity === "Common");
  const uncommonsPool = setData.cards.filter((card) => card.rarity === "Uncommon");

  const reversePool = setData.cards.filter(
    (card) =>
      card.canBeReverseHolo &&
      ["Common", "Uncommon", "Rare"].includes(card.rarity)
  );

  const rarePool = setData.cards.filter((card) =>
    Object.keys(rules.rareSlotWeights).includes(card.rarity)
  );

  const commons = takeRandomUnique(commonsPool, rules.commonCount, usedIds);
  const uncommons = takeRandomUnique(uncommonsPool, rules.uncommonCount, usedIds);

  const reverse = takeWeightedUnique(
    reversePool,
    rules.reverseSlot.rarityWeights,
    usedIds
  );

  const rare = takeWeightedUnique(rarePool, rules.rareSlotWeights, usedIds);

  return [
    ...commons,
    ...uncommons,
    ...(reverse ? [{ ...reverse, pulledAs: "Reverse Holo" }] : []),
    ...(rare
      ? [
          {
            ...rare,
            pulledAs: rare.rarity === "Holo Rare" ? "Holo" : "Rare Slot",
          },
        ]
      : []),
  ];
}

function getCollectedVariantKey(card) {
  const finish =
    card.pulledAs === "Reverse Holo"
      ? "reverse"
      : card.pulledAs === "Holo"
      ? "holo"
      : "normal";

  return `${card.id}|${finish}`;
}

export default function SimulatorPage() {
  const { setId, language } = useParams();
  const navigate = useNavigate();

  const [selectedSet, setSelectedSet] = useState(null);
  const [isLoadingSet, setIsLoadingSet] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [lastPack, setLastPack] = useState([]);
  const [pendingPack, setPendingPack] = useState([]);
  const [allCollections, setAllCollections] = useState({});
  const [enteredCount, setEnteredCount] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isOpeningPack, setIsOpeningPack] = useState(false);

  const animationTimeoutRef = useRef([]);

  useEffect(() => {
    async function fetchSet() {
      try {
        setIsLoadingSet(true);
        setLoadError("");

        const loadedSet = await loadSimulatorSet(setId, language);
        setSelectedSet(loadedSet);

        setAllCollections((prev) => ({
          ...prev,
          [loadedSet.id]: prev[loadedSet.id] || {},
        }));
      } catch (error) {
        console.error("Set loading failed:", error);
        setLoadError(error.message || "Failed to load selected set.");
      } finally {
        setIsLoadingSet(false);
      }
    }

    fetchSet();
  }, [setId, language]);

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

  const collection = useMemo(() => {
    if (!selectedSet) return {};
    return allCollections[selectedSet.id] || {};
  }, [allCollections, selectedSet]);

  function handleOpenPack() {
    if (!selectedSet || isOpeningPack) return;

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

    if (pendingPack.length > 0 && selectedSet) {
      setAllCollections((prev) => {
        const next = { ...prev };
        const currentSetCollection = { ...(next[selectedSet.id] || {}) };

        for (const card of pendingPack) {
          const variantKey = getCollectedVariantKey(card);

          if (!currentSetCollection[variantKey]) {
            currentSetCollection[variantKey] = {
              ...card,
              count: 0,
            };
          }

          currentSetCollection[variantKey].count += 1;
        }

        next[selectedSet.id] = currentSetCollection;
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
    if (!selectedSet) return;

    clearAnimationTimeouts();

    setAllCollections((prev) => ({
      ...prev,
      [selectedSet.id]: {},
    }));

    setPendingPack([]);
    setLastPack([]);
    setEnteredCount(0);
    setRevealedCount(0);
    setIsOpeningPack(false);
  }

  if (isLoadingSet) {
    return (
      <div className="app">
        <div className="layout">
          <section className="content">
            <p>Loading set...</p>
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
            <button onClick={() => navigate("/")}>Back to Set Select</button>
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
            <button onClick={() => navigate("/")}>Back to Set Select</button>
            <p>No set selected.</p>
          </section>
        </div>
      </div>
    );
  }

  const uniqueCollected = Object.keys(collection).length;
  const totalCards = selectedSet.cards.length;

  return (
    <div className="app">
      <header className="header">
        <h1>Pokemon Pack Simulator</h1>

        <div className="controls">
          <button onClick={() => navigate("/")}>Change Set</button>
          <button onClick={handleOpenPack}>Open Pack</button>
          <button onClick={handleResetCollection}>Reset Set</button>
        </div>
      </header>

      <main className="layout">
        <section className="content">
          <h2>{selectedSet.language} - {selectedSet.name}</h2>
          <h3>
            Collection ({uniqueCollected}/{totalCards})
          </h3>

          <CollectionGrid
            collection={collection}
            selectedSetId={selectedSet.id}
            selectedSet={selectedSet}
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