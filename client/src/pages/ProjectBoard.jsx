import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import * as projectsApi from "../api/projects.js";
import { useAuth } from "../context/AuthContext.jsx";
import Layout from "../components/Layout/Layout.jsx";
import Board from "../components/Board/Board.jsx";
import InviteMember from "../components/Project/InviteMember.jsx";

export default function ProjectBoard() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
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

  function handleMemberAdded(membership) {
    setProject((prev) => ({
      ...prev,
      members: [...prev.members, membership],
    }));
  }

  async function handleDeleteProject() {
    if (
      !confirm(
        `Delete "${project.name}"? This permanently removes all its tasks, comments, and attachments.`
      )
    )
      return;
    await projectsApi.deleteProject(project.id);
    navigate("/");
  }

  // Fires if another tab or member deletes this project while it's open here.
  function handleProjectDeletedRemotely() {
    alert("This project was deleted.");
    navigate("/");
  }

  if (loading) return <Layout><p>Loading…</p></Layout>;
  if (error) return <Layout><p className="error">{error}</p></Layout>;

  const isOwner = project.members.some((m) => m.userId === user.id && m.role === "owner");

  return (
    <Layout>
      <div className="project-board-page">
        <div className="project-board-page__header">
          <Link to="/">← All projects</Link>
          <div className="project-board-page__title-row">
            <h1>{project.name}</h1>
            {isOwner && (
              <button className="danger" onClick={handleDeleteProject}>
                Delete project
              </button>
            )}
          </div>
        </div>
        <InviteMember
          project={project}
          currentUserId={user.id}
          onMemberAdded={handleMemberAdded}
        />
        <Board project={project} onProjectDeleted={handleProjectDeletedRemotely} />
      </div>
    </Layout>
  );
}