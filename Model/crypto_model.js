const mongoose = require("mongoose");

const coinDataSchema = new mongoose.Schema({
  coin: { type: String, required: true },
  Price: { type: Number, required: true },
  FetchedAt: { type: Date, default: Date.now },
  Market_Cap: { type: Number, required: true },
  Change24hr: { type: Number, required: true },
});

const CoinData = mongoose.model("CoinData", coinDataSchema);

module.exports = CoinData;
