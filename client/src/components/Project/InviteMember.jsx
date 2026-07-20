import { useState } from "react";
import * as projectsApi from "../../api/projects.js";

export default function InviteMember({ project, currentUserId, onMemberAdded }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isOwner = project.members.some(
    (m) => m.userId === currentUserId && m.role === "owner"
  );

  async function handleInvite(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const membership = await projectsApi.inviteMemberByEmail(project.id, email);
      onMemberAdded(membership);
      setSuccess(`${membership.user.name} added to the project`);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to invite member");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="invite-member">
      <h3>Members</h3>
      <ul className="invite-member__list">
        {project.members.map((m) => (
          <li key={m.id}>
            {m.user.name}
            <span className="invite-member__role">{m.role}</span>
          </li>
        ))}
      </ul>

      {isOwner && (
        <form onSubmit={handleInvite} className="invite-member__form">
          <input
            type="email"
            placeholder="Invite by email…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Inviting…" : "Invite"}
          </button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      {success && <p className="invite-member__success">{success}</p>}
    </div>
  );
}