import { tcgdexEn, tcgdexJp } from "./tcgdex";

function normalizeRarity(rarity) {
  if (!rarity) return "Common";

  const value = rarity.toLowerCase();

  if (
    value.includes("ultra") ||
    value.includes("secret") ||
    value.includes("hyper") ||
    value.includes("illustration") ||
    value.includes("special")
  ) {
    return "Ultra Rare";
  }

  if (value.includes("rare")) return "Rare";
  if (value.includes("uncommon")) return "Uncommon";
  return "Common";
}

function getPackLayoutForSet(setId) {
  if (setId === "swsh3") {
    return {
      Common: 5,
      Uncommon: 3,
      Rare: 2,
    };
  }

  return {
    Common: 5,
    Uncommon: 3,
    Rare: 2,
  };
}

export async function loadSimulatorSet(setId, language = "en") {
  const client = language === "ja" ? tcgdexJp : tcgdexEn;

  const apiSet = await client.fetch("sets", setId);

  if (!apiSet) {
    throw new Error(`Set not found for id "${setId}" in language "${language}"`);
  }

  if (!apiSet.cards || !Array.isArray(apiSet.cards)) {
    throw new Error(`Set "${setId}" did not return a cards array`);
  }

  const fullCards = await Promise.all(
    apiSet.cards.map(async (cardResume) => {
      try {
        const fullCard = await client.card.get(cardResume.id);

        return {
          id: fullCard.id,
          name: fullCard.name,
          image: `${fullCard.image}/high.webp`,
          rarity: normalizeRarity(fullCard.rarity),
        };
      } catch (error) {
        return {
          id: cardResume.id,
          name: cardResume.name,
          image: `${cardResume.image}/high.webp`,
          rarity: "Common",
        };
      }
    })
  );

  return {
    id: apiSet.id,
    language: language === "ja" ? "Japanese" : "English",
    name: apiSet.name,
    packSize:
      getPackLayoutForSet(apiSet.id).Common +
      getPackLayoutForSet(apiSet.id).Uncommon +
      getPackLayoutForSet(apiSet.id).Rare,
    packLayout: getPackLayoutForSet(apiSet.id),
    cards: fullCards,
  };
}