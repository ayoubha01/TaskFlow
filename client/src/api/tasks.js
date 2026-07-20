import { apiClient } from "./client.js";

export async function createTask({ projectId, title, description }) {
  const { data } = await apiClient.post("/tasks", { projectId, title, description });
  return data;
}

export async function updateTaskStatus(taskId, { status, position }) {
  const { data } = await apiClient.patch(`/tasks/${taskId}/status`, { status, position });
  return data;
}

export async function updateTask(taskId, updates) {
  const { data } = await apiClient.patch(`/tasks/${taskId}`, updates);
  return data;
}

export async function deleteTask(taskId) {
  await apiClient.delete(`/tasks/${taskId}`);
}

export async function addComment(taskId, body) {
  const { data } = await apiClient.post(`/tasks/${taskId}/comments`, { body });
  return data;
}

export async function uploadAttachment(taskId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post(`/uploads/${taskId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}