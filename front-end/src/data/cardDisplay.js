const BASE_RARITIES = new Set(["Common", "Uncommon", "Rare"]);

export const rarityIconMap = {
  Common: "/common.svg",
  Uncommon: "/uncommon.svg",
  Rare: "/rare.svg",
  "Rare Holo": "/rare-holo.svg",
  "Rare Holo V": "/rare-holo.svg",
  "Rare Holo VMAX": "/rare-holo.svg",
  "Rare Holo VSTAR": "/rare-holo.svg",
  "Rare Shiny": "/rare-holo.svg",
  "Amazing Rare": "/rare-holo.svg",
  "Rare Shiny GX": "/rare-holo.svg",
  "Rare Shiny V": "/rare-holo.svg",
  "Rare Shiny VMAX": "/rare-holo.svg",
  "Full Art": "/rare-holo.svg",
  "Reverse Holo Common": "/common-holo.svg",
  "Reverse Holo Uncommon": "/uncommon-holo.svg",
  "Reverse Holo Rare": "/rare-holo.svg",
  "Radiant Rare": "/rare-holo.svg",
  "Double Rare": "/rare-holo.svg",
  "Illustration Rare": "/rare-holo.svg",
  "Special Illustration Rare": "/rare-holo.svg",
  "Ultra Rare": "/rare-holo.svg",
  "Hyper Rare": "/rare-holo.svg",
  "Secret Rare": "/rare-holo.svg",
};

export function isReverseCard(card) {
  return card.pulledAs === "Reverse Holo";
}

export function isBaseRarity(rarity) {
  return BASE_RARITIES.has(rarity);
}

export function isRadiantCard(card) {
  return /^Radiant\b/i.test(card?.name || "");
}

export function isHoloOnlyRare(card) {
  return (
    card?.rarity === "Rare" &&
    card?.variants?.holo === true &&
    card?.variants?.normal === false
  );
}

function hasSpecialLocalId(card) {
  const localId = card?.localId || "";
  return !/^\d/.test(localId);
}

function isShinySvCard(card) {
  const localId = card?.localId || "";
  return /^SV/i.test(localId);
}

function hasNameHitMarker(card) {
  const name = card?.name || "";

  return (
    /\bEX\b/i.test(name) ||
    /\bVMAX\b/i.test(name) ||
    /\bVSTAR\b/i.test(name) ||
    /\bV\b/i.test(name)
  );
}

function hasNoVariants(card) {
  const normal = card?.variants?.normal === true;
  const reverse = card?.variants?.reverse === true;
  const holo = card?.variants?.holo === true;

  return !normal && !reverse && !holo;
}

function isPaldeanFatesShinyRare(card) {
  const setName = card?.setName || card?.set?.name || "";
  return setName === "Paldean Fates" && card?.rarity === "Rare" && hasNoVariants(card);
}

export function isFoilCard(card) {
  if (isReverseCard(card)) return false;

  if (isRadiantCard(card)) return true;
  if (isHoloOnlyRare(card)) return true;
  if (hasNoVariants(card)) return true;
  if (hasSpecialLocalId(card)) return true;
  if (hasNameHitMarker(card)) return true;

  return !isBaseRarity(card.rarity);
}

export function hasSpecialFinish(card) {
  if (!card) return false;

  if (hasNoVariants(card) || hasSpecialLocalId(card) || hasNameHitMarker(card)) {
    return true;
  }

  return isReverseCard(card) || isFoilCard(card);
}

export function getFinishClass(card) {
  if (isReverseCard(card)) return "reverse-holo-card";
  if (isFoilCard(card)) return "holo-card";
  return "";
}

export function hasSparkleFinish(card) {
  if (!card) return false;

  const hasNormalVariant = card?.variants?.normal === true;
  const hasReverseVariant = card?.variants?.reverse === true;
  const hasHoloVariant = card?.variants?.holo === true;

  if (hasReverseVariant && hasHoloVariant) {
    return false;
  }

  if (hasNoVariants(card) || hasSpecialLocalId(card) || hasNameHitMarker(card)) {
    return true;
  }

  return (
    isRadiantCard(card) ||
    card?.variants?.normal === false ||
    card?.rarity === "Illustration Rare" ||
    card?.rarity === "Special Illustration Rare" ||
    card?.rarity === "Hyper Rare"
  );
}

