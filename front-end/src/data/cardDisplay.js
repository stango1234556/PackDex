const BASE_RARITIES = new Set(["Common", "Uncommon", "Rare"]);

export const rarityIconMap = {
  Common: "/common.svg",
  Uncommon: "/uncommon.svg",
  Rare: "/rare.svg",
  "Holo Rare": "/rare-holo.svg",
  "Reverse Holo Common": "/common-holo.svg",
  "Reverse Holo Uncommon": "/uncommon-holo.svg",
  "Reverse Holo Rare": "/rare-holo.svg",
};

export function isReverseCard(card) {
  return card.pulledAs === "Reverse Holo";
}

export function isBaseRarity(rarity) {
  return BASE_RARITIES.has(rarity);
}

export function isFoilCard(card) {
  if (isReverseCard(card)) return false;
  return !isBaseRarity(card.rarity);
}

export function hasSpecialFinish(card) {
  return isReverseCard(card) || isFoilCard(card);
}

export function getFinishClass(card) {
  if (isReverseCard(card)) return "reverse-holo-card";
  if (isFoilCard(card)) return "holo-card";
  return "";
}

export function getCollectionDisplayRarity(card) {
  if (isReverseCard(card)) {
    return `Reverse Holo ${card.rarity}`;
  }

  return card.rarity;
}

export function getRarityIcon(card) {
  const displayRarity = getCollectionDisplayRarity(card);

  if (rarityIconMap[displayRarity]) {
    return rarityIconMap[displayRarity];
  }

  if (isReverseCard(card)) {
    if (card.rarity === "Common") return "/common-holo.svg";
    if (card.rarity === "Uncommon") return "/uncommon-holo.svg";
    return "/rare-holo.svg";
  }

  if (card.rarity === "Common") return "/common.svg";
  if (card.rarity === "Uncommon") return "/uncommon.svg";
  if (card.rarity === "Rare") return "/rare.svg";

  return "/rare-holo.svg";
}

export function getTcgplayerSearchUrl(card, selectedSet) {
  const isReverse = card.pulledAs === "Reverse Holo";
  const isFoil = !["Common", "Uncommon", "Rare"].includes(card.rarity);

  const parts = [card.name, selectedSet.name];

  if (isReverse) {
    parts.push("Reverse Holo");
  } else if (isFoil) {
    parts.push("Holo");
  }

  if (card.localId) {
    parts.push(card.localId);
  }

  const params = new URLSearchParams({
    productLineName: "pokemon",
    q: parts.join(" "),
  });

  if (isReverse) {
    params.set("Printing", "Reverse Holofoil");
  } else if (isFoil) {
    params.set("Printing", "Holofoil");
  }

  return `https://www.tcgplayer.com/search/pokemon/product?${params.toString()}`;
}

export function getTcgplayerMarketPrice(card) {
  if (card.pulledAs === "Reverse Holo") {
    return card.pricing?.tcgplayer?.reverse?.marketPrice ?? null;
  }

  return card.pricing?.tcgplayer?.normal?.marketPrice ?? null;
}

export function formatUsdPrice(price) {
  if (price == null) return null;
  return `$${Number(price).toFixed(2)}`;
}