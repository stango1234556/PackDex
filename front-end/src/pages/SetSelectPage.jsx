import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TCGdex from "@tcgdex/sdk";

const EXCLUDED_SERIE_IDS = new Set(["misc", "mc", "tk", "tcgp", "pop"]);

const EXCLUDED_SET_NAMES = new Set([
  "Kalos Starter Set",
  "Pokémon Futsal 2020",
  "Pokémon Rumble",
  "Poké Card Creator Pack",
  "Southern Islands",
]);

const MANUAL_SET_LOGOS_BY_NAME = {
  "Dragon Majesty": "/set-logos/dragon-majesty.png",
  "Temporal Forces": "/set-logos/temporal-forces.png",
  "Shining Legends": "/set-logos/shining-legends.png",
};

function getSetLogoSrc(setInfo) {
  if (MANUAL_SET_LOGOS_BY_NAME[setInfo.name]) {
    return MANUAL_SET_LOGOS_BY_NAME[setInfo.name];
  }

  if (setInfo.logo) {
    return `${setInfo.logo}.png`;
  }

  return null;
}

function endsWithNumber(setId) {
  return /\d$/.test(setId);
}

export default function SetSelectPage() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
  async function logSunMoonSets() {
    const tcgdex = new TCGdex("en");
    const serie = await tcgdex.fetch("series", "swsh");

    console.log(
      "Sword and Shield sets:",
      serie.sets.map((set) => ({
        id: set.id,
        name: set.name,
        releaseDate: set.releaseDate,
        cardCount: set.cardCount,
      }))
    );
  }

  logSunMoonSets();
}, []);

  useEffect(() => {
    async function fetchSetList() {
      try {
        setIsLoading(true);
        setLoadError("");

        const tcgdex = new TCGdex("en");

        const allSeries = await tcgdex.fetch("series");
        const filteredSeries = allSeries.filter(
          (serieResume) => !EXCLUDED_SERIE_IDS.has(serieResume.id)
        );

        const fullSeries = await Promise.all(
          filteredSeries.map(async (serieResume) => {
            try {
              return await tcgdex.serie.get(serieResume.id);
            } catch (error) {
              console.error(`Failed to fetch serie ${serieResume.id}:`, error);
              return null;
            }
          })
        );

        const allSets = fullSeries
          .filter(Boolean)
          .flatMap((serie) =>
            (serie.sets || []).map((set) => ({
              ...set,
              serieId: serie.id,
              serieName: serie.name,
            }))
          );

        const filteredSets = allSets.filter(
          (set) => endsWithNumber(set.id) && !EXCLUDED_SET_NAMES.has(set.name)
        );

        const uniqueSets = Array.from(
          new Map(filteredSets.map((set) => [set.id, set])).values()
        );

        const sortedSets = [...uniqueSets]
          .sort((a, b) => {
            const aTime = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
            const bTime = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
            return aTime - bTime;
          })
          .reverse();

        setSets(sortedSets);
      } catch (error) {
        console.error("Failed to fetch set list:", error);
        setLoadError("Failed to load set list.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSetList();
  }, []);

  function handleSelectSet(setInfo) {
    navigate(`/simulator/en/${setInfo.id}`);
  }

  if (isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-spinner-wrap">
          <img
            src="/pokeball.svg"
            alt="Loading"
            className="loading-pokeball-spinner"
          />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app">
        <div className="layout">
          <section className="content">
            <p>{loadError}</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>PackDex</h1>
        </div>
      </header>

      <main className="layout">
        <section className="content">
          <h2>Select a Set</h2>

          <div className="set-select-grid">
            {sets.map((setInfo) => (
              <button
                key={setInfo.id}
                className="set-select-card"
                onClick={() => handleSelectSet(setInfo)}
              >
                {getSetLogoSrc(setInfo) && (
                  <div className="set-select-logo-wrap">
                    <img
                      src={getSetLogoSrc(setInfo)}
                      alt={`${setInfo.name} logo`}
                      className="set-select-logo"
                    />
                  </div>
                )}

                <div className="set-select-language">{setInfo.serieName}</div>
                <div className="set-select-name">{setInfo.name}</div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-disclaimer">
          <p>
            This website is an unofficial fan-made project and is not produced,
            endorsed, supported, or affiliated with Nintendo, The Pokémon Company,
            or GAME FREAK.
          </p>
          <p>
            Card prices, market values, and promotional offers are provided by
            third-party sources and are intended as estimates only. No guarantee is
            made regarding the accuracy, completeness, or timeliness of any pricing
            information. Please refer to official sellers and marketplaces for final
            prices and details.
          </p>
          <p>
            Pack simulation odds, card data, and set information are based on
            third-party resources and may not perfectly reflect real-world products.
            No guarantee is made regarding pull rates, card availability, or
            simulation accuracy. Please refer to official Pokémon TCG products for
            final results.
          </p>
        </div>
      </footer>
    </div>
  );
}