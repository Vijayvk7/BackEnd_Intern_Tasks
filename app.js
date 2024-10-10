require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./Routes/cryto_routes");
const app = express();

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Failed to Connect To MongoDB : ", err);
  });

app.listen(process.env.PORT, () => {
  console.log("Server is Running on Port 5000");
});

app.use("/api", userRoutes);
