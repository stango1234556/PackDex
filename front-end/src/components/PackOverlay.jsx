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

        <div className="overlay-pack-grid">
          {lastPack.map((card, index) => {
            const hasEntered = index < enteredCount;
            const isFlipped = index < revealedCount;

            return (
              <div
                key={`overlay-${card.id}-${index}`}
                className={`flip-card-shell ${hasEntered ? "card-entered" : ""}`}
              >
                <div
                  className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}
                >
                  <div className="flip-card-face flip-card-back">
                    <div className="card-back-design">
                      <span>Pokémon</span>
                    </div>
                  </div>

                  <div className="flip-card-face flip-card-front">
                    <img src={card.image} alt={card.name} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}