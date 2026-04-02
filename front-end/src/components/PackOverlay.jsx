export default function PackOverlay({
  isOpeningPack,
  lastPack,
  enteredCount,
  revealedCount,
  selectedSet,
  handleCloseOverlay,
}) {
  if (!isOpeningPack || lastPack.length === 0) {
    return null;
  }

  const commons = lastPack.filter((card) => card.rarity === "Common");
  const uncommons = lastPack.filter((card) => card.rarity === "Uncommon");
  const rares = lastPack.filter(
    (card) => card.rarity === "Rare" || card.rarity === "Ultra Rare"
  );

  const displayRows = [rares, uncommons, commons];

  const animationIndexById = {};
  lastPack.forEach((card, index) => {
    animationIndexById[card.id] = index;
  });

  return (
    <div className="pack-overlay" onClick={handleCloseOverlay}>
      <div
        className="pack-overlay-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pack-overlay-header">
          <h2>{selectedSet.name}</h2>
          <button
            className="close-overlay-button"
            onClick={handleCloseOverlay}
          >
            Close
          </button>
        </div>

        <div className="overlay-pack-rows">
          {displayRows.map((row, rowIndex) => (
            <div key={rowIndex} className="overlay-pack-row">
              {row.map((card, cardIndex) => {
                const animationIndex = animationIndexById[card.id];
                const hasEntered = animationIndex < enteredCount;
                const isFlipped = animationIndex < revealedCount;

                return (
                  <div
                    key={`overlay-${card.id}-${cardIndex}`}
                    className={`flip-card-shell ${hasEntered ? "card-entered" : ""}`}
                  >
                    <div
                      className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}
                    >
                      <div className="flip-card-face flip-card-back">
                        <img
                          src="/card-back.webp"
                          alt="Card back"
                          className="card-back-image"
                        />
                      </div>

                      <div className="flip-card-face flip-card-front">
                        <img src={card.image} alt={card.name} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}