export function isCrownZenithGalarianGalleryV(card) {
  const name = card?.name || "";
  const localId = card?.localId || "";
  const setName = card?.setName || "";

  return (
    setName === "Crown Zenith" &&
    /^\s*GG/i.test(localId) &&
    /\bV\b/i.test(name)
  );
}

export function isHitCard(card) {
  if (!card) return false;

  if (hasNoVariants(card) || hasSpecialLocalId(card) || hasNameHitMarker(card)) {
    return true;
  }

  if (card.pulledAs === "Amazing Rare") {
    return true;
  }
  if (
    card.rarity === "Hyper Rare" ||
    card.rarity === "Special Illustration Rare" ||
    card.rarity === "Illustration Rare" ||
    card.rarity === "Double Rare" ||
    card.rarity === "Ultra Rare"
  ) {
    return true;
  }

  const hasNormalVariant = card?.variants?.normal === true;
  const hasReverseVariant = card?.variants?.reverse === true;
  const hasHoloVariant = card?.variants?.holo === true;

  if (hasReverseVariant && hasHoloVariant) {
    return false;
  }

  const isRegularReverse =
    hasNormalVariant &&
    hasReverseVariant &&
    card.pulledAs === "Reverse Holo" &&
    ["Common", "Uncommon", "Rare"].includes(card.rarity);

  const isRegularHoloRare =
    hasNormalVariant &&
    hasHoloVariant &&
    card.pulledAs === "Holo" &&
    card.rarity === "Holo Rare";

  if (isRegularReverse || isRegularHoloRare) {
    return false;
  }

  const isSpecialReverse =
    card.pulledAs === "Reverse Holo" && !hasNormalVariant;

  const isSpecialHolo =
    card.pulledAs === "Holo" &&
    (!hasNormalVariant || card.rarity !== "Holo Rare");

  if (
    isSpecialReverse ||
    isSpecialHolo ||
    card.pulledAs === "Slot 9 Special"
  ) {
    return true;
  }

  return false;
}

export function getCollectionDisplayRarity(card) {
  const name = card?.name || "";

  if (card.pulledAs === "Amazing Rare") {
    return "Amazing Rare";
  }

  if (
    card?.rarity === "Ultra Rare" ||
    card?.rarity === "Secret Rare" ||
    card?.rarity === "Hyper Rare"
  ) {
    return card.rarity;
  }

  if (isReverseCard(card)) {
    return `Reverse Holo ${card.rarity}`;
  }

  if (isRadiantCard(card)) {
    return "Radiant Rare";
  }

  if (isPaldeanFatesShinyRare(card) || isShinySvCard(card)) {
    const setName = card?.setName || card?.set?.name || "";

    if (setName === "Hidden Fates" && /\bGX\b/i.test(name)) {
      return "Rare Shiny GX";
    }

    if (/\bVMAX\b/i.test(name)) return "Rare Shiny VMAX";
    if (/\bV\b/i.test(name)) return "Rare Shiny V";
    return "Rare Shiny";
  }

  if (card?.rarity === "Holo Rare") {
    if (/\bVSTAR\b/i.test(name)) return "Rare Holo VSTAR";
    if (/\bVMAX\b/i.test(name)) return "Rare Holo VMAX";
    if (/\bV\b/i.test(name)) return "Rare Holo V";
    return "Rare Holo";
  }

  if (card?.rarity === "Double Rare") return "Double Rare";
  if (card?.rarity === "Illustration Rare") return "Illustration Rare";
  if (card?.rarity === "Special Illustration Rare") {
    return "Special Illustration Rare";
  }
  if (card?.rarity === "Ultra Rare") return "Ultra Rare";
  if (card?.rarity === "Hyper Rare") return "Hyper Rare";
  if (card?.rarity === "Secret Rare") return "Secret Rare";

  if (isHoloOnlyRare(card)) {
    return "Rare Holo";
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