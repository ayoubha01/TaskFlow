import { useEffect, useState } from "react";
import * as tasksApi from "../../api/tasks.js";
import { useProjectSocket } from "../../context/SocketContext.jsx";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TaskModal({ task, onClose, onUpdated, onDeleted }) {
  const [description, setDescription] = useState(task.description || "");
  const [commentBody, setCommentBody] = useState("");
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [commentError, setCommentError] = useState(null);

  // Fetch the full task (real comments + attachments) every time the modal opens —
  // the board only has partial data (counts, not the actual lists).
  useEffect(() => {
    let cancelled = false;
    tasksApi.fetchTask(task.id).then((full) => {
      if (cancelled) return;
      setDescription(full.description || "");
      setComments(full.comments || []);
      setAttachments(full.attachments || []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  // Live updates while the modal is open: if another member comments or
  // uploads on this same task, reflect it without needing to reopen.
  // Dedupe by id, since our own actions already append locally.
  useProjectSocket({
    "task:commented": ({ taskId, comment: incoming }) => {
      if (taskId !== task.id) return;
      setComments((prev) => (prev.some((c) => c.id === incoming.id) ? prev : [...prev, incoming]));
    },
    "task:attached": ({ taskId, attachment: incoming }) => {
      if (taskId !== task.id) return;
      setAttachments((prev) =>
        prev.some((a) => a.id === incoming.id) ? prev : [...prev, incoming]
      );
    },
  });

  async function handleSaveDescription() {
    setSaving(true);
    try {
      const updated = await tasksApi.updateTask(task.id, { description });
      onUpdated({ ...updated, _count: { comments: comments.length, attachments: attachments.length } });
    } finally {
      setSaving(false);
    }
  }

  async function handlePostComment() {
    if (!commentBody.trim()) return;
    setCommentError(null);
    try {
      const newComment = await tasksApi.addComment(task.id, commentBody);
      setComments((prev) =>
        prev.some((c) => c.id === newComment.id) ? prev : [...prev, newComment]
      );
      setCommentBody("");
    } catch (err) {
      setCommentError(err.response?.data?.error || "Failed to post comment");
    }
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
    setUploading(true);
    try {
      const attachment = await tasksApi.uploadAttachment(task.id, file);
      setAttachments((prev) =>
        prev.some((a) => a.id === attachment.id) ? prev : [...prev, attachment]
      );
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleViewAttachment(attachment) {
    const url = await tasksApi.fetchAttachmentUrl(attachment.id);
    // Local-disk uploads return a relative path (/uploads/...) served by the API,
    // not the frontend — S3 uploads already return a full signed URL.
    const fullUrl = url.startsWith("/")
      ? `${import.meta.env.VITE_API_URL}${url}`
      : url;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{task.title}</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p className="hint">Loading task details…</p>
        ) : (
          <>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDescription}
              rows={4}
            />
            {saving && <span className="hint">Saving…</span>}

            <label>Attachments</label>
            <input type="file" onChange={handleFileUpload} disabled={uploading} />
            {uploading && <span className="hint">Uploading…</span>}

            {attachments.length > 0 && (
              <ul className="attachments">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="attachments__link"
                      onClick={() => handleViewAttachment(a)}
                    >
                      {a.fileName}
                    </button>
                    <span className="attachments__size">{formatSize(a.fileSize)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="comments">
              <h3>Comments</h3>
              {comments.length === 0 && <p className="hint">No comments yet.</p>}
              {comments.map((c) => (
                <div key={c.id} className="comment">
                  <strong>{c.author?.name || "Unknown"}</strong>
                  <p>{c.body}</p>
                </div>
              ))}
              <div className="comment-composer">
                <input
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                  placeholder="Write a comment…"
                />
                <button type="button" onClick={handlePostComment}>
                  Post
                </button>
              </div>
              {commentError && <p className="error">{commentError}</p>}
            </div>

            <button className="danger" onClick={handleDelete}>
              Delete task
            </button>
          </>
        )}
      </div>
    </div>
  );
}