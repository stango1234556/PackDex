import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { loadSimulatorSet } from "../api/loadSimulatorSet";
import PackOverlay from "../components/PackOverlay";
import CollectionGrid from "../components/CollectionGrid";

const ENTER_DELAY_MS = 100;
const FLIP_DELAY_MS = 225;
const PAUSE_BEFORE_FLIP_MS = 300;
const HIT_EFFECT_DELAY_MS = 550;

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
    slot9Weights: {
      reverse: 88,
      radiant: 4,
      gallery: 8,
    },
    reverseRarityWeights: {
      Common: 8,
      Uncommon: 3,
      Rare: 1,
    },
    rareSlotWeights: {
      Rare: 68,
      "Holo Rare": 22,
      "Ultra Rare": 7,
      "Secret Rare": 2,
      "Hyper Rare": 1,
    },
  },
  modern_sv_and_later: {
    commonCount: 4,
    uncommonCount: 3,
    slot8ReverseWeights: {
      Common: 6,
      Uncommon: 3,
      Rare: 1,
    },
    slot9Weights: {
      reverse: 72,
      illustration: 20,
      hyper: 8,
    },
    slot10Weights: {
      Rare: 65,
      "Double Rare": 22,
      "Ultra Rare": 10,
      "Hyper Rare": 3,
    },
  },
};

const MANUAL_SET_LOGOS_BY_NAME = {
  "Dragon Majesty": "/set-logos/dragon-majesty.png",
  "Temporal Forces": "/set-logos/temporal-forces.png",
  "Shining Legends": "/set-logos/shining-legends.png",
};

const SET_THEME_BY_NAME = {
  "Temporal Forces": {
    background: "linear-gradient(135deg, #5f6b2d 0%, #9c4c1f 50%, #3a2218 100%)",
  },
  "Shining Legends": {
    background: "linear-gradient(135deg, #2e2f5d 0%, #4b2d6b 45%, #a87d1f 100%)",
  },
  "Dragon Majesty": {
    background: "linear-gradient(135deg, #4a0d0d 0%, #7a1f1f 45%, #d78b20 100%)",
  },
};

function getSetLogoSrc(setInfo) {
  if (MANUAL_SET_LOGOS_BY_NAME[setInfo.name]) {
    return MANUAL_SET_LOGOS_BY_NAME[setInfo.name];
  }

  if (setInfo.logo) {
    return `${setInfo.logo}.png`;
  }

  return null;
}

function getSetHeroStyle() {
  return {
    background: "linear-gradient(135deg, #1f2730 0%, #2d2d2d 45%, #171717 100%)",
  };
}

function getSetTcgplayerSearchUrl(setInfo) {
  const query = `${setInfo.name} Pokemon`;
  return `https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=${encodeURIComponent(query)}`;
}

