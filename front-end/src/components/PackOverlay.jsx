import { getFinishClass, hasSpecialFinish } from "../data/cardDisplay";

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

  const commonRow = lastPack.slice(0, 5);
  const uncommonRow = lastPack.slice(5, 8);
  const rareRow = lastPack.slice(8, 10);

  const displayRows = [rareRow, uncommonRow, commonRow];

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
                const finishClass = getFinishClass(card);
                const isShiny = hasSpecialFinish(card);

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

                      <div
                        className={`flip-card-face flip-card-front ${finishClass}`}
                      >
                        <img src={card.image} alt={card.name} />
                        {isShiny && (
                          <>
                            <div className="iridescent-shine" />
                            <div className="card-gloss" />
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
                          </>
                        )}
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