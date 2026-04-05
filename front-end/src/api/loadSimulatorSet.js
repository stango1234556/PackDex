import TCGdex from "@tcgdex/sdk";

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

function createTcgdexClient(language) {
  return new TCGdex(language === "ja" ? "ja" : "en");
}

export async function loadSimulatorSet(setId, language = "en") {
  const tcgdex = createTcgdexClient(language);

  const apiSet = await tcgdex.set.get(setId);

  if (!apiSet) {
    throw new Error(`Set not found for id "${setId}" in language "${language}"`);
  }

  if (!apiSet.cards || !Array.isArray(apiSet.cards)) {
    throw new Error(`Set "${setId}" did not return a cards array`);
  }

  console.log(
    "SET CARD IDS:",
    apiSet.cards.map((card) => ({
      id: card.id,
      localId: card.localId,
      name: card.name,
    }))
  );

  const tcgdx = new TCGdex('en');
  const testCard = await tcgdx.card.get("swsh3-136");
  console.log("HARDCODED SDK TEST:", {
    id: testCard.id,
    localId: testCard.localId,
    name: testCard.name,
    pricing: testCard.pricing,
    tcgplayer: testCard.pricing?.tcgplayer,
  });
  
  const fullCards = await Promise.all(
    apiSet.cards.map(async (cardResume) => {
      try {
        const fullCard = await tcgdex.card.get(cardResume.id);
        const serie = await tcgdex.fetch('series');

        console.log("FETCHED CARD:", {
          requestedId: cardResume.id,
          returnedId: fullCard.id,
          localId: fullCard.localId,
          name: fullCard.name,
          image: fullCard.image,
          tcgplayer: fullCard.pricing?.tcgplayer,
        });

        console.log("SET INFO:", {
          serie: serie,
        })

        return {
          id: fullCard.id,
          localId: fullCard.localId || "",
          name: fullCard.name,
          image: `${fullCard.image}/high.webp`,
          rarity: normalizeRarity(fullCard.rarity),
          variants: fullCard.variants || {},
          pricing: fullCard.pricing || null,
          canBeReverseHolo: fullCard.variants?.reverse === true,
          canBeHolo: fullCard.variants?.holo === true,
        };
      } catch (error) {
        console.log("FAILED CARD FETCH:", {
          requestedId: cardResume.id,
          name: cardResume.name,
          error,
        });

        return {
          id: cardResume.id,
          localId: cardResume.localId || "",
          name: cardResume.name,
          image: `${cardResume.image}/high.webp`,
          rarity: "Common",
          variants: {},
          pricing: null,
          canBeReverseHolo: false,
          canBeHolo: false,
        };
      }
    })
  );

  return {
    id: apiSet.id,
    language: language === "ja" ? "Japanese" : "English",
    name: apiSet.name,
    serieId: apiSet.serie?.id || "unknown",
    cards: fullCards,
  };
}