function getEraKeyForSet(setData) {
  if (EARLIER_SERIES_IDS.includes(setData.serieId)) {
    return "swsh_and_earlier";
  }

  return "modern_sv_and_later";
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

function weightedPickOneByValue(options) {
  const filtered = options.filter((option) => option.weight > 0);
  if (filtered.length === 0) return null;

  const total = filtered.reduce((sum, option) => sum + option.weight, 0);
  let roll = Math.random() * total;

  for (const option of filtered) {
    roll -= option.weight;
    if (roll <= 0) return option.value;
  }

  return filtered[filtered.length - 1].value;
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

function isShinyVaultSet(setData) {
  return setData.id === "sm115" || setData.id === "swsh4.5";
}

function isShinyVault(card, setData) {
  if (!card) return false;

  const localId = card.localId || "";
  const id = card.id || "";

  if (setData?.id === "sm115") {
    return /^SV/i.test(localId) || /^sma-/i.test(id);
  }

  if (setData?.id === "swsh4.5") {
    return /^SV/i.test(localId);
  }

  return false;
}

function isBabyShiny(card, setData) {
  return (
    isShinyVault(card, setData) &&
    !/\bGX\b/i.test(card.name || "") &&
    !/\bV\b/i.test(card.name || "") &&
    !/\bVMAX\b/i.test(card.name || "") &&
    card.category !== "Trainer"
  );
}

function isShinyVaultRare(card, setData) {
  return isShinyVault(card, setData) && !isBabyShiny(card, setData);
}

function isAmazingRare(card, setData) {
  const name = card?.name || "";

  const isCorrectSet =
    setData.id === "swsh4" ||   // Vivid Voltage
    setData.id === "swsh4.5";    // Shining Fates

  if (!isCorrectSet) return false;

  const AMAZING_RARE_NAMES = [
    "Celebi",
    "Raikou",
    "Zacian",
    "Zamazenta",
    "Jirachi",
    "Rayquaza",
    "Reshiram",
    "Kyogre",
    "Yveltal",
  ];

  const isAmazingName = AMAZING_RARE_NAMES.some((n) =>
    new RegExp(`^${n}\\b`, "i").test(name)
  );

  return (
    isAmazingName &&
    card?.rarity === "Rare" &&
    card?.variants?.holo === true &&
    card?.variants?.normal !== true &&
    card?.variants?.reverse !== true &&
    card?.category !== "Trainer"
  );
}

function isRadiantLike(card) {
  return /^Radiant\b/i.test(card?.name || "");
}

function isTrainerGalleryLike(card) {
  const localId = card?.localId || "";
  return /^(TG|GG)/i.test(localId);
}

function isIllustrationRare(card) {
  return card?.rarity === "Illustration Rare";
}

function isSpecialIllustrationRare(card) {
  return card?.rarity === "Special Illustration Rare";
}

function isHyperRare(card) {
  return card?.rarity === "Hyper Rare";
}

function isDoubleRare(card) {
  return card?.rarity === "Double Rare";
}

function buildUniquePool(cards) {
  return cards.filter(
    (card, index, arr) => arr.findIndex((other) => other.id === card.id) === index
  );
}

function withSetMeta(card, setData, pulledAs = "Normal") {
  return {
    ...card,
    setName: setData.name,
    setId: setData.id,
    serieId: setData.serieId,
    serieName: setData.serieName,
    pulledAs,
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}

async function logReverseHoloCardsInHiddenFates(language = "en") {
  const hiddenFatesSet = await fetchJson(
    `https://api.tcgdex.net/v2/${language}/sets/sm115`
  );

  const reverseHoloCards = [];

  for (const cardResume of hiddenFatesSet.cards) {
    try {
      const fullCard = await fetchJson(
        `https://api.tcgdex.net/v2/${language}/cards/${cardResume.id}`
      );

      if (fullCard?.variants?.reverse === true) {
        reverseHoloCards.push({
          id: fullCard.id,
          localId: fullCard.localId,
          name: fullCard.name,
          rarity: fullCard.rarity,
          variants: fullCard.variants,
        });
      }
    } catch (error) {
      console.log("Failed to fetch card:", cardResume.id, error);
    }
  }

  console.log("Reverse holo eligible Hidden Fates cards:");
  console.table(reverseHoloCards);
  console.log("Count:", reverseHoloCards.length);

  return reverseHoloCards;
}

function openPack(setData) {
  const eraKey = getEraKeyForSet(setData);
  const rules = ERA_PACK_RULES[eraKey];
  const usedIds = new Set();

  const commonsPool = setData.cards.filter((card) => card.rarity === "Common");
  const uncommonsPool = setData.cards.filter((card) => card.rarity === "Uncommon");

  const commons = takeRandomUnique(commonsPool, rules.commonCount, usedIds);
  const uncommons = takeRandomUnique(uncommonsPool, rules.uncommonCount, usedIds);

  if (eraKey === "swsh_and_earlier") {
    const isHiddenFates = isShinyVaultSet(setData);

    const reversePool = setData.cards.filter(
      (card) =>
        card.canBeReverseHolo &&
        ["Common", "Uncommon", "Rare"].includes(card.rarity) &&
        !isAmazingRare(card, setData)
    );

    const babyShinyPool = isHiddenFates
      ? setData.cards.filter((card) => isBabyShiny(card, setData))
      : [];

    const shinyRarePool = isHiddenFates
      ? setData.cards.filter((card) => isShinyVaultRare(card, setData))
      : [];

    const radiantPool = setData.cards.filter((card) => isRadiantLike(card));
    const galleryPool = setData.cards.filter((card) => isTrainerGalleryLike(card));

    const rarePool = setData.cards.filter(
      (card) =>
        Object.keys(rules.rareSlotWeights).includes(card.rarity) &&
        !isTrainerGalleryLike(card) &&
        !isRadiantLike(card) &&
        !isShinyVault(card, setData) &&
        !isAmazingRare(card, setData) && 
        !(
          card?.name &&
          ["Celebi","Raikou","Zacian","Zamazenta","Jirachi","Rayquaza","Reshiram","Kyogre","Yveltal"]
            .some(n => card.name.startsWith(n))
        ) 
    );

    const availableReversePool = reversePool.filter((c) => !usedIds.has(c.id));
    const availableBabyShinyPool = babyShinyPool.filter((c) => !usedIds.has(c.id));
    const availableRadiantPool = radiantPool.filter((c) => !usedIds.has(c.id));
    const availableGalleryPool = galleryPool.filter((c) => !usedIds.has(c.id));
    const availableAmazingRarePool = setData.cards.filter(
      (c) => isAmazingRare(c, setData) && !usedIds.has(c.id)
    );

    const slot9Type = weightedPickOneByValue([
      {
        value: "amazingRare",
        weight: availableAmazingRarePool.length > 0 ? 6 : 0,
      },
      {
        value: "babyShiny",
        weight: availableBabyShinyPool.length > 0 ? 10 : 0,
      },
      {
        value: "reverse",
        weight: availableReversePool.length > 0 ? 72 : 0,
      },
      {
        value: "radiant",
        weight: availableRadiantPool.length > 0 ? rules.slot9Weights.radiant : 0,
      },
      {
        value: "gallery",
        weight: availableGalleryPool.length > 0 ? rules.slot9Weights.gallery : 0,
      },
    ]);

    let slot9Card = null;

    if (slot9Type === "amazingRare") {
      const picked = takeWeightedUnique(
        buildUniquePool(availableAmazingRarePool),
        { Rare: 1 },
        usedIds
      );
      if (picked) {
        slot9Card = withSetMeta(picked, setData, "Amazing Rare");
      }
    } else if (slot9Type === "babyShiny") {
      const picked = takeWeightedUnique(
        buildUniquePool(availableBabyShinyPool),
        { Rare: 1 },
        usedIds
      );
      if (picked) {
        slot9Card = withSetMeta(picked, setData, "Baby Shiny");
      }
    } else if (slot9Type === "radiant") {
      const picked = takeWeightedUnique(
        buildUniquePool(availableRadiantPool),
        {
          Rare: 1,
          "Holo Rare": 1,
          "Ultra Rare": 1,
          "Secret Rare": 1,
          "Hyper Rare": 1,
        },
        usedIds
      );
      if (picked) {
        slot9Card = withSetMeta(picked, setData, "Slot 9 Special");
      }
    } else if (slot9Type === "gallery") {
      const picked = takeWeightedUnique(
        buildUniquePool(availableGalleryPool),
        {
          Rare: 1,
          "Holo Rare": 1,
          "Ultra Rare": 1,
          "Secret Rare": 1,
          "Hyper Rare": 1,
        },
        usedIds
      );
      if (picked) {
        slot9Card = withSetMeta(picked, setData, "Slot 9 Special");
      }
    } else {
      const picked = takeWeightedUnique(
        buildUniquePool(availableReversePool),
        rules.reverseRarityWeights,
        usedIds
      );
      if (picked) {
        slot9Card = withSetMeta(picked, setData, "Reverse Holo");
      }
    }

    const availableRarePool = rarePool.filter((c) => !usedIds.has(c.id));
    const availableShinyRarePool = shinyRarePool.filter((c) => !usedIds.has(c.id));

    let slot10CardBase = null;

    if (isHiddenFates) {
      const slot10Type = weightedPickOneByValue([
        { value: "shinyRare", weight: availableShinyRarePool.length > 0 ? 12 : 0 },
        { value: "normalRare", weight: availableRarePool.length > 0 ? 88 : 0 },
      ]);

      if (slot10Type === "shinyRare") {
        slot10CardBase = takeWeightedUnique(
          buildUniquePool(availableShinyRarePool),
          {
            "Ultra Rare": 1,
            "Holo Rare": 1,
            Rare: 1,
          },
          usedIds
        );
      } else {
        slot10CardBase = takeWeightedUnique(
          availableRarePool,
          rules.rareSlotWeights,
          usedIds
        );
      }
    } else {
      slot10CardBase = takeWeightedUnique(
        availableRarePool,
        rules.rareSlotWeights,
        usedIds
      );
    }

    const slot10Card = slot10CardBase
      ? withSetMeta(
          slot10CardBase,
          setData,
          slot10CardBase.rarity === "Holo Rare" ? "Holo" : "Rare Slot"
        )
      : null;

    return [
      ...commons.map((card) => withSetMeta(card, setData, "Normal")),
      ...uncommons.map((card) => withSetMeta(card, setData, "Normal")),
      ...(slot9Card ? [slot9Card] : []),
      ...(slot10Card ? [slot10Card] : []),
    ];
  }

  const reversePool = setData.cards.filter(
    (card) =>
      card.canBeReverseHolo &&
      ["Common", "Uncommon", "Rare"].includes(card.rarity)
  );

  const illustrationPool = setData.cards.filter(
    (card) => isIllustrationRare(card) || isSpecialIllustrationRare(card)
  );

  const hyperPool = setData.cards.filter((card) => isHyperRare(card));

  const slot10Pool = setData.cards.filter(
    (card) =>
      card.rarity === "Rare" ||
      isDoubleRare(card) ||
      card.rarity === "Ultra Rare" ||
      card.rarity === "Hyper Rare"
  );

  const slot8CardBase = takeWeightedUnique(
    reversePool,
    rules.slot8ReverseWeights,
    usedIds
  );

  const slot8Card = slot8CardBase
    ? withSetMeta(slot8CardBase, setData, "Reverse Holo")
    : null;

  const availableReversePool = reversePool.filter((card) => !usedIds.has(card.id));
  const availableIllustrationPool = illustrationPool.filter(
    (card) => !usedIds.has(card.id)
  );
  const availableHyperPool = hyperPool.filter((card) => !usedIds.has(card.id));

  const slot9Type = weightedPickOneByValue([
    {
      value: "reverse",
      weight: availableReversePool.length > 0 ? rules.slot9Weights.reverse : 0,
    },
    {
      value: "illustration",
      weight:
        availableIllustrationPool.length > 0 ? rules.slot9Weights.illustration : 0,
    },
    {
      value: "hyper",
      weight: availableHyperPool.length > 0 ? rules.slot9Weights.hyper : 0,
    },
  ]);

  let slot9Card = null;

  if (slot9Type === "illustration") {
    const pickedIllustration = takeWeightedUnique(
      buildUniquePool(availableIllustrationPool),
      {
        "Illustration Rare": 4,
        "Special Illustration Rare": 1,
      },
      usedIds
    );

    if (pickedIllustration) {
      slot9Card = withSetMeta(pickedIllustration, setData, "Slot 9 Special");
    }
  } else if (slot9Type === "hyper") {
    const pickedHyper = takeWeightedUnique(
      buildUniquePool(availableHyperPool),
      {
        "Hyper Rare": 1,
      },
      usedIds
    );

    if (pickedHyper) {
      slot9Card = withSetMeta(pickedHyper, setData, "Slot 9 Special");
    }
  } else {
    const pickedReverse = takeWeightedUnique(
      buildUniquePool(availableReversePool),
      rules.slot8ReverseWeights,
      usedIds
    );

    if (pickedReverse) {
      slot9Card = withSetMeta(pickedReverse, setData, "Reverse Holo");
    }
  }

  const slot10CardBase = takeWeightedUnique(
    slot10Pool,
    rules.slot10Weights,
    usedIds
  );

  let slot10PulledAs = "Rare Slot";

  const isHoloOnlySlot10Card =
    slot10CardBase?.variants?.holo === true &&
    slot10CardBase?.variants?.normal !== true;

  if (slot10CardBase?.rarity === "Double Rare") {
    slot10PulledAs = "Double Rare";
  } else if (
    slot10CardBase?.rarity === "Ultra Rare" ||
    slot10CardBase?.rarity === "Hyper Rare"
  ) {
    slot10PulledAs = "Ultra Rare";
  } else if (isHoloOnlySlot10Card) {
    slot10PulledAs = "Holo";
  }

  const slot10Card = slot10CardBase
    ? withSetMeta(slot10CardBase, setData, slot10PulledAs)
    : null;

  return [
    ...commons.map((card) => withSetMeta(card, setData, "Normal")),
    ...uncommons.map((card) => withSetMeta(card, setData, "Normal")),
    ...(slot8Card ? [slot8Card] : []),
    ...(slot9Card ? [slot9Card] : []),
    ...(slot10Card ? [slot10Card] : []),
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
  const [hitEffectCount, setHitEffectCount] = useState(0);
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
  if (!selectedSet) return;

  console.table(
    selectedSet.cards.map((card) => ({
      name: card.name,
      normal: card.variants?.normal ?? false,
      reverse: card.variants?.reverse ?? false,
      holo: card.variants?.holo ?? false,
    }))
  );
}, [selectedSet]);

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

  function savePendingPackToCollection(packToSave) {
    if (!packToSave.length || !selectedSet) return;

    setAllCollections((prev) => {
      const next = { ...prev };
      const currentSetCollection = { ...(next[selectedSet.id] || {}) };

      for (const card of packToSave) {
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

  function handleOpenPack() {
    if (!selectedSet || isOpeningPack) return;

    clearAnimationTimeouts();

    const pack = openPack(selectedSet);

    console.log(
      "Pulled pack:",
      pack.map((card, index) => ({
        slot: index + 1,
        name: card.name,
        rarity: card.rarity,
        pulledAs: card.pulledAs,
        setName: card.setName,
        localId: card.localId,
        normal: card?.variants?.normal ?? false,
        reverse: card?.variants?.reverse ?? false,
        holo: card?.variants?.holo ?? false,
      }))
    );

    setPendingPack(pack);
    setLastPack(pack);
    setEnteredCount(0);
    setRevealedCount(0);
    setHitEffectCount(0);
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

    pack.forEach((_, index) => {
      const timeoutId = setTimeout(() => {
        setHitEffectCount(index + 1);
      }, appearDuration + index * FLIP_DELAY_MS + HIT_EFFECT_DELAY_MS);

      animationTimeoutRef.current.push(timeoutId);
    });
  }

  function handleOpenAnotherPack() {
    if (!selectedSet || !pendingPack.length) return;

    clearAnimationTimeouts();
    savePendingPackToCollection(pendingPack);

    const pack = openPack(selectedSet);

    console.log(
      "Pulled pack:",
      pack.map((card, index) => ({
        slot: index + 1,
        name: card.name,
        rarity: card.rarity,
        pulledAs: card.pulledAs,
        setName: card.setName,
        localId: card.localId,
        normal: card?.variants?.normal ?? false,
        reverse: card?.variants?.reverse ?? false,
        holo: card?.variants?.holo ?? false,
      }))
    );

    setPendingPack(pack);
    setLastPack(pack);
    setEnteredCount(0);
    setRevealedCount(0);
    setHitEffectCount(0);
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

    pack.forEach((_, index) => {
      const timeoutId = setTimeout(() => {
        setHitEffectCount(index + 1);
      }, appearDuration + index * FLIP_DELAY_MS + HIT_EFFECT_DELAY_MS);

      animationTimeoutRef.current.push(timeoutId);
    });
  }

  function handleCloseOverlay() {
    clearAnimationTimeouts();
    savePendingPackToCollection(pendingPack);

    setPendingPack([]);
    setIsOpeningPack(false);
    setLastPack([]);
    setEnteredCount(0);
    setRevealedCount(0);
    setHitEffectCount(0);
  }

  if (isLoadingSet) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner-wrap">
          <img
            src="/pokeball.svg"
            alt="Loading"
            className="loading-pokeball-spinner"
          />
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

  const setLogoSrc = getSetLogoSrc(selectedSet);
  const logoPanelStyle = getSetHeroStyle(selectedSet);

  return (
    <div className="app">
      <header className="simulator-hero">
        <div className="simulator-hero-inner">
          <div className="simulator-hero-main">
            <div className="simulator-hero-logo-panel" style={logoPanelStyle}>
              {setLogoSrc ? (
                <img
                  src={setLogoSrc}
                  alt={`${selectedSet.name} logo`}
                  className="simulator-hero-logo"
                />
              ) : (
                <div className="simulator-hero-logo-fallback">
                  {selectedSet.name}
                </div>
              )}
            </div>

            <div className="simulator-hero-copy">
              <div className="simulator-hero-serie">
                {selectedSet.serieName || selectedSet.language}
              </div>
              <h1 className="simulator-hero-title">{selectedSet.name}</h1>

              <div className="simulator-hero-actions">
                <a
                  className="hero-shop-button"
                  href={getSetTcgplayerSearchUrl(selectedSet)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Shop {selectedSet.name}
                </a>

                <button
                  className="hero-open-pack-button"
                  onClick={handleOpenPack}
                >
                  <img
                    src="/pokeball_open.png"
                    alt=""
                    className="hero-open-pack-icon"
                  />
                  <span>Open a Booster Pack</span>
                </button>

                <button
                  className="hero-pill-button hero-pill-button-outline"
                  onClick={() => navigate("/")}
                >
                  Change Set
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="layout">
        <section className="content">
          <div className="collection-header">
            <h2>
              Collection ({uniqueCollected}/{totalCards})
            </h2>
          </div>

          <CollectionGrid
            collection={collection}
            selectedSetId={selectedSet.id}
            selectedSet={selectedSet}
          />
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-disclaimer">
          <p>
            This website is an unofficial fan-made project and is not produced,
            endorsed, supported, or affiliated with Nintendo, The Pokémon Company,
            or GAME FREAK.
          </p>
          <p>
            Card prices, market values, and promotional offers are provided by
            third-party sources and are intended as estimates only. No guarantee is
            made regarding the accuracy, completeness, or timeliness of any pricing
            information. Please refer to official sellers and marketplaces for final
            prices and details.
          </p>
          <p>
            Pack simulation odds, card data, and set information are based on
            third-party resources and may not perfectly reflect real-world products.
            No guarantee is made regarding pull rates, card availability, or
            simulation accuracy. Please refer to official Pokémon TCG products for
            final results.
          </p>
        </div>
      </footer>

      <PackOverlay
        isOpeningPack={isOpeningPack}
        lastPack={lastPack}
        enteredCount={enteredCount}
        revealedCount={revealedCount}
        hitEffectCount={hitEffectCount}
        selectedSet={selectedSet}
        handleCloseOverlay={handleCloseOverlay}
        handleOpenAnotherPack={handleOpenAnotherPack}
      />
    </div>
  );
}