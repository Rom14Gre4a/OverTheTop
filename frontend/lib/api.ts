import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err?.config?.url?.startsWith("/api/auth/");
    if (err?.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      document.cookie = "ott-token=; path=/; max-age=0";
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
