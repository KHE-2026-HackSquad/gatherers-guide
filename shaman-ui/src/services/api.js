// services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "/api",   // proxied to Express via vite.config.js
  timeout: 15000,
});

export async function fetchOmen(crop = "corn") {
  const { data } = await api.get(`/omens?crop=${crop}`);
  return data;
}

export async function fetchForecast() {
  const { data } = await api.get("/forecast");
  return data;
}

export default api;
