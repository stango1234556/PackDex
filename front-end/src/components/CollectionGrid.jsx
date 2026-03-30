export default function CollectionGrid({
  selectedSet,
  collection,
  selectedSetId,
}) {
  return (
    <div className="card-grid" key={selectedSetId}>
      {selectedSet.cards
        .filter((card) => (collection[card.id] || 0) > 0)
        .map((card) => {
          const owned = collection[card.id];

          return (
            <div key={card.id} className="collection-card">
              <img src={card.image} alt={card.name} />
              <h4 className="card-name">{card.name}</h4>
              <p className="count-badge">x{owned}</p>
            </div>
          );
        })}
    </div>
  );
}