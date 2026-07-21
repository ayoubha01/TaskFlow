import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as projectsApi from "../api/projects.js";
import { useAuth } from "../context/AuthContext.jsx";
import Layout from "../components/Layout/Layout.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.fetchProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const project = await projectsApi.createProject({ name: newProjectName });
    setProjects((prev) => [project, ...prev]);
    setNewProjectName("");
  }

  async function handleDelete(project) {
    if (!confirm(`Delete "${project.name}"? This removes all its tasks permanently.`)) return;
    await projectsApi.deleteProject(project.id);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
  }

  function isOwner(project) {
    return project.members?.some((m) => m.userId === user.id && m.role === "owner");
  }

  return (
    <Layout>
      <div className="dashboard">
        <h1>Your Projects</h1>

        <form onSubmit={handleCreate} className="dashboard__new-project">
          <input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name…"
          />
          <button type="submit">Create project</button>
        </form>

        {loading ? (
          <p>Loading…</p>
        ) : projects.length === 0 ? (
          <p>No projects yet — create your first one above.</p>
        ) : (
          <ul className="project-list">
            {projects.map((project) => (
              <li key={project.id} className="project-list__row">
                <Link to={`/projects/${project.id}`} className="project-list__link">
                  {project.name}
                  <span className="project-list__count">
                    {project._count?.tasks ?? 0} tasks
                  </span>
                </Link>
                {isOwner(project) && (
                  <button
                    type="button"
                    className="project-list__delete"
                    onClick={() => handleDelete(project)}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}