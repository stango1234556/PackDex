import {
  getCollectionDisplayRarity,
  getFinishClass,
  getRarityIcon,
  hasSpecialFinish,
  hasSparkleFinish,
  getTcgplayerSearchUrl,
  getTcgplayerMarketPrice,
  formatUsdPrice,
} from "../data/cardDisplay";

export default function CollectionGrid({
  collection,
  selectedSetId,
  selectedSet,
}) {
  const collectedCards = Object.values(collection);

  return (
    <div className="card-grid" key={selectedSetId}>
      {collectedCards.map((cardEntry) => {
        const displayRarity = getCollectionDisplayRarity(cardEntry);
        const rarityIcon = getRarityIcon(cardEntry);
        const finishClass = getFinishClass(cardEntry);
        const isShiny = hasSpecialFinish(cardEntry);
        const hasSparkles = hasSparkleFinish(cardEntry);
        const tcgplayerPrice = getTcgplayerMarketPrice(cardEntry);
        const formattedPrice = formatUsdPrice(tcgplayerPrice);

        return (
          <div
            key={`${cardEntry.id}-${cardEntry.pulledAs || "normal"}`}
            className="collection-card"
          >
            <div className={`collection-card-image-wrap ${finishClass}`}>
              <img src={cardEntry.image} alt={cardEntry.name} />
              {isShiny && <div className="card-gloss" />}
              {isShiny && <div className="iridescent-shine" />}

              {hasSparkles && (
                <video
                    className="sparkle-video-overlay"
                    src="/sparkles.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                />
              )}
            </div>

            <div className="collection-card-body">
              <div className="collection-card-header">
                <h4 className="card-name">{cardEntry.name}</h4>
                <span className="count-badge">x{cardEntry.count}</span>
              </div>

              <div className="rarity-row">
                {rarityIcon && (
                  <img
                    src={rarityIcon}
                    alt={displayRarity}
                    className="rarity-icon"
                  />
                )}
                <span className="rarity-label">{displayRarity}</span>
              </div>

              <a
                className="shop-card-button"
                href={getTcgplayerSearchUrl(cardEntry, selectedSet)}
                target="_blank"
                rel="noreferrer"
              >
                <span className="shop-card-left">SHOP CARD</span>
                <span className="shop-card-price">{formattedPrice || "--"}</span>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}