const STATUS_LABEL = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TaskCard({ task, onDragStart, onClick }) {
  return (
    <div
      className="task-card"
      data-status={task.status}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
    >
      <div className="task-card__eyebrow">
        <span className="task-card__led" />
        {STATUS_LABEL[task.status]}
      </div>
      <p className="task-card__title">{task.title}</p>
      <div className="task-card__footer">
        {(task._count?.comments > 0 || task._count?.attachments > 0) && (
          <div className="task-card__meta">
            {task._count.comments > 0 && <span>💬 {task._count.comments}</span>}
            {task._count.attachments > 0 && <span>📎 {task._count.attachments}</span>}
          </div>
        )}
        {task.assignedTo && (
          <span className="task-card__avatar" title={task.assignedTo.name}>
            {initials(task.assignedTo.name)}
          </span>
        )}
      </div>
    </div>
  );
}