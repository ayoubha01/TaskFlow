import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as projectsApi from "../api/projects.js";
import Layout from "../components/Layout/Layout.jsx";

export default function Dashboard() {
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
              <li key={project.id}>
                <Link to={`/projects/${project.id}`}>
                  {project.name}
                  <span className="project-list__count">
                    {project._count?.tasks ?? 0} tasks
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}