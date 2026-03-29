const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import the single route file
const omensRoutes = require("./routes/omens"); 
const forecastRoutes = require("./routes/forecast");

const app = express();
app.use(cors());
app.use(express.json());

// Mount the routes
app.use("/omens", omensRoutes);
app.use("/forecast", forecastRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`THE SHAMAN IS AWAKE ON PORT ${PORT}`);
});