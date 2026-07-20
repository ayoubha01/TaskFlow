import { useState } from "react";
import * as tasksApi from "../../api/tasks.js";

export default function TaskModal({ task, onClose, onUpdated, onDeleted }) {
  const [description, setDescription] = useState(task.description || "");
  const [commentBody, setCommentBody] = useState("");
  const [comments, setComments] = useState(task.comments || []);
  const [saving, setSaving] = useState(false);

  async function handleSaveDescription() {
    setSaving(true);
    try {
      const updated = await tasksApi.updateTask(task.id, { description });
      onUpdated(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    const newComment = await tasksApi.addComment(task.id, commentBody);
    setComments((prev) => [...prev, newComment]);
    setCommentBody("");
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await tasksApi.deleteTask(task.id);
    onDeleted(task.id);
    onClose();
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    await tasksApi.uploadAttachment(task.id, file);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{task.title}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleSaveDescription}
          rows={4}
        />
        {saving && <span className="hint">Saving…</span>}

        <label>Attachment</label>
        <input type="file" onChange={handleFileUpload} />

        <div className="comments">
          <h3>Comments</h3>
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <strong>{c.author.name}</strong>
              <p>{c.body}</p>
            </div>
          ))}
          <form onSubmit={handleAddComment}>
            <input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment…"
            />
            <button type="submit">Post</button>
          </form>
        </div>

        <button className="danger" onClick={handleDelete}>
          Delete task
        </button>
      </div>
    </div>
  );
}