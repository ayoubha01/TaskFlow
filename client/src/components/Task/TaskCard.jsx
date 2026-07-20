export default function TaskCard({ task, onDragStart, onClick }) {
  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
    >
      <p className="task-card__title">{task.title}</p>
      {task.assignedTo && (
        <span className="task-card__assignee" title={task.assignedTo.email}>
          {task.assignedTo.name}
        </span>
      )}
      {(task._count?.comments > 0 || task._count?.attachments > 0) && (
        <div className="task-card__meta">
          {task._count.comments > 0 && <span>💬 {task._count.comments}</span>}
          {task._count.attachments > 0 && <span>📎 {task._count.attachments}</span>}
        </div>
      )}
    </div>
  );
}