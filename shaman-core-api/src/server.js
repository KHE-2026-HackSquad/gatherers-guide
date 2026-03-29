const express  = require("express");
const cors     = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const omensRoutes   = require("./routes/omens");
const forecastRoutes = require("./routes/forecast");

app.get("/", (req, res) => res.json({ status: "The Tribe Backend is running" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/omens",    omensRoutes);
app.use("/forecast", forecastRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Shaman API running on port ${PORT}`));
