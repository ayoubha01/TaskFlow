import { apiClient } from "./client.js";

export async function fetchProjects() {
  const { data } = await apiClient.get("/projects");
  return data;
}

export async function fetchProject(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}`);
  return data;
}

export async function createProject({ name }) {
  const { data } = await apiClient.post("/projects", { name });
  return data;
}

export async function addProjectMember(projectId, userId) {
  const { data } = await apiClient.post(`/projects/${projectId}/members`, { userId });
  return data;
}

export async function inviteMemberByEmail(projectId, email) {
  const { data } = await apiClient.post(`/projects/${projectId}/invite`, { email });
  return data;
}