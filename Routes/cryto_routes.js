const CoinData = require("../Model/crypto_model");
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
require("dotenv").config();
const router = express.Router();

const cryptoIds = ["bitcoin", "ethereum", "matic-network"];

async function fetchCryptoData() {
  try {
    const currency = "usd";

    for (const cryptoId of cryptoIds) {
      const options = {
        method: "GET",
        url: `https://api.coingecko.com/api/v3/coins/${cryptoId}`,
        headers: {
          accept: "application/json",
          "x-cg-demo-api-key": process.env.API_KEY,
        },
      };

      const response = await axios.request(options);
      const price = response.data.market_data.current_price[currency];
      const marketCap = response.data.market_data.market_cap[currency];
      const change24hr = response.data.market_data.price_change_24h;

      console.log(`Coin: ${cryptoId}`);
      console.log("Price:", price);
      console.log("Market Cap:", marketCap);
      console.log("24hr Change:", change24hr);

      const coinData = new CoinData({
        coin: cryptoId,
        Price: price,
        FetchedAt: new Date(),
        Market_Cap: marketCap,
        Change24hr: change24hr,
      });

      await coinData.save();
    }
  } catch (error) {
    console.error("Error fetching or saving data:", error);
  }
}

cron.schedule("0 */2 * * *", () => {
  console.log("Running the cryptocurrency data fetch job...");
  fetchCryptoData();
});

fetchCryptoData();

function calculateStandardDeviation(prices) {
  const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;
  const variance =
    prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) /
    prices.length;
  return Math.sqrt(variance);
}

router.get("/get", async (req, res) => {
  try {
    const data = await CoinData.find({}).sort({ FetchedAt: -1 }).limit(3);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error retrieving data:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

router.get("/stats", async (req, res) => {
  const { coin } = req.query;

  if (!cryptoIds.includes(coin)) {
    return res.status(400).json({ error: "Invalid coin specified." });
  }

  try {
    const latestData = await CoinData.findOne({ coin }).sort({ FetchedAt: -1 });

    if (!latestData) {
      return res
        .status(404)
        .json({ error: "No data found for the specified coin." });
    }

    const responseData = {
      Coin: coin,
      price: latestData.Price,
      Market_Cap: latestData.Market_Cap,
      "24hrChange": latestData.Change24hr,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error retrieving stats:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

router.get("/deviation", async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: "Coin parameter is required." });
  }

  try {
    const records = await CoinData.find({ coin })
      .sort({ FetchedAt: -1 })
      .limit(100);

    if (records.length === 0) {
      return res.status(404).json({ error: "No records found for this coin." });
    }

    const prices = records.map((record) => record.Price);

    const deviation = calculateStandardDeviation(prices);

    res.status(200).json({ deviation, RecordsCount: records.length });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch or calculate deviation." });
  }
});

module.exports = router;
