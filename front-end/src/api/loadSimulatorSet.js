function normalizeRarity(rarity) {
  if (!rarity) return "Common";

  const value = rarity.toLowerCase();

  if (value.includes("hyper")) return "Hyper Rare";
  if (value.includes("secret")) return "Secret Rare";
  if (value.includes("ultra")) return "Ultra Rare";
  if (value.includes("holo")) return "Holo Rare";
  if (value.includes("rare")) return "Rare";
  if (value.includes("uncommon")) return "Uncommon";
  return "Common";
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
}

function mapCardData(fullCard, fallbackCard = {}) {
  const imageBase = fullCard.image || fallbackCard.image || "";

  return {
    id: fullCard.id || fallbackCard.id,
    localId: fullCard.localId || fallbackCard.localId || "",
    name: fullCard.name || fallbackCard.name || "Unknown Card",
    image: imageBase ? `${imageBase}/high.webp` : "",
    rarity: normalizeRarity(fullCard.rarity || fallbackCard.rarity),
    variants: fullCard.variants || fallbackCard.variants || {},
    pricing: fullCard.pricing || null,
    canBeReverseHolo: fullCard.variants?.reverse === true,
    canBeHolo: fullCard.variants?.holo === true,
  };
}

async function mapWithConcurrency(items, limit, asyncMapper) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await asyncMapper(items[index], index);
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

export async function loadSimulatorSet(setId, language = "en") {
  const apiSet = await fetchJson(`https://api.tcgdex.net/v2/${language}/sets/${setId}`);

  if (!apiSet) {
    throw new Error(`Set not found for id "${setId}" in language "${language}"`);
  }

  if (!apiSet.cards || !Array.isArray(apiSet.cards)) {
    throw new Error(`Set "${setId}" did not return a cards array`);
  }

  const fullCards = await mapWithConcurrency(apiSet.cards, 12, async (cardResume) => {
    try {
      const fullCard = await fetchJson(
        `https://api.tcgdex.net/v2/${language}/cards/${cardResume.id}`
      );

      return mapCardData(fullCard, cardResume);
    } catch (error) {
      console.log("FAILED CARD FETCH:", {
        requestedId: cardResume.id,
        name: cardResume.name,
        error,
      });

      return mapCardData(
        {
          id: cardResume.id,
          localId: cardResume.localId || "",
          name: cardResume.name,
          image: cardResume.image || "",
          rarity: cardResume.rarity || "Common",
          variants: cardResume.variants || {},
          pricing: null,
        },
        cardResume
      );
    }
  });

  const tcgplayerTestCard = fullCards.find(
    (card) => card?.pricing?.tcgplayer != null
  );

  const cardmarketTestCard = fullCards.find(
    (card) => card?.pricing?.cardmarket != null
  );

console.log("TCGplayer test card:", tcgplayerTestCard);
console.log("CardMarket test card:", cardmarketTestCard.pricing.cardmarket);

if (tcgplayerTestCard) {
  console.log(
    "TCGplayer id:",
    tcgplayerTestCard.pricing.tcgplayer.id,
    "name:",
    tcgplayerTestCard.name
  );
} else {
  console.log("No card found with tcgplayer id > 0 in this set.");
}

  return {
    id: apiSet.id,
    language: language === "ja" ? "Japanese" : "English",
    name: apiSet.name,
    serieId: apiSet.serie?.id || "unknown",
    serieName: apiSet.serie?.name || "",
    logo: apiSet.logo || null,
    symbol: apiSet.symbol || null,
    cards: fullCards,
  };
}