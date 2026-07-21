import { useEffect, useState, useCallback } from "react";
import TaskCard from "../Task/TaskCard.jsx";
import TaskModal from "../Task/TaskModal.jsx";
import { SocketProvider, useProjectSocket } from "../../context/SocketContext.jsx";
import * as tasksApi from "../../api/tasks.js";

const COLUMNS = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

export default function Board({ project, onProjectRefresh, onProjectDeleted }) {
  return (
    <SocketProvider projectId={project.id}>
      <BoardContent
        project={project}
        onProjectRefresh={onProjectRefresh}
        onProjectDeleted={onProjectDeleted}
      />
    </SocketProvider>
  );
}

function BoardContent({ project, onProjectDeleted }) {
  const [tasks, setTasks] = useState(project.tasks || []);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    setTasks(project.tasks || []);
  }, [project.tasks]);

  const upsertTask = useCallback((incoming) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === incoming.id);
      return exists ? prev.map((t) => (t.id === incoming.id ? incoming : t)) : [...prev, incoming];
    });
  }, []);

  const removeTask = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setTaskCount = useCallback((taskId, field, count) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, _count: { ...t._count, [field]: count } } : t
      )
    );
  }, []);

  useProjectSocket({
    "task:created": upsertTask,
    "task:statusChanged": upsertTask,
    "task:updated": upsertTask,
    "task:deleted": ({ id }) => removeTask(id),
    "task:commented": ({ taskId, commentCount }) => setTaskCount(taskId, "comments", commentCount),
    "task:attached": ({ taskId, attachmentCount }) => setTaskCount(taskId, "attachments", attachmentCount),
    "project:deleted": () => onProjectDeleted?.(),
  });

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await tasksApi.createTask({ projectId: project.id, title: newTaskTitle });
    setNewTaskTitle("");
  }

  function handleDragStart(e, task) {
    e.dataTransfer.setData("taskId", task.id);
  }

  async function handleDrop(e, status) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;

    const columnTasks = tasks.filter((t) => t.status === status);
    const position = columnTasks.length;

    // Optimistic update
    upsertTask({ ...task, status, position });
    await tasksApi.updateTaskStatus(taskId, { status, position });
  }

  return (
    <div className="board">
      <form onSubmit={handleCreateTask} className="board__new-task">
        <input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="New task title…"
        />
        <button type="submit">Add task</button>
      </form>

      <div className="board__columns">
        {COLUMNS.map((col) => {
          const columnTasks = tasks
            .filter((t) => t.status === col.key)
            .sort((a, b) => a.position - b.position);

          return (
            <div
              key={col.key}
              className="board__column"
              data-status={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="board__column-header">
                <h3>{col.label}</h3>
                <span className="board__column-count">
                  {String(columnTasks.length).padStart(2, "0")}
                </span>
              </div>
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onClick={setSelectedTask}
                />
              ))}
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={upsertTask}
          onDeleted={removeTask}
        />
      )}
    </div>
  );
}