import {
  getFinishClass,
  hasSpecialFinish,
  hasSparkleFinish,
  isHitCard,
} from "../data/cardDisplay";

export default function PackOverlay({
  isOpeningPack,
  lastPack,
  enteredCount,
  revealedCount,
  hitEffectCount,
  selectedSet,
  handleCloseOverlay,
  handleOpenAnotherPack,
}) {
  if (!isOpeningPack || lastPack.length === 0) {
    return null;
  }

  const isModern =
    selectedSet?.serieId !== "swsh" &&
    !["base", "ex", "dp", "pl", "hgss", "bw", "xy", "sm"].includes(
      selectedSet?.serieId
    );

  let displayRows;

  if (isModern) {
    const bottomRow = lastPack.slice(0, 4);
    const middleRow = lastPack.slice(4, 7);
    const topRow = lastPack.slice(7, 10);

    displayRows = [topRow, middleRow, bottomRow];
  } else {
    const commonRow = lastPack.slice(0, 5);
    const uncommonRow = lastPack.slice(5, 8);
    const rareRow = lastPack.slice(8, 10);

    displayRows = [rareRow, uncommonRow, commonRow];
  }

  const animationIndexById = {};
  lastPack.forEach((card, index) => {
    animationIndexById[card.id] = index;
  });

  const allCardsFlipped = revealedCount >= lastPack.length;

  return (
    <div className="pack-overlay" onClick={handleCloseOverlay}>
      <div
        className="pack-overlay-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pack-overlay-header">
          <h2>{selectedSet.name}</h2>

          <div className="pack-overlay-header-actions">
            <button
              className={`open-another-button ${
                allCardsFlipped ? "open-another-button-visible" : ""
              }`}
              onClick={handleOpenAnotherPack}
              type="button"
            >
              Open Another
            </button>

            <button
              className="close-overlay-button"
              onClick={handleCloseOverlay}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overlay-pack-rows">
          {displayRows.map((row, rowIndex) => (
            <div key={rowIndex} className="overlay-pack-row">
              {row.map((card, cardIndex) => {
                const animationIndex = animationIndexById[card.id];
                const hasEntered = animationIndex < enteredCount;
                const isFlipped = animationIndex < revealedCount;
                const hitEffectActive = animationIndex < hitEffectCount;
                const finishClass = getFinishClass(card);
                const isShiny = hasSpecialFinish(card);
                const hasSparkles = hasSparkleFinish(card);
                const isHit = isHitCard(card);

                return (
                  <div
                    key={`overlay-${card.id}-${cardIndex}`}
                    className={`flip-card-shell ${hasEntered ? "card-entered" : ""} ${
                      isHit && hitEffectActive ? "hit-card-shell" : ""
                    }`}
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
                        className={`flip-card-face flip-card-front ${finishClass} ${
                          isHit && hitEffectActive ? "hit-card-revealed" : ""
                        }`}
                      >
                        <img src={card.image} alt={card.name} />

                        {isShiny && <div className="iridescent-shine" />}
                        {isShiny && <div className="card-gloss" />}

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