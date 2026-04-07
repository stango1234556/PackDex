import {
  getCollectionDisplayRarity,
  getFinishClass,
  getRarityIcon,
  hasSpecialFinish,
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
        const tcgplayerPrice = getTcgplayerMarketPrice(cardEntry);
        const formattedPrice = formatUsdPrice(tcgplayerPrice);

        console.log(cardEntry.pricing?.tcgplayer);

        return (
          <div
            key={`${cardEntry.id}-${cardEntry.pulledAs || "normal"}`}
            className="collection-card"
          >
            <div className={`collection-card-image-wrap ${finishClass}`}>
              <img src={cardEntry.image} alt={cardEntry.name} />
              {isShiny && <div className="card-gloss" />}
              {isShiny && <div className="iridescent-shine" />}
              {isShiny && (
                <div className="sparkle-stars">
                    {Array.from({ length: 24 }).map((_, index) => {
                        const top = 6 + ((index * 17) % 82);
                        const left = 5 + ((index * 29) % 86);
                        const size = 8 + ((index * 7) % 10);
                        const delay = ((index * 0.17) % 1.4).toFixed(2);
                        const duration = (1.6 + ((index * 0.15) % 1.2)).toFixed(2);

                        return (
                        <span
                                key={index}
                                className="sparkle"
                                style={{
                                top: `${top}%`,
                                left: `${left}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                animationDelay: `${delay}s`,
                                animationDuration: `${duration}s`,
                            }}
                        />
                        );
                    })}
                </div>
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