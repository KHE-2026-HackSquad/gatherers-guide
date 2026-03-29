// services/api.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";
const api = axios.create({
  baseURL,
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

