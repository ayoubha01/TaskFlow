import { apiClient } from "./client.js";

export async function register({ email, password, name }) {
  const { data } = await apiClient.post("/auth/register", { email, password, name });
  return data;
}

export async function login({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

export async function updateMe(name) {
  const { data } = await apiClient.patch("/auth/me", { name });
  return data;
}