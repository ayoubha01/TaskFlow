import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as projectsApi from "../api/projects.js";
import Layout from "../components/Layout/Layout.jsx";
import Board from "../components/Board/Board.jsx";

export default function ProjectBoard() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    projectsApi
      .fetchProject(projectId)
      .then(setProject)
      .catch((err) => setError(err.response?.data?.error || "Failed to load project"))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <Layout><p>Loading…</p></Layout>;
  if (error) return <Layout><p className="error">{error}</p></Layout>;

  return (
    <Layout>
      <div className="project-board-page">
        <div className="project-board-page__header">
          <Link to="/">← All projects</Link>
          <h1>{project.name}</h1>
        </div>
        <Board project={project} />
      </div>
    </Layout>
  );
}