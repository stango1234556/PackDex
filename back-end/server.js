const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const BASE_URL = "https://api.pokewallet.io";
const API_KEY = process.env.POKEWALLET_API_KEY;
console.log("API key loaded?", !!API_KEY);
console.log("API key prefix:", API_KEY ? API_KEY.slice(0, 12) : "missing");

async function fetchPokeWallet(path) {
  const url = `${BASE_URL}${path}`;
  console.log("Requesting:", url);

  const response = await fetch(url, {
    headers: {
      "X-API-Key": API_KEY,
    },
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response body:", text);

  if (!response.ok) {
    throw new Error(`PokéWallet request failed: ${response.status} ${text}`);
  }

  return JSON.parse(text);
}

app.get("/api/pokewallet/sets", async (req, res) => {
  try {
    const data = await fetchPokeWallet("/sets");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/pokewallet/sets/:setCode", async (req, res) => {
  try {
    const { setCode } = req.params;
    const page = req.query.page || 1;
    const limit = req.query.limit || 100;

    const data = await fetchPokeWallet(`/sets/${encodeURIComponent(setCode)}?page=${page}&limit=${limit}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/pokewallet/search", async (req, res) => {
  try {
    const q = req.query.q;
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;

    const data = await fetchPokeWallet(
      `/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/pokewallet/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const setCode = req.query.set_code;
    const suffix = setCode ? `?set_code=${encodeURIComponent(setCode)}` : "";

    const data = await fetchPokeWallet(`/cards/${encodeURIComponent(id)}${suffix}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/pokewallet/images/:id", async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/images/${encodeURIComponent(req.params.id)}?size=high`, {
      headers: {
        "X-API-Key": API_KEY,
      },
    });

    if (!response.ok) {
      return res.status(response.status).send("Image fetch failed");
    }

    res.set("Content-Type", response.headers.get("content-type") || "image/webp");
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Backend running on port ${process.env.PORT || 3001}`);